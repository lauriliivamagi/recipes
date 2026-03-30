/** @type {import("syncpack").RcFile} */
export default {
  sortAz: [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
    "resolutions",
  ],
  sortFirst: [
    "name",
    "version",
    "private",
    "description",
    "type",
    "main",
    "module",
    "types",
    "exports",
    "files",
    "scripts",
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "engines",
    "packageManager",
  ],
  versionGroups: [
    {
      label: "Ban lodash (use native alternatives)",
      dependencies: ["lodash", "lodash-es", "lodash.*"],
      isBanned: true,
    },
    {
      label: "Allow pinned alpha/beta packages",
      dependencies: ["syncpack", "babel-plugin-react-compiler"],
      isIgnored: true,
    },
  ],
  semverGroups: [
    {
      label: "Use caret ranges for all dependencies",
      dependencyTypes: ["prod", "dev"],
      range: "^",
    },
  ],
};
