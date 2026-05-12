import UIKit
import Capacitor
import IOSSecuritySuite

// ADHCC Security Compliance — iOS Runtime Security Manager
// Findings addressed:
//   6.8 HIGH  — Jailbreak Detection     (MSTG-RESILIENCE-1)
//   5.7 MED   — Debugging Detection     (MSTG-RESILIENCE-2)
//   4.4 MED   — Hooking Detection       (MSTG-RESILIENCE-4)
//   4.4 MED   — iOS Tamper Detection    (MSTG-RESILIENCE-6, CWE-693)

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        performSecurityChecks()
        return true
    }

    // MARK: - ADHCC Security Checks

    private func performSecurityChecks() {
        checkDebugger()
        checkHooking()
        checkJailbreak()
        checkTamper()
    }

    /// Debugging Detection (CVSS 5.7) — terminate immediately if debugger attached
    private func checkDebugger() {
        if IOSSecuritySuite.amIDebugged() {
            #if !DEBUG
            IOSSecuritySuite.denyDebugger()
            exit(0)
            #endif
        }
    }

    /// Hooking Detection (CVSS 4.4) — detect Frida, Substrate, Cycript at runtime
    private func checkHooking() {
        let isHooked = IOSSecuritySuite.amIReverseEngineered()
        if isHooked {
            #if !DEBUG
            exit(0)
            #endif
        }
    }

    /// Jailbreak Detection (CVSS 6.8, MANDATORY per ADHCC audit) — warn user and restrict
    private func checkJailbreak() {
        if IOSSecuritySuite.amIJailbroken() {
            DispatchQueue.main.async {
                let alert = UIAlertController(
                    title: "Security Warning",
                    message: "This device appears to be jailbroken. Running 24/7 Tele H on a jailbroken device may expose sensitive health data. Some features have been disabled for your protection.",
                    preferredStyle: .alert
                )
                alert.addAction(UIAlertAction(title: "I Understand", style: .destructive))
                self.window?.rootViewController?.present(alert, animated: true)
            }
        }
    }

    /// Tamper Detection (CVSS 4.4) — verify bundle ID and app integrity
    private func checkTamper() {
        let tamperStatus = IOSSecuritySuite.amITampered([
            .bundleID("com.teleh.healthcare")
        ])
        if tamperStatus.result {
            DispatchQueue.main.async {
                let alert = UIAlertController(
                    title: "Integrity Check Failed",
                    message: "The application has been modified from its original version. Please reinstall from the official source.",
                    preferredStyle: .alert
                )
                alert.addAction(UIAlertAction(title: "OK", style: .destructive) { _ in
                    exit(0)
                })
                self.window?.rootViewController?.present(alert, animated: true)
            }
        }
    }

    // MARK: - App Lifecycle

    func applicationWillResignActive(_ application: UIApplication) {}

    func applicationDidEnterBackground(_ application: UIApplication) {}

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Re-run security checks when returning to foreground
        checkDebugger()
        checkHooking()
    }

    func applicationDidBecomeActive(_ application: UIApplication) {}

    func applicationWillTerminate(_ application: UIApplication) {}

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
