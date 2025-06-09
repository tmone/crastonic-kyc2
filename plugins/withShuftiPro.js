const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

module.exports = function withShuftiPro(config) {
  // Configure Android
  config = withAndroidManifest(config, async config => {
    const manifest = config.modResults;
    
    // Add permissions
    const permissions = manifest.manifest.permission || [];
    const requiredPermissions = [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.INTERNET'
    ];
    
    requiredPermissions.forEach(permission => {
      if (!permissions.find(p => p.$['android:name'] === permission)) {
        permissions.push({ $: { 'android:name': permission } });
      }
    });
    
    manifest.manifest.permission = permissions;
    return config;
  });

  // Configure iOS
  config = withInfoPlist(config, config => {
    config.modResults.NSCameraUsageDescription = 
      'This app needs access to camera for identity verification';
    config.modResults.NSMicrophoneUsageDescription = 
      'This app needs access to microphone for video verification';
    return config;
  });

  return config;
};