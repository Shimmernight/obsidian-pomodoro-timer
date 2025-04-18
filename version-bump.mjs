import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.argv[2];
const manifestFile = "manifest.json";
const packageFile = "package.json";
const versionsFile = "versions.json";

// read manifest.json
let manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
// read package.json
let packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
// update version
manifest.version = targetVersion;
packageJson.version = targetVersion;
// write manifest.json
writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
// write package.json
writeFileSync(packageFile, JSON.stringify(packageJson, null, 2));

// update versions.json (create if not exists)
let versions = {};
try {
    versions = JSON.parse(readFileSync(versionsFile, "utf8"));
} catch (e) {}

versions[targetVersion] = manifest.minAppVersion;
writeFileSync(versionsFile, JSON.stringify(versions, null, 2)); 