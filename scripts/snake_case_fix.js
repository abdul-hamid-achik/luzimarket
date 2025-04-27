#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Convert string to snake_case (handles camelCase, PascalCase, kebab-case)
function snakeCase(str) {
  let s = str.replace(/-/g, '_');
  s = s.replace(/([a-z0-9])([A-Z])/g, '$1_$2');
  return s.toLowerCase();
}

// Base directory
const baseDir = path.join(__dirname, '..', 'apps', 'frontend', 'src');

// Collect files and directories whose names contain uppercase letters or hyphens
const toRename = [];
function collect(dir) {
  fs.readdirSync(dir).forEach(item => {
    const full = path.join(dir, item);
    const stat = fs.lstatSync(full);
    if (/[A-Z\-]/.test(item)) {
      toRename.push(full);
    }
    if (stat.isDirectory()) {
      collect(full);
    }
  });
}
collect(baseDir);

// Sort deepest first to avoid conflicts
toRename.sort((a, b) => b.split(path.sep).length - a.split(path.sep).length);

// Rename via git mv to preserve history
toRename.forEach(oldPath => {
  const dir = path.dirname(oldPath);
  const base = path.basename(oldPath);
  const ext = path.extname(base);
  const name = base.slice(0, -ext.length);
  const newName = snakeCase(name) + ext.toLowerCase();
  if (newName !== base) {
    const newPath = path.join(dir, newName);
    if (fs.existsSync(newPath)) {
      console.warn(`Skip existing: ${newPath}`);
    } else {
      try {
        execSync(`git mv "${oldPath}" "${newPath}"`);
        console.log(`Renamed: ${oldPath} -> ${newPath}`);
      } catch (err) {
        console.error(`Failed to mv ${oldPath} -> ${newPath}: ${err.message}`);
      }
    }
  }
});

console.log('snake_case_fix complete.');