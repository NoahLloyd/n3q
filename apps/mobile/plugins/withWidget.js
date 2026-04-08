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

  // Step 2: Add widget target to Xcode project
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const targetName = WIDGET_NAME;
    const pbx = project.hash.project.objects;

    // Check if target already exists (safe lookup across PBXNativeTarget)
    const existingTarget = Object.keys(pbx.PBXNativeTarget || {}).find(
      (key) =>
        !key.endsWith("_comment") &&
        pbx.PBXNativeTarget[key].name &&
        pbx.PBXNativeTarget[key].name.replace(/"/g, "") === targetName
    );
    if (existingTarget) return config;

    // Copy widget files to ios project directory
    const widgetSourceDir = path.join(
      config.modRequest.projectRoot,
      "targets",
      "widget"
    );
    const iosWidgetDir = path.join(
      config.modRequest.platformProjectRoot,
      targetName
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
      path.join(iosWidgetDir, `${targetName}.entitlements`),
      entitlementsContent
    );

    // --- Generate UUIDs for all pbxproj entries ---
    const generateUuid = () => {
      const hex = "0123456789ABCDEF";
      let uuid = "";
      for (let i = 0; i < 24; i++)
        uuid += hex[Math.floor(Math.random() * 16)];
      return uuid;
    };

    // File references
    const swiftFileRefUuid = generateUuid();
    const plistFileRefUuid = generateUuid();
    const entitlementsFileRefUuid = generateUuid();
    const productRefUuid = generateUuid();

    // Build files
    const swiftBuildFileUuid = generateUuid();

    // Framework references and build files
    const widgetKitRefUuid = generateUuid();
    const swiftUIRefUuid = generateUuid();
    const widgetKitBuildFileUuid = generateUuid();
    const swiftUIBuildFileUuid = generateUuid();

    // Build phases
    const sourcesBuildPhaseUuid = generateUuid();
    const frameworksBuildPhaseUuid = generateUuid();
    const resourcesBuildPhaseUuid = generateUuid();

    // Group
    const groupUuid = generateUuid();

    // Target + config
    const targetUuid = generateUuid();
    const configListUuid = generateUuid();
    const debugConfigUuid = generateUuid();
    const releaseConfigUuid = generateUuid();

    // Embed phase (on main app target)
    const copyPhaseUuid = generateUuid();
    const copyBuildFileUuid = generateUuid();

    // Target dependency
    const targetDependencyUuid = generateUuid();
    const containerProxyUuid = generateUuid();

    // =============================================
    // 1. PBXFileReference entries
    // =============================================

    // Swift source file
    pbx.PBXFileReference[swiftFileRefUuid] = {
      isa: "PBXFileReference",
      lastKnownFileType: "sourcecode.swift",
      path: "N3QWidget.swift",
      sourceTree: "<group>",
    };
    pbx.PBXFileReference[`${swiftFileRefUuid}_comment`] = "N3QWidget.swift";

    // Info.plist
    pbx.PBXFileReference[plistFileRefUuid] = {
      isa: "PBXFileReference",
      lastKnownFileType: "text.plist.xml",
      path: "Info.plist",
      sourceTree: "<group>",
    };
    pbx.PBXFileReference[`${plistFileRefUuid}_comment`] = "Info.plist";

    // Entitlements
    pbx.PBXFileReference[entitlementsFileRefUuid] = {
      isa: "PBXFileReference",
      lastKnownFileType: "text.plist.entitlements",
      path: `${targetName}.entitlements`,
      sourceTree: "<group>",
    };
    pbx.PBXFileReference[`${entitlementsFileRefUuid}_comment`] =
      `${targetName}.entitlements`;

    // Product (.appex)
    pbx.PBXFileReference[productRefUuid] = {
      isa: "PBXFileReference",
      explicitFileType: '"wrapper.app-extension"',
      includeInIndex: 0,
      path: `${targetName}.appex`,
      sourceTree: "BUILT_PRODUCTS_DIR",
    };
    pbx.PBXFileReference[`${productRefUuid}_comment`] =
      `${targetName}.appex`;

    // WidgetKit.framework
    pbx.PBXFileReference[widgetKitRefUuid] = {
      isa: "PBXFileReference",
      lastKnownFileType: "wrapper.framework",
      name: "WidgetKit.framework",
      path: "System/Library/Frameworks/WidgetKit.framework",
      sourceTree: "SDKROOT",
    };
    pbx.PBXFileReference[`${widgetKitRefUuid}_comment`] =
      "WidgetKit.framework";

    // SwiftUI.framework
    pbx.PBXFileReference[swiftUIRefUuid] = {
      isa: "PBXFileReference",
      lastKnownFileType: "wrapper.framework",
      name: "SwiftUI.framework",
      path: "System/Library/Frameworks/SwiftUI.framework",
      sourceTree: "SDKROOT",
    };
    pbx.PBXFileReference[`${swiftUIRefUuid}_comment`] = "SwiftUI.framework";

    // =============================================
    // 2. PBXBuildFile entries
    // =============================================

    // Swift file -> Sources phase
    pbx.PBXBuildFile[swiftBuildFileUuid] = {
      isa: "PBXBuildFile",
      fileRef: swiftFileRefUuid,
      fileRef_comment: "N3QWidget.swift",
    };
    pbx.PBXBuildFile[`${swiftBuildFileUuid}_comment`] =
      "N3QWidget.swift in Sources";

    // WidgetKit -> Frameworks phase
    pbx.PBXBuildFile[widgetKitBuildFileUuid] = {
      isa: "PBXBuildFile",
      fileRef: widgetKitRefUuid,
      fileRef_comment: "WidgetKit.framework",
    };
    pbx.PBXBuildFile[`${widgetKitBuildFileUuid}_comment`] =
      "WidgetKit.framework in Frameworks";

    // SwiftUI -> Frameworks phase
    pbx.PBXBuildFile[swiftUIBuildFileUuid] = {
      isa: "PBXBuildFile",
      fileRef: swiftUIRefUuid,
      fileRef_comment: "SwiftUI.framework",
    };
    pbx.PBXBuildFile[`${swiftUIBuildFileUuid}_comment`] =
      "SwiftUI.framework in Frameworks";

    // Product -> Embed App Extensions phase
    pbx.PBXBuildFile[copyBuildFileUuid] = {
      isa: "PBXBuildFile",
      fileRef: productRefUuid,
      fileRef_comment: `${targetName}.appex`,
      settings: { ATTRIBUTES: ["RemoveHeadersOnCopy"] },
    };
    pbx.PBXBuildFile[`${copyBuildFileUuid}_comment`] =
      `${targetName}.appex in Embed App Extensions`;

    // =============================================
    // 3. PBXGroup for widget directory
    // =============================================

    pbx.PBXGroup[groupUuid] = {
      isa: "PBXGroup",
      children: [
        { value: swiftFileRefUuid, comment: "N3QWidget.swift" },
        { value: plistFileRefUuid, comment: "Info.plist" },
        {
          value: entitlementsFileRefUuid,
          comment: `${targetName}.entitlements`,
        },
      ],
      name: targetName,
      path: targetName,
      sourceTree: '"<group>"',
    };
    pbx.PBXGroup[`${groupUuid}_comment`] = targetName;

    // Add widget group to the main project group
    const mainGroupId = project.getFirstProject().firstProject.mainGroup;
    if (pbx.PBXGroup[mainGroupId]) {
      pbx.PBXGroup[mainGroupId].children.push({
        value: groupUuid,
        comment: targetName,
      });
    }

    // Add product to the Products group
    const productsGroupId = Object.keys(pbx.PBXGroup).find(
      (k) =>
        !k.endsWith("_comment") && pbx.PBXGroup[k].name === "Products"
    );
    if (productsGroupId) {
      pbx.PBXGroup[productsGroupId].children.push({
        value: productRefUuid,
        comment: `${targetName}.appex`,
      });
    }

    // Add framework refs to Frameworks group (create if needed)
    let frameworksGroupId = Object.keys(pbx.PBXGroup).find(
      (k) =>
        !k.endsWith("_comment") && pbx.PBXGroup[k].name === "Frameworks"
    );
    if (!frameworksGroupId) {
      frameworksGroupId = generateUuid();
      pbx.PBXGroup[frameworksGroupId] = {
        isa: "PBXGroup",
        children: [],
        name: "Frameworks",
        sourceTree: '"<group>"',
      };
      pbx.PBXGroup[`${frameworksGroupId}_comment`] = "Frameworks";
      pbx.PBXGroup[mainGroupId].children.push({
        value: frameworksGroupId,
        comment: "Frameworks",
      });
    }
    pbx.PBXGroup[frameworksGroupId].children.push(
      { value: widgetKitRefUuid, comment: "WidgetKit.framework" },
      { value: swiftUIRefUuid, comment: "SwiftUI.framework" }
    );

    // =============================================
    // 4. Build phases
    // =============================================

    // Sources
    pbx.PBXSourcesBuildPhase[sourcesBuildPhaseUuid] = {
      isa: "PBXSourcesBuildPhase",
      buildActionMask: 2147483647,
      files: [
        { value: swiftBuildFileUuid, comment: "N3QWidget.swift in Sources" },
      ],
      runOnlyForDeploymentPostprocessing: 0,
    };
    pbx.PBXSourcesBuildPhase[`${sourcesBuildPhaseUuid}_comment`] = "Sources";

    // Frameworks
    if (!pbx.PBXFrameworksBuildPhase) pbx.PBXFrameworksBuildPhase = {};
    pbx.PBXFrameworksBuildPhase[frameworksBuildPhaseUuid] = {
      isa: "PBXFrameworksBuildPhase",
      buildActionMask: 2147483647,
      files: [
        {
          value: widgetKitBuildFileUuid,
          comment: "WidgetKit.framework in Frameworks",
        },
        {
          value: swiftUIBuildFileUuid,
          comment: "SwiftUI.framework in Frameworks",
        },
      ],
      runOnlyForDeploymentPostprocessing: 0,
    };
    pbx.PBXFrameworksBuildPhase[`${frameworksBuildPhaseUuid}_comment`] =
      "Frameworks";

    // Resources (empty but required by Xcode)
    if (!pbx.PBXResourcesBuildPhase) pbx.PBXResourcesBuildPhase = {};
    pbx.PBXResourcesBuildPhase[resourcesBuildPhaseUuid] = {
      isa: "PBXResourcesBuildPhase",
      buildActionMask: 2147483647,
      files: [],
      runOnlyForDeploymentPostprocessing: 0,
    };
    pbx.PBXResourcesBuildPhase[`${resourcesBuildPhaseUuid}_comment`] =
      "Resources";

    // Embed App Extensions (added to the main app target)
    if (!pbx.PBXCopyFilesBuildPhase) pbx.PBXCopyFilesBuildPhase = {};
    pbx.PBXCopyFilesBuildPhase[copyPhaseUuid] = {
      isa: "PBXCopyFilesBuildPhase",
      buildActionMask: 2147483647,
      dstPath: '""',
      dstSubfolderSpec: 13, // App Extensions folder
      files: [
        {
          value: copyBuildFileUuid,
          comment: `${targetName}.appex in Embed App Extensions`,
        },
      ],
      name: '"Embed App Extensions"',
      runOnlyForDeploymentPostprocessing: 0,
    };
    pbx.PBXCopyFilesBuildPhase[`${copyPhaseUuid}_comment`] =
      "Embed App Extensions";

    // =============================================
    // 5. Build configurations for widget target
    // =============================================

    const sharedSettings = {
      ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME: "AccentColor",
      CLANG_ANALYZER_NONNULL: "YES",
      CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: "YES_AGGRESSIVE",
      CLANG_CXX_LANGUAGE_STANDARD: '"gnu++20"',
      CLANG_ENABLE_OBJC_WEAK: "YES",
      CLANG_WARN_DOCUMENTATION_COMMENTS: "YES",
      CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: "YES",
      CLANG_WARN_UNGUARDED_AVAILABILITY: "YES_AGGRESSIVE",
      CODE_SIGN_ENTITLEMENTS: `"${targetName}/${targetName}.entitlements"`,
      CODE_SIGN_STYLE: "Automatic",
      CURRENT_PROJECT_VERSION: "1",
      GCC_C_LANGUAGE_STANDARD: "gnu17",
      GENERATE_INFOPLIST_FILE: "YES",
      INFOPLIST_FILE: `"${targetName}/Info.plist"`,
      INFOPLIST_KEY_CFBundleDisplayName: `"${targetName}"`,
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
    };

    pbx.XCBuildConfiguration[debugConfigUuid] = {
      isa: "XCBuildConfiguration",
      buildSettings: {
        ...sharedSettings,
        DEBUG_INFORMATION_FORMAT: '"dwarf-with-dsym"',
        MTL_ENABLE_DEBUG_INFO: "INCLUDE_SOURCE",
        SWIFT_OPTIMIZATION_LEVEL: '"-Onone"',
      },
      name: "Debug",
    };
    pbx.XCBuildConfiguration[`${debugConfigUuid}_comment`] = "Debug";

    pbx.XCBuildConfiguration[releaseConfigUuid] = {
      isa: "XCBuildConfiguration",
      buildSettings: {
        ...sharedSettings,
        COPY_PHASE_STRIP: "NO",
        SWIFT_OPTIMIZATION_LEVEL: '"-Owholemodule"',
      },
      name: "Release",
    };
    pbx.XCBuildConfiguration[`${releaseConfigUuid}_comment`] = "Release";

    // =============================================
    // 6. XCConfigurationList for widget target
    // =============================================

    pbx.XCConfigurationList[configListUuid] = {
      isa: "XCConfigurationList",
      buildConfigurations: [
        { value: debugConfigUuid, comment: "Debug" },
        { value: releaseConfigUuid, comment: "Release" },
      ],
      defaultConfigurationIsVisible: 0,
      defaultConfigurationName: "Release",
    };
    pbx.XCConfigurationList[`${configListUuid}_comment`] =
      `Build configuration list for PBXNativeTarget "${targetName}"`;

    // =============================================
    // 7. PBXNativeTarget for the widget
    // =============================================

    pbx.PBXNativeTarget[targetUuid] = {
      isa: "PBXNativeTarget",
      buildConfigurationList: configListUuid,
      buildConfigurationList_comment: `Build configuration list for PBXNativeTarget "${targetName}"`,
      buildPhases: [
        { value: sourcesBuildPhaseUuid, comment: "Sources" },
        { value: frameworksBuildPhaseUuid, comment: "Frameworks" },
        { value: resourcesBuildPhaseUuid, comment: "Resources" },
      ],
      buildRules: [],
      dependencies: [],
      name: `"${targetName}"`,
      productName: `"${targetName}"`,
      productReference: productRefUuid,
      productReference_comment: `${targetName}.appex`,
      productType: '"com.apple.product-type.app-extension"',
    };
    pbx.PBXNativeTarget[`${targetUuid}_comment`] = targetName;

    // =============================================
    // 8. Add widget target to the project targets list
    // =============================================

    const projectSection =
      pbx.PBXProject[project.getFirstProject().uuid];
    projectSection.targets.push({
      value: targetUuid,
      comment: targetName,
    });

    // =============================================
    // 9. Target dependency: main app depends on widget
    // =============================================

    if (!pbx.PBXContainerItemProxy) pbx.PBXContainerItemProxy = {};
    pbx.PBXContainerItemProxy[containerProxyUuid] = {
      isa: "PBXContainerItemProxy",
      containerPortal: project.getFirstProject().uuid,
      containerPortal_comment: "Project object",
      proxyType: 1,
      remoteGlobalIDString: targetUuid,
      remoteInfo: `"${targetName}"`,
    };
    pbx.PBXContainerItemProxy[`${containerProxyUuid}_comment`] =
      "PBXContainerItemProxy";

    if (!pbx.PBXTargetDependency) pbx.PBXTargetDependency = {};
    pbx.PBXTargetDependency[targetDependencyUuid] = {
      isa: "PBXTargetDependency",
      target: targetUuid,
      target_comment: targetName,
      targetProxy: containerProxyUuid,
      targetProxy_comment: "PBXContainerItemProxy",
    };
    pbx.PBXTargetDependency[`${targetDependencyUuid}_comment`] =
      "PBXTargetDependency";

    // Add dependency + embed phase to the main app target
    const mainTarget = project.getFirstTarget();
    if (mainTarget && mainTarget.firstTarget) {
      const mainTargetObj =
        pbx.PBXNativeTarget[mainTarget.firstTarget.uuid];
      if (mainTargetObj) {
        // Add target dependency
        if (!mainTargetObj.dependencies) mainTargetObj.dependencies = [];
        mainTargetObj.dependencies.push({
          value: targetDependencyUuid,
          comment: "PBXTargetDependency",
        });

        // Add embed app extensions build phase
        mainTargetObj.buildPhases.push({
          value: copyPhaseUuid,
          comment: "Embed App Extensions",
        });
      }
    }

    return config;
  });

  return config;
}

module.exports = withWidgetTarget;
