const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
const appwriteMetroEntry = path.resolve(
  __dirname,
  "node_modules/appwrite/dist/cjs/sdk.js",
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "appwrite") {
    return {
      filePath: appwriteMetroEntry,
      type: "sourceFile",
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
