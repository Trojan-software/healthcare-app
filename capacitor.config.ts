import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.teleh.healthcare',
  appName: '24/7 Tele H',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  }
};

export default config;
