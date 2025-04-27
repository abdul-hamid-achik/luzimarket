#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Convert a string to snake_case
function snakeCase(str) {
  // Replace hyphens with underscores
  let s = str.replace(/-/g, '_');
  // Insert underscore before uppercase letter preceded by lowercase or digit
  s = s.replace(/([a-z0-9])([A-Z])/g, '$1_$2');
  return s.toLowerCase();
}

// Recursively walk a directory and return all file and directory paths
function walk(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach(item => {
    const p = path.join(dir, item);
    const stat = fs.lstatSync(p);
    if (stat.isDirectory()) {
      results.push(...walk(p));
      results.push(p);
    } else {
      results.push(p);
    }
  });
  return results;
}

// Base directory for refactoring
const baseDir = path.join(__dirname, '..', 'apps', 'frontend', 'src');

// Gather all paths under baseDir
let allPaths = [];
try {
  allPaths = walk(baseDir);
} catch (err) {
  console.error('Error reading directory:', err.message);
  process.exit(1);
}

// Sort by depth (deepest first) to rename children before parents
allPaths.sort((a, b) => b.split(path.sep).length - a.split(path.sep).length);

// Rename files and directories to snake_case
allPaths.forEach(oldPath => {
  const dir = path.dirname(oldPath);
  const base = path.basename(oldPath);
  const newBase = snakeCase(base);
  if (newBase !== base) {
    const newPath = path.join(dir, newBase);
    if (fs.existsSync(newPath)) {
      console.warn(`Skipping rename, target exists: ${oldPath} -> ${newPath}`);
    } else {
      try {
        if (base.toLowerCase() === newBase.toLowerCase()) {
          // Case-only rename: two-step via temporary name to handle case-insensitive filesystems
          const tempBase = newBase + '_tmp_rename';
          const tempPath = path.join(dir, tempBase);
          execSync(`git mv "${oldPath}" "${tempPath}"`);
          execSync(`git mv "${tempPath}" "${newPath}"`);
        } else {
          execSync(`git mv "${oldPath}" "${newPath}"`);
        }
        console.log(`Renamed: ${oldPath} -> ${newPath}`);
      } catch (err) {
        console.error(`Failed to rename ${oldPath}: ${err.message}`);
      }
    }
  }
});

// Update import/require/url paths in code files
const exts = new Set(['.js', '.jsx', '.ts', '.tsx', '.css']);

// Process a single file to update paths
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = content;
  // Patterns to update relative paths in imports, requires, dynamic imports, exports, and CSS urls
  const patterns = [
    { regex: /(\b(import|export)[\s\S]*?\bfrom\s*)['"](\.\.\/|\.\/)([^'"]+)['"]/g, prefix: '$1', hasSuffix: false },
    { regex: /(\brequire\(\s*)['"](\.\.\/|\.\/)([^'"]+)['"](\s*\))/g, prefix: '$1', hasSuffix: true },
    { regex: /(\bimport\(\s*)['"](\.\.\/|\.\/)([^'"]+)['"](\s*\))/g, prefix: '$1', hasSuffix: true },
    { regex: /(url\(\s*)['"](\.\.\/|\.\/)([^'"]+)['"](\s*\))/g, prefix: '$1', hasSuffix: true }
  ];
  patterns.forEach(pat => {
    updated = updated.replace(pat.regex, (match, p1, rel, p3, p4) => {
      const segments = p3.split('/');
      const newSegments = segments.map(seg => {
        const idx = seg.lastIndexOf('.');
        if (idx > 0) {
          const name = seg.slice(0, idx);
          const ext = seg.slice(idx);
          return snakeCase(name) + ext.toLowerCase();
        }
        return snakeCase(seg);
      });
      const newPath = rel + newSegments.join('/');
      if (pat.hasSuffix) {
        return p1 + `"${newPath}"` + p4;
      }
      return p1 + `"${newPath}"`;
    });
  });
  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`Updated imports in: ${filePath}`);
  }
}

// Walk again to process files
const allFiles = [];
walk(baseDir).forEach(p => {
  if (fs.lstatSync(p).isFile() && exts.has(path.extname(p))) {
    allFiles.push(p);
  }
});
allFiles.forEach(processFile);

console.log('Snake_case refactoring complete.');