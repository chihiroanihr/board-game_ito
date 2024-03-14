const config = {
  // Prettier configuration settings
  bracketSpacing: true,
  printWidth: 100,
  trailingComma: 'es5',
  tabWidth: 4,
  semi: false,
  singleQuote: true,
  endOfLine: 'auto',

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

module.exports = config;
