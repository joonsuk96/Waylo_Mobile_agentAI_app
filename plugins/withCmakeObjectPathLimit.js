const { withGradleProperties } = require("expo/config-plugins");

module.exports = function withCmakeObjectPathLimit(config) {
  return withGradleProperties(config, (mod) => {
    const key = "expo.android.cmakeObjectPathMax";
    mod.modResults = mod.modResults.filter((item) => item.type !== "property" || item.key !== key);
    if (process.platform === "win32") {
      // Keep CMake's generated object paths compatible with Windows MAX_PATH.
      mod.modResults.push({ type: "property", key, value: "250" });
    }
    return mod;
  });
};