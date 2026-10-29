require("dotenv").config({ quiet: true });

module.exports = ({ config }) => {
  const key = process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim();
  // Keep the local Windows CMake pin out of Linux EAS builds.
  const plugins = (config.plugins ?? []).map((plugin) => {
    if (process.platform === "win32" && process.env.EAS_BUILD !== "true")
      return plugin;
    if (!Array.isArray(plugin) || plugin[0] !== "expo-build-properties")
      return plugin;
    const options = { ...plugin[1], android: { ...plugin[1]?.android } };
    delete options.android.cmakeVersion;
    return [plugin[0], options];
  });
  return {
    ...config,
    plugins: [
      ...plugins.filter(
        (p) => (Array.isArray(p) ? p[0] : p) !== "react-native-maps",
      ),
      ["react-native-maps", key ? { androidGoogleMapsApiKey: key } : {}],
    ],
    extra: { ...config.extra, googleMapsConfigured: Boolean(key) },
  };
};
