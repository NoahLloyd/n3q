const { withXcodeProject, withEntitlementsPlist } = require("expo/config-plugins");
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

  // Add widget target to Xcode project
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const targetName = WIDGET_NAME;

    // Check if target already exists
    if (project.pbxTargetByName(targetName)) return config;

    // Copy widget files to ios project
    const widgetSourceDir = path.join(config.modRequest.projectRoot, "targets", "widget");
    const iosWidgetDir = path.join(config.modRequest.platformProjectRoot, targetName);
    fs.mkdirSync(iosWidgetDir, { recursive: true });

    const swiftSrc = path.join(widgetSourceDir, "N3QWidget.swift");
    if (fs.existsSync(swiftSrc)) {
      fs.copyFileSync(swiftSrc, path.join(iosWidgetDir, "N3QWidget.swift"));
    }

    const plistSrc = path.join(widgetSourceDir, "Info.plist");
    if (fs.existsSync(plistSrc)) {
      fs.copyFileSync(plistSrc, path.join(iosWidgetDir, "Info.plist"));
    }

    fs.writeFileSync(
      path.join(iosWidgetDir, `${targetName}.entitlements`),
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>${APP_GROUP}</string>
    </array>
</dict>
</plist>`
    );

    // --- Manually construct the widget target in pbxproj ---
    // This avoids the buggy addSourceFile which adds to the main target

    const generateUuid = () => {
      const hex = "0123456789ABCDEF";
      let uuid = "";
      for (let i = 0; i < 24; i++) uuid += hex[Math.floor(Math.random() * 16)];
      return uuid;
    };

    const fileRefUuid = generateUuid();
    const buildFileUuid = generateUuid();
    const groupUuid = generateUuid();
    const buildPhaseUuid = generateUuid();
    const targetUuid = generateUuid();
    const configListUuid = generateUuid();
    const debugConfigUuid = generateUuid();
    const releaseConfigUuid = generateUuid();
    const productRefUuid = generateUuid();
    const containerUuid = generateUuid();
    const copyPhaseUuid = generateUuid();
    const copyBuildFileUuid = generateUuid();

    const pbx = project.hash.project.objects;

    // 1. PBXFileReference for the Swift file
    pbx.PBXFileReference[fileRefUuid] = {
      isa: "PBXFileReference",
      lastKnownFileType: "sourcecode.swift",
      path: "N3QWidget.swift",
      sourceTree: "<group>",
    };
    pbx.PBXFileReference[`${fileRefUuid}_comment`] = "N3QWidget.swift";

    // 2. PBXFileReference for the product (.appex)
    pbx.PBXFileReference[productRefUuid] = {
      isa: "PBXFileReference",
      explicitFileType: '"wrapper.app-extension"',
      includeInIndex: 0,
      path: `${targetName}.appex`,
      sourceTree: "BUILT_PRODUCTS_DIR",
    };
    pbx.PBXFileReference[`${productRefUuid}_comment`] = `${targetName}.appex`;

    // 3. PBXBuildFile
    pbx.PBXBuildFile[buildFileUuid] = {
      isa: "PBXBuildFile",
      fileRef: fileRefUuid,
      fileRef_comment: "N3QWidget.swift",
    };
    pbx.PBXBuildFile[`${buildFileUuid}_comment`] = "N3QWidget.swift in Sources";

    // 4. PBXGroup for the widget directory
    pbx.PBXGroup[groupUuid] = {
      isa: "PBXGroup",
      children: [{ value: fileRefUuid, comment: "N3QWidget.swift" }],
      name: targetName,
      path: targetName,
      sourceTree: '"<group>"',
    };
    pbx.PBXGroup[`${groupUuid}_comment`] = targetName;

    // Add group to main project group
    const mainGroupId = project.getFirstProject().firstProject.mainGroup;
    pbx.PBXGroup[mainGroupId].children.push({ value: groupUuid, comment: targetName });

    // Add product to Products group
    const productsGroupId = project.pbxGroupByName("Products")?.uuid ||
      Object.keys(pbx.PBXGroup).find((k) => !k.endsWith("_comment") && pbx.PBXGroup[k].name === "Products");
    if (productsGroupId) {
      pbx.PBXGroup[productsGroupId].children.push({ value: productRefUuid, comment: `${targetName}.appex` });
    }

    // 5. PBXSourcesBuildPhase
    pbx.PBXSourcesBuildPhase[buildPhaseUuid] = {
      isa: "PBXSourcesBuildPhase",
      buildActionMask: 2147483647,
      files: [{ value: buildFileUuid, comment: "N3QWidget.swift in Sources" }],
      runOnlyForDeploymentPostprocessing: 0,
    };
    pbx.PBXSourcesBuildPhase[`${buildPhaseUuid}_comment`] = "Sources";

    // 6. Build configurations
    const sharedSettings = {
      ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME: "AccentColor",
      CODE_SIGN_ENTITLEMENTS: `"${targetName}/${targetName}.entitlements"`,
      CURRENT_PROJECT_VERSION: "1",
      GENERATE_INFOPLIST_FILE: "YES",
      INFOPLIST_FILE: `"${targetName}/Info.plist"`,
      INFOPLIST_KEY_CFBundleDisplayName: `"${targetName}"`,
      INFOPLIST_KEY_NSHumanReadableCopyright: '""',
      IPHONEOS_DEPLOYMENT_TARGET: "17.0",
      LD_RUNPATH_SEARCH_PATHS: '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"',
      MARKETING_VERSION: "1.0",
      PRODUCT_BUNDLE_IDENTIFIER: `"${WIDGET_BUNDLE_ID}"`,
      PRODUCT_NAME: `"$(TARGET_NAME)"`,
      SKIP_INSTALL: "YES",
      SWIFT_EMIT_LOC_STRINGS: "YES",
      SWIFT_VERSION: "5.0",
      TARGETED_DEVICE_FAMILY: '"1,2"',
    };

    pbx.XCBuildConfiguration[debugConfigUuid] = {
      isa: "XCBuildConfiguration",
      buildSettings: { ...sharedSettings, DEBUG_INFORMATION_FORMAT: '"dwarf-with-dsym"', MTL_ENABLE_DEBUG_INFO: "INCLUDE_SOURCE", SWIFT_OPTIMIZATION_LEVEL: '"-Onone"' },
      name: "Debug",
    };
    pbx.XCBuildConfiguration[`${debugConfigUuid}_comment`] = "Debug";

    pbx.XCBuildConfiguration[releaseConfigUuid] = {
      isa: "XCBuildConfiguration",
      buildSettings: { ...sharedSettings, SWIFT_OPTIMIZATION_LEVEL: '"-Owholemodule"' },
      name: "Release",
    };
    pbx.XCBuildConfiguration[`${releaseConfigUuid}_comment`] = "Release";

    // 7. XCConfigurationList
    pbx.XCConfigurationList[configListUuid] = {
      isa: "XCConfigurationList",
      buildConfigurations: [
        { value: debugConfigUuid, comment: "Debug" },
        { value: releaseConfigUuid, comment: "Release" },
      ],
      defaultConfigurationIsVisible: 0,
      defaultConfigurationName: "Release",
    };
    pbx.XCConfigurationList[`${configListUuid}_comment`] = `Build configuration list for PBXNativeTarget "${targetName}"`;

    // 8. PBXNativeTarget
    pbx.PBXNativeTarget[targetUuid] = {
      isa: "PBXNativeTarget",
      buildConfigurationList: configListUuid,
      buildConfigurationList_comment: `Build configuration list for PBXNativeTarget "${targetName}"`,
      buildPhases: [{ value: buildPhaseUuid, comment: "Sources" }],
      buildRules: [],
      dependencies: [],
      name: `"${targetName}"`,
      productName: `"${targetName}"`,
      productReference: productRefUuid,
      productReference_comment: `${targetName}.appex`,
      productType: '"com.apple.product-type.app-extension"',
    };
    pbx.PBXNativeTarget[`${targetUuid}_comment`] = targetName;

    // 9. Add target to project
    const projectSection = pbx.PBXProject[project.getFirstProject().uuid];
    projectSection.targets.push({ value: targetUuid, comment: targetName });

    // 10. Embed widget in main app (PBXCopyFilesBuildPhase)
    pbx.PBXBuildFile[copyBuildFileUuid] = {
      isa: "PBXBuildFile",
      fileRef: productRefUuid,
      fileRef_comment: `${targetName}.appex`,
      settings: { ATTRIBUTES: ["RemoveHeadersOnCopy"] },
    };
    pbx.PBXBuildFile[`${copyBuildFileUuid}_comment`] = `${targetName}.appex in Embed App Extensions`;

    if (!pbx.PBXCopyFilesBuildPhase) pbx.PBXCopyFilesBuildPhase = {};
    pbx.PBXCopyFilesBuildPhase[copyPhaseUuid] = {
      isa: "PBXCopyFilesBuildPhase",
      buildActionMask: 2147483647,
      dstPath: '""',
      dstSubfolderSpec: 13, // App Extensions
      files: [{ value: copyBuildFileUuid, comment: `${targetName}.appex in Embed App Extensions` }],
      name: '"Embed App Extensions"',
      runOnlyForDeploymentPostprocessing: 0,
    };
    pbx.PBXCopyFilesBuildPhase[`${copyPhaseUuid}_comment`] = "Embed App Extensions";

    // Add embed phase to main app target
    const mainTarget = project.getFirstTarget();
    if (mainTarget && mainTarget.firstTarget) {
      const mainTargetObj = pbx.PBXNativeTarget[mainTarget.firstTarget.uuid];
      if (mainTargetObj) {
        mainTargetObj.buildPhases.push({ value: copyPhaseUuid, comment: "Embed App Extensions" });
      }
    }

    return config;
  });

  return config;
}

module.exports = withWidgetTarget;
