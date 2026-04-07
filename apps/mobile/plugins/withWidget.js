const { withXcodeProject, withEntitlementsPlist, withInfoPlist } = require("expo/config-plugins");
const path = require("path");
const fs = require("fs");

const APP_GROUP = "group.com.n3q.app";
const WIDGET_NAME = "N3QWidget";
const WIDGET_BUNDLE_ID = "com.n3q.app.widget";

function withWidgetTarget(config) {
  // Add App Group to main app entitlements
  config = withEntitlementsPlist(config, (config) => {
    config.modResults["com.apple.security.application-groups"] = [APP_GROUP];
    return config;
  });

  // Add App Group to main app Info.plist
  config = withInfoPlist(config, (config) => {
    return config;
  });

  // Add widget target to Xcode project
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const targetName = WIDGET_NAME;

    // Check if target already exists
    const existingTarget = project.pbxTargetByName(targetName);
    if (existingTarget) return config;

    // Copy widget files to ios project
    const widgetSourceDir = path.join(
      config.modRequest.projectRoot,
      "targets",
      "widget"
    );
    const iosWidgetDir = path.join(
      config.modRequest.platformProjectRoot,
      targetName
    );

    if (!fs.existsSync(iosWidgetDir)) {
      fs.mkdirSync(iosWidgetDir, { recursive: true });
    }

    // Copy Swift file
    const swiftSource = path.join(widgetSourceDir, "N3QWidget.swift");
    const swiftDest = path.join(iosWidgetDir, "N3QWidget.swift");
    if (fs.existsSync(swiftSource)) {
      fs.copyFileSync(swiftSource, swiftDest);
    }

    // Copy Info.plist
    const plistSource = path.join(widgetSourceDir, "Info.plist");
    const plistDest = path.join(iosWidgetDir, "Info.plist");
    if (fs.existsSync(plistSource)) {
      fs.copyFileSync(plistSource, plistDest);
    }

    // Create entitlements for widget
    const entitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>${APP_GROUP}</string>
    </array>
</dict>
</plist>`;
    fs.writeFileSync(path.join(iosWidgetDir, `${targetName}.entitlements`), entitlements);

    // Add widget extension target
    const widgetTarget = project.addTarget(
      targetName,
      "app_extension",
      targetName,
      WIDGET_BUNDLE_ID
    );

    // Add source files to target
    const groupKey = project.pbxCreateGroup(targetName, targetName);
    const mainGroupId = project.getFirstProject().firstProject.mainGroup;
    project.addToPbxGroup(groupKey, mainGroupId);

    project.addSourceFile(
      `${targetName}/N3QWidget.swift`,
      { target: widgetTarget.uuid },
      groupKey
    );

    // Set build settings
    const configurations = project.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      if (typeof configurations[key] === "object" && configurations[key].buildSettings) {
        const bs = configurations[key].buildSettings;
        if (bs.PRODUCT_NAME === `"${targetName}"` || bs.PRODUCT_NAME === targetName) {
          bs.SWIFT_VERSION = "5.0";
          bs.IPHONEOS_DEPLOYMENT_TARGET = "17.0";
          bs.CODE_SIGN_ENTITLEMENTS = `${targetName}/${targetName}.entitlements`;
          bs.INFOPLIST_FILE = `${targetName}/Info.plist`;
          bs.TARGETED_DEVICE_FAMILY = '"1,2"';
          bs.ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = "AccentColor";
        }
      }
    }

    return config;
  });

  return config;
}

module.exports = withWidgetTarget;
