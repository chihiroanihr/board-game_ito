module.exports = {
  // Prettier configuration settings
  bracketSpacing: true,
  printWidth: 100,
  tabWidth: 2,
  semi: true,
  singleQuote: true,

  // Prettier ignore patterns
  ignore: [
    // List of files and directories to ignore
    'node_modules',
    'dist',
    '.env',
    '**/package.json',
    '**/package-lock.json',
    '**/tsconfig.*.json',
  ],
};
