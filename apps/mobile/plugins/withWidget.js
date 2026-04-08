const { withXcodeProject, withEntitlementsPlist } = require("expo/config-plugins");
const path = require("path");
const fs = require("fs");

const APP_GROUP = "group.com.n3q.app";
const WIDGET_NAME = "N3QWidget";
const WIDGET_BUNDLE_ID = "com.n3q.app.widget";

function withWidgetTarget(config) {
  // Step 1: Add App Group to main app entitlements
  config = withEntitlementsPlist(config, (config) => {
    config.modResults["com.apple.security.application-groups"] = [APP_GROUP];
    return config;
  });

  // Step 2: Add widget target to Xcode project using xcode lib API
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const pbx = project.hash.project.objects;

    // Check if target already exists
    const existingTarget = project.pbxTargetByName(WIDGET_NAME);
    if (existingTarget) return config;

    // Copy widget files to ios project directory
    const widgetSourceDir = path.join(
      config.modRequest.projectRoot,
      "targets",
      "widget"
    );
    const iosWidgetDir = path.join(
      config.modRequest.platformProjectRoot,
      WIDGET_NAME
    );
    fs.mkdirSync(iosWidgetDir, { recursive: true });

    const swiftSrc = path.join(widgetSourceDir, "N3QWidget.swift");
    if (fs.existsSync(swiftSrc)) {
      fs.copyFileSync(swiftSrc, path.join(iosWidgetDir, "N3QWidget.swift"));
    }

    const plistSrc = path.join(widgetSourceDir, "Info.plist");
    if (fs.existsSync(plistSrc)) {
      fs.copyFileSync(plistSrc, path.join(iosWidgetDir, "Info.plist"));
    }

    // Write widget entitlements
    const entitlementsContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>${APP_GROUP}</string>
    </array>
</dict>
</plist>`;
    fs.writeFileSync(
      path.join(iosWidgetDir, `${WIDGET_NAME}.entitlements`),
      entitlementsContent
    );

    // --- Use xcode lib API to add the target ---

    // 1. Create the widget target (app_extension type)
    const target = project.addTarget(
      WIDGET_NAME,
      "app_extension",
      WIDGET_NAME,
      WIDGET_BUNDLE_ID
    );
    const targetUuid = target.uuid;

    // 2. Create a PBXGroup for the widget files and add to main group
    const widgetGroup = project.addPbxGroup(
      [],
      WIDGET_NAME,
      WIDGET_NAME,
      '"<group>"'
    );
    const widgetGroupUuid = widgetGroup.uuid;

    // Add widget group to the main project group
    const mainGroupId = project.getFirstProject().firstProject.mainGroup;
    project.addToPbxGroup(
      { fileRef: widgetGroupUuid, basename: WIDGET_NAME },
      mainGroupId
    );

    // 3. Add the Swift source file to the widget target
    project.addSourceFile(
      `${WIDGET_NAME}/N3QWidget.swift`,
      { target: targetUuid },
      widgetGroupUuid
    );

    // 4. Add frameworks to the widget target
    project.addFramework("WidgetKit.framework", {
      target: targetUuid,
      link: true,
    });
    project.addFramework("SwiftUI.framework", {
      target: targetUuid,
      link: true,
    });

    // 5. Add target dependency: main app depends on widget
    const mainTarget = project.getFirstTarget();
    if (mainTarget && mainTarget.firstTarget) {
      project.addTargetDependency(mainTarget.firstTarget.uuid, [targetUuid]);
    }

    // 6. Add "Embed App Extensions" copy phase to main target
    if (mainTarget && mainTarget.firstTarget) {
      const productFileRef = target.pbxNativeTarget.productReference;

      // Create the embed phase via addBuildPhase
      const embedPhase = project.addBuildPhase(
        [],
        "PBXCopyFilesBuildPhase",
        "Embed App Extensions",
        mainTarget.firstTarget.uuid,
        "app_extension"
      );

      if (embedPhase && embedPhase.buildPhase) {
        // Add the widget .appex to the embed phase
        const embedBuildFileUuid = project.generateUuid();
        pbx.PBXBuildFile[embedBuildFileUuid] = {
          isa: "PBXBuildFile",
          fileRef: productFileRef,
          fileRef_comment: `${WIDGET_NAME}.appex`,
          settings: { ATTRIBUTES: ["RemoveHeadersOnCopy"] },
        };
        pbx.PBXBuildFile[`${embedBuildFileUuid}_comment`] =
          `${WIDGET_NAME}.appex in Embed App Extensions`;

        embedPhase.buildPhase.files.push({
          value: embedBuildFileUuid,
          comment: `${WIDGET_NAME}.appex in Embed App Extensions`,
        });
      }
    }

    // 7. Update widget target build settings
    const configListUuid =
      target.pbxNativeTarget.buildConfigurationList;
    const configList = pbx.XCConfigurationList[configListUuid];

    if (configList && configList.buildConfigurations) {
      for (const configRef of configList.buildConfigurations) {
        const configUuid =
          typeof configRef === "object" ? configRef.value : configRef;
        const buildConfig = pbx.XCBuildConfiguration[configUuid];
        if (!buildConfig) continue;

        Object.assign(buildConfig.buildSettings, {
          ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME: "AccentColor",
          CLANG_ANALYZER_NONNULL: "YES",
          CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: "YES_AGGRESSIVE",
          CLANG_CXX_LANGUAGE_STANDARD: '"gnu++20"',
          CLANG_ENABLE_OBJC_WEAK: "YES",
          CLANG_WARN_DOCUMENTATION_COMMENTS: "YES",
          CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: "YES",
          CLANG_WARN_UNGUARDED_AVAILABILITY: "YES_AGGRESSIVE",
          CODE_SIGN_ENTITLEMENTS: `"${WIDGET_NAME}/${WIDGET_NAME}.entitlements"`,
          CODE_SIGN_STYLE: "Automatic",
          CURRENT_PROJECT_VERSION: "1",
          GCC_C_LANGUAGE_STANDARD: "gnu17",
          GENERATE_INFOPLIST_FILE: "YES",
          INFOPLIST_FILE: `"${WIDGET_NAME}/Info.plist"`,
          INFOPLIST_KEY_CFBundleDisplayName: `"${WIDGET_NAME}"`,
          INFOPLIST_KEY_NSHumanReadableCopyright: '""',
          IPHONEOS_DEPLOYMENT_TARGET: "17.0",
          LD_RUNPATH_SEARCH_PATHS:
            '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"',
          LOCALIZATION_PREFERS_STRING_CATALOGS: "YES",
          MARKETING_VERSION: "1.0",
          PRODUCT_BUNDLE_IDENTIFIER: `"${WIDGET_BUNDLE_ID}"`,
          PRODUCT_NAME: '"$(TARGET_NAME)"',
          SKIP_INSTALL: "YES",
          SWIFT_ACTIVE_COMPILATION_CONDITIONS: '"$(inherited)"',
          SWIFT_EMIT_LOC_STRINGS: "YES",
          SWIFT_VERSION: "5.0",
          TARGETED_DEVICE_FAMILY: '"1,2"',
        });
      }
    }

    return config;
  });

  return config;
}

module.exports = withWidgetTarget;
