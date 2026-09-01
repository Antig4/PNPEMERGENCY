const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = ({ config }) => {
  // Inject android:usesCleartextTraffic="true" into AndroidManifest.xml
  // This permits HTTP requests to local IP addresses (http://192.168.1.29:8000/api) on physical Android devices.
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    if (androidManifest && androidManifest.manifest && androidManifest.manifest.application) {
      androidManifest.manifest.application[0].$['android:usesCleartextTraffic'] = 'true';
    }
    return config;
  });

  return {
    ...config,
  };
};
