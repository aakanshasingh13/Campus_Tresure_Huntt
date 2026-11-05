import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.campusquest.app',
  appName: 'CampusQuest',
  webDir: 'dist',
  android: {
    allowMixedContent: true
  }
};

export default config;
