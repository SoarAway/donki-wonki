const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const workspaceRoot = path.resolve(__dirname, '..');
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  projectRoot: __dirname,
  watchFolders: [workspaceRoot],

  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },

  resolver: {
    assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
  },
};

module.exports = mergeConfig(defaultConfig, config);
