const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔍 Looking for Android SDK...\n');

// Common Android SDK locations
const possiblePaths = [
  // Windows paths
  path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk'),
  path.join(os.homedir(), 'AppData', 'Local', 'Android', 'sdk'),
  'C:\\Android\\sdk',
  'C:\\android-sdk',
  path.join('C:', 'Program Files', 'Android', 'Android Studio', 'sdk'),
  path.join('C:', 'Program Files (x86)', 'Android', 'android-sdk'),
  
  // macOS paths
  path.join(os.homedir(), 'Library', 'Android', 'sdk'),
  '/usr/local/share/android-sdk',
  '/opt/android-sdk',
  
  // Linux paths
  path.join(os.homedir(), 'Android', 'Sdk'),
  path.join(os.homedir(), 'android-sdk'),
  '/opt/android-sdk',
  '/usr/local/android-sdk',
];

// Check ANDROID_HOME environment variable
const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
if (androidHome) {
  console.log(`✅ Found ANDROID_HOME environment variable: ${androidHome}`);
  possiblePaths.unshift(androidHome);
}

// Find the SDK
let sdkPath = null;
for (const possiblePath of possiblePaths) {
  try {
    if (fs.existsSync(possiblePath)) {
      // Check if it's a valid SDK directory by looking for key folders
      const platformTools = path.join(possiblePath, 'platform-tools');
      const tools = path.join(possiblePath, 'tools');
      const platforms = path.join(possiblePath, 'platforms');
      
      if (fs.existsSync(platformTools) || fs.existsSync(tools) || fs.existsSync(platforms)) {
        sdkPath = possiblePath;
        console.log(`✅ Found Android SDK at: ${sdkPath}`);
        break;
      }
    }
  } catch (error) {
    // Ignore errors for paths that don't exist
  }
}

if (!sdkPath) {
  console.log('❌ Android SDK not found!\n');
  console.log('Please install Android Studio or the Android SDK and try again.');
  console.log('\nYou can download Android Studio from:');
  console.log('https://developer.android.com/studio\n');
  console.log('After installation, run this script again or manually update');
  console.log('android/local.properties with your SDK path.');
  process.exit(1);
}

// Update local.properties
const localPropertiesPath = path.join(__dirname, '..', 'android', 'local.properties');
const content = `## This file must *NOT* be checked into Version Control Systems,
# as it contains information specific to your local configuration.
#
# Location of the SDK. This is only used by Gradle.
# For customization when using a Version Control System, please read the
# header note.

sdk.dir=${sdkPath.replace(/\\/g, '\\\\')}
`;

try {
  fs.writeFileSync(localPropertiesPath, content);
  console.log('\n✅ Successfully updated android/local.properties');
  console.log(`   SDK path: ${sdkPath}`);
  
  // Set environment variable suggestion
  console.log('\n💡 To avoid this in the future, set the ANDROID_HOME environment variable:');
  if (process.platform === 'win32') {
    console.log(`   setx ANDROID_HOME "${sdkPath}"`);
  } else {
    console.log(`   export ANDROID_HOME="${sdkPath}"`);
    console.log('   Add this to your ~/.bashrc or ~/.zshrc file');
  }
  
  console.log('\n🚀 You can now run: npx expo run:android');
} catch (error) {
  console.error('❌ Failed to update local.properties:', error.message);
  console.log(`\nPlease manually update android/local.properties with:`);
  console.log(`sdk.dir=${sdkPath.replace(/\\/g, '\\\\')}`);
}