// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle Firebase polyfills
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...config.resolver.extraNodeModules,
  },
};

// Add source extensions
config.resolver.sourceExts = [...(config.resolver.sourceExts || []), 'mjs', 'cjs'];

module.exports = config;

