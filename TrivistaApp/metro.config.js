const { getDefaultConfig } = require("@expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const defaultConfig  = getDefaultConfig(__dirname);

defaultConfig.resolver.sourceExts.push('cjs');

// This is the new line you should add in, after the previous lines
defaultConfig.resolver.unstable_enablePackageExports = false;


// Add resolution for Firebase subpath exports
defaultConfig .resolver.sourceExts = [...defaultConfig .resolver.sourceExts, "mjs", "cjs"];
defaultConfig .resolver.extraNodeModules = {
  ...defaultConfig .resolver.extraNodeModules,
};

// Export with NativeWind default configuration
module.exports = withNativeWind(defaultConfig , { input: "./global.css" });