// @ts-check

/** @type {import("syncpack").RcFile} */
const config = {
  versionGroups: [
    {
      label: 'Use workspace protocol for internal packages',
      dependencies: ['@recipe/*'],
      dependencyTypes: ['prod', 'dev'],
      pinVersion: 'workspace:*',
    },
    {
      label: 'Use caret ranges for everything else',
      dependencies: ['**'],
      dependencyTypes: ['prod', 'dev'],
      policy: 'sameRange',
    },
  ],
  sortFirst: [
    'name',
    'version',
    'private',
    'type',
    'main',
    'types',
    'exports',
    'scripts',
    'dependencies',
    'devDependencies',
    'peerDependencies',
  ],
  sortAz: [
    'dependencies',
    'devDependencies',
    'peerDependencies',
  ],
};

export default config;
