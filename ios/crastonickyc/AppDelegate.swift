import Expo
import React
import ReactAppDependencyProvider
import AVFoundation

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)

    // Set exception handler to prevent crashes
    NSSetUncaughtExceptionHandler { exception in
        NSLog("CRASH: %@", exception)
        NSLog("Stack Trace: %@", exception.callStackSymbols)
    }

    // Pre-warm camera permission
    AVCaptureDevice.requestAccess(for: .video) { granted in
        NSLog("Camera permission pre-warmed: \(granted)")
    }

    // Fix for UIKit view controller presentation issues
    if #available(iOS 13.0, *) {
        // Force the app to use traditional presentation style for all view controllers
        UIViewController.attemptRotationToDeviceOrientation()
        for windowScene in UIApplication.shared.connectedScenes {
            if let scene = windowScene as? UIWindowScene {
                for window in scene.windows {
                    if let rootVC = window.rootViewController {
                        rootVC.modalPresentationStyle = .fullScreen
                    }
                }
            }
        }
    }

    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // Force direct loading of our custom entry point
    return bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    // Use CustomApp.js as entry point to bypass Expo client
    let settings = RCTBundleURLProvider.sharedSettings()
    let url = settings.jsBundleURL(forBundleRoot: "CustomApp")
    if let url = url {
        NSLog("Using custom entry point: %@", url.absoluteString)
        return url
    } else {
        NSLog("Failed to get custom entry point URL, falling back to index")
        return settings.jsBundleURL(forBundleRoot: "index")
    }
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
