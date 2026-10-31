import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartnotesai.app',
  appName: 'Smartnotes AI',
  webDir: 'dist',
  android: {
    backgroundColor: '#0B1F3A',
    allowMixedContent: false,
  },
};

export default config;
