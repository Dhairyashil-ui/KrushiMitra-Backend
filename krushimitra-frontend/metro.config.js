const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Platform-specific alias resolution
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
// Enable package "exports" field resolution for libraries like Firebase v12+
// (Metro needs this flag to properly resolve subpath imports such as 'firebase/auth').
config.resolver.unstable_enablePackageExports = true;

// Custom resolver to handle react-native-pager-view on web
const originalResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-pager-view' && platform === 'web') {
    return {
      filePath: path.resolve(__dirname, 'components/PagerViewWeb.tsx'),
      type: 'sourceFile',
    };
  }
  
  if (originalResolver) {
    return originalResolver(context, moduleName, platform);
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;