#import "AppDelegate.h"
#import "GeneratedPluginRegistrant.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  [GeneratedPluginRegistrant registerWithRegistry:self];
    FlutterViewController* flutterViewController = (FlutterViewController*)self.window.rootViewController;
  // Override point for customization after application launch.
    self.sdkHc03 = [[SDKHealthMoniter alloc]init];
    [self.sdkHc03 initMessageChannel:flutterViewController];
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

@end
