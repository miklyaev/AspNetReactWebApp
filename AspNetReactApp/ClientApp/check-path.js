// This script checks for characters in the project path that break webpack-dev-server
// Specifically '#' and other characters that are not safely encoded in a file:// or ws:// URL
const path = require('path');
const problematic = ['#'];
const cwd = process.cwd();
for (const ch of problematic) {
  if (cwd.indexOf(ch) !== -1) {
    console.error(`Error: Current path contains a character that breaks webpack dev server: "${ch}"\nPath: ${cwd}\nPlease move the project to a path without '${ch}' or run the dev server from a different folder.`);
    process.exit(1);
  }
}
process.exit(0);
