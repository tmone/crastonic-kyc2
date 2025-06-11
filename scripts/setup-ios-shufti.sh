#!/bin/bash

# ShuftiPro iOS Setup Script
# This script helps set up the iOS environment for ShuftiPro integration

echo "Setting up iOS environment for ShuftiPro integration..."

# Navigate to the iOS directory
cd ios

# Clean Pods if needed
if [ "$1" == "--clean" ]; then
  echo "Cleaning pod cache..."
  pod cache clean --all
  rm -rf Pods
  rm -rf Podfile.lock
  rm -rf build
  rm -rf ~/Library/Developer/Xcode/DerivedData/*
fi

# Install pods with repo update
echo "Installing pods (this may take a while)..."
pod install --repo-update

# Go back to project root
cd ..

echo "Setup complete!"
echo "Next steps:"
echo "1. Run 'npx expo run:ios' to build and run the app"
echo "2. Follow the testing instructions in IOS_SHUFTI_INTEGRATION.md"

exit 0