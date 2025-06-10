#!/bin/bash

echo "🍎 iOS Setup Script for Crastonic KYC"
echo "===================================="

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script must be run on macOS to set up iOS development"
    echo "   You can still develop for Android on your current system."
    exit 1
fi

# Check for Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode is not installed"
    echo "   Please install Xcode from the Mac App Store"
    exit 1
fi

# Check Xcode version
XCODE_VERSION=$(xcodebuild -version | grep "Xcode" | cut -d ' ' -f2 | cut -d '.' -f1)
if [ "$XCODE_VERSION" -lt 14 ]; then
    echo "⚠️  Xcode version $XCODE_VERSION detected. Version 14+ is recommended"
fi

echo "✅ Xcode is installed"

# Check for CocoaPods
if ! command -v pod &> /dev/null; then
    echo "📦 Installing CocoaPods..."
    sudo gem install cocoapods
else
    echo "✅ CocoaPods is installed"
fi

# Install pods
echo ""
echo "📦 Installing iOS dependencies..."
cd ios

# Remove old pods if they exist
if [ -d "Pods" ]; then
    echo "🧹 Cleaning old pods..."
    pod deintegrate
    rm -rf Pods
    rm -f Podfile.lock
fi

# Install fresh pods
pod install

if [ $? -eq 0 ]; then
    echo "✅ iOS dependencies installed successfully"
else
    echo "❌ Failed to install iOS dependencies"
    exit 1
fi

cd ..

# Check for simulator
echo ""
echo "📱 Checking iOS Simulators..."
SIMULATORS=$(xcrun simctl list devices available | grep -E "iPhone|iPad" | wc -l)
if [ $SIMULATORS -eq 0 ]; then
    echo "❌ No iOS simulators found"
    echo "   Open Xcode > Window > Devices and Simulators to download simulators"
else
    echo "✅ Found $SIMULATORS iOS simulators"
fi

echo ""
echo "🎉 iOS setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: npx expo run:ios"
echo "2. Or open ios/crastonickyc.xcworkspace in Xcode"
echo ""
echo "For device testing:"
echo "- Connect your iPhone and run: npx expo run:ios --device"
echo "- Make sure to trust your development certificate on the device"