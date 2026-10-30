import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.anthpal.xtv',
  appName: 'x TV',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    // Permite peticiones nativas (sin CORS) al manifiesto y a los APK.
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
