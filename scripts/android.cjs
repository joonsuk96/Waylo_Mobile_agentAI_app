const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const androidEnv = { ...process.env };
const extraPaths = [];

if (process.platform === "win32") {
  const javaCandidates = [
    androidEnv.JAVA_HOME,
    path.join(androidEnv.ProgramFiles || "C:\\Program Files", "Android", "Android Studio", "jbr"),
  ].filter(Boolean);
  const javaHome = javaCandidates.find((candidate) => fs.existsSync(path.join(candidate, "bin", "javac.exe")));
  const sdkCandidates = [
    androidEnv.ANDROID_HOME,
    androidEnv.ANDROID_SDK_ROOT,
    path.join(androidEnv.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "Android", "Sdk"),
  ].filter(Boolean);
  const sdkHome = sdkCandidates.find((candidate) => fs.existsSync(path.join(candidate, "platform-tools", "adb.exe")));

  if (javaHome) {
    androidEnv.JAVA_HOME = javaHome;
    extraPaths.push(path.join(javaHome, "bin"));
  }
  if (sdkHome) {
    androidEnv.ANDROID_HOME = sdkHome;
    extraPaths.push(path.join(sdkHome, "platform-tools"), path.join(sdkHome, "emulator"));
  }
  const pathKey = Object.keys(androidEnv).find((key) => key.toLowerCase() === "path") || "Path";
  androidEnv[pathKey] = [...extraPaths, androidEnv[pathKey] || ""].join(path.delimiter);
}

const args = process.argv.slice(2);
const devOnly = args[0] === "--dev";
if (devOnly) args.shift();
const command = devOnly ? ["start", "--dev-client", "--android"] : ["run:android"];
// Use the PC network address by default; explicit host options still take priority.
const hasHostOverride = args.some((arg) => ["--host", "--lan", "--tunnel", "--localhost"].includes(arg));
if (devOnly && !hasHostOverride) command.push("--lan");
const result = spawnSync(process.execPath, [require.resolve("expo/bin/cli"), ...command, ...args], {
  cwd: projectRoot,
  env: androidEnv,
  stdio: "inherit",
});
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
