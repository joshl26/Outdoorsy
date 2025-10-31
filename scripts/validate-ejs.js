#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * validate-ejs.js
 * Strip EJS tags into safe placeholders for static validation,
 * run html-validate on the temporary HTML output, and clean up.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { glob } = require('glob');

/**
 * Strip EJS tags but leave placeholders so elements aren't empty.
 * This prevents false positives like "empty-title" or "missing-alt".
 */
function stripEJS(src) {
  return src
    .replace(/<%#[\s\S]*?%>/g, '') // EJS comments
    .replace(/<%=\s*[\s\S]*?\s*%>/g, 'X') // Output tags -> placeholder
    .replace(/<%-\s*[\s\S]*?\s*%>/g, 'X') // Unescaped output -> placeholder
    .replace(/<%(?![=-])[\s\S]*?%>/g, ''); // Logic blocks removed
}

// Get all .ejs files across views/
const files = glob.sync('views/**/*.ejs');

// Create a temporary directory for stripped HTML
const tmpDir = path.join(__dirname, '../.tmp-html-validate');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Strip EJS and write temporary HTML files
const tempFiles = [];
files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const stripped = stripEJS(content);
  const relative = path.relative('views', file);
  // Preserve folder structure in tmp dir
  const outputPath = path.join(tmpDir, relative);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath.replace(/\.ejs$/, '.html'), stripped, 'utf8');
  tempFiles.push(outputPath);
});

try {
  console.log('\n🔍 Running html-validate on stripped EJS templates...\n');
  execSync(`npx html-validate "${tmpDir}/**/*.html" --formatter stylish`, {
    stdio: 'inherit',
  });
  console.log('\n✅ HTML validation completed successfully!\n');
} catch (err) {
  console.error('\n❌ HTML validation failed. See errors above.\n');
  process.exit(1);
} finally {
  // Clean up temp files
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
