#!/usr/bin/env node
/*
 i18n parity and duplicate check
 - Ensures messages/en.json and messages/es.json have identical flattened key sets
 - Fails if duplicates (same property name repeated within the same object) are present
 - Scans code for referenced i18n keys and fails when a referenced key is missing
   (supports getTranslations/useTranslations base + t("child") and getMessage(locale, "path"))
 - Detects case-only collisions in message keys (same key ignoring case with different casing)
*/
const fs = require('fs');
const path = require('path');

function flatten(obj, prefix = '') {
  const result = {};
  if (!obj || typeof obj !== 'object') return result;
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flatten(value, path));
    } else {
      result[path] = value;
    }
  }
  return result;
}

function parseString(text, i){
  let s = '';
  i++;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"') return { value: s, end: i + 1 };
    if (ch === '\\') {
      const n = text[i+1];
      if (n === 'u') { s += text.slice(i, i+6); i += 6; }
      else { s += text.slice(i, i+2); i += 2; }
      continue;
    }
    s += ch; i++;
  }
  throw new Error('Unterminated string');
}
function isWs(ch){ return ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t'; }
function parseValueText(text, i){
  while (i < text.length && isWs(text[i])) i++;
  const ch = text[i];
  if (ch === '{' || ch === '[') {
    const open = ch, close = ch === '{' ? '}' : ']';
    let depth = 0, j = i, inStr = false;
    for (; j < text.length; j++) {
      const c = text[j];
      if (inStr) { if (c === '"' && text[j-1] !== '\\') inStr = false; continue; }
      if (c === '"') inStr = true;
      else if (c === open) depth++;
      else if (c === close) { depth--; if (depth === 0) { j++; break; } }
    }
    return { type: open === '{' ? 'object' : 'array', text: text.slice(i, j), end: j };
  }
  if (ch === '"') { const { end } = parseString(text, i); return { type: 'string', text: text.slice(i, end), end }; }
  let j = i; while (j < text.length && !",}]".includes(text[j])) j++; return { type: 'primitive', text: text.slice(i, j).trim(), end: j };
}
function scanObject(objText, path){
  let i = 1; const entries = []; const dups = [];
  while (i < objText.length - 1) {
    while (i < objText.length - 1 && (isWs(objText[i]) || objText[i] === ',')) i++;
    if (i >= objText.length - 1) break;
    if (objText[i] !== '"') break;
    const nameTok = parseString(objText, i); const propName = nameTok.value; i = nameTok.end;
    while (i < objText.length && isWs(objText[i])) i++;
    if (objText[i] !== ':') break; i++;
    const valTok = parseValueText(objText, i); i = valTok.end;
    const fullPath = path ? path + '.' + propName : propName;
    entries.push({ path, key: propName, type: valTok.type, valueText: valTok.text });
    if (valTok.type === 'object') { dups.push(...scanObject(valTok.text, fullPath)); }
  }
  const byKey = new Map();
  for (const e of entries) { if (!byKey.has(e.key)) byKey.set(e.key, []); byKey.get(e.key).push(e); }
  for (const [key, arr] of byKey.entries()) { if (arr.length > 1) dups.push({ path, key, count: arr.length }); }
  return dups;
}

function loadJson(path){
  const text = fs.readFileSync(path, 'utf8');
  const data = JSON.parse(text);
  return { data, text };
}

function main(){
  const enPath = 'messages/en.json';
  const esPath = 'messages/es.json';
  const { data: en, text: enTxt } = loadJson(enPath);
  const { data: es, text: esTxt } = loadJson(esPath);

  // Duplicate check (sibling duplicates in whole file)
  const enDups = scanObject(enTxt, '');
  const esDups = scanObject(esTxt, '');
  if (enDups.length || esDups.length) {
    console.error('Duplicate sibling keys detected in message files.');
    if (enDups.length) console.error('EN duplicates (first 10):', enDups.slice(0, 10));
    if (esDups.length) console.error('ES duplicates (first 10):', esDups.slice(0, 10));
    process.exit(1);
  }

  // Parity check
  const enFlat = flatten(en);
  const esFlat = flatten(es);
  const enKeys = Object.keys(enFlat);
  const esKeys = Object.keys(esFlat);
  const enSet = new Set(enKeys);
  const esSet = new Set(esKeys);
  const missingInEs = enKeys.filter(k => !esSet.has(k));
  const missingInEn = esKeys.filter(k => !enSet.has(k));
  if (missingInEs.length || missingInEn.length) {
    console.error('i18n key parity failed.');
    if (missingInEs.length) console.error('Missing in ES (first 50):', missingInEs.slice(0, 50));
    if (missingInEn.length) console.error('Missing in EN (first 50):', missingInEn.slice(0, 50));
    process.exit(1);
  }

  // Case-collision check (same key ignoring case present with different casing)
  const lcMap = new Map();
  for (const k of enKeys) {
    const lc = k.toLowerCase();
    if (!lcMap.has(lc)) lcMap.set(lc, new Set());
    lcMap.get(lc).add(k);
  }
  const caseCollisions = [...lcMap.entries()].filter(([, set]) => set.size > 1)
    .map(([lc, set]) => ({ lower: lc, variants: [...set].sort() }));
  if (caseCollisions.length) {
    console.error('Case collisions detected in message keys (keys differ only by casing):');
    for (const c of caseCollisions.slice(0, 20)) {
      console.error(` - ${c.variants.join(' , ')}`);
    }
    process.exit(1);
  }

  // Code reference scan: collect referenced keys and validate existence
  const repoRoot = process.cwd();
  const { keyToOccurrences, allKeys: referenced } = collectReferencedKeys(repoRoot);
  const missingRefs = [];
  for (const ref of referenced) {
    if (!enSet.has(ref)) {
      // try case-insensitive suggestion
      const cand = enKeys.find(k => k.toLowerCase() === ref.toLowerCase());
      if (cand) {
        missingRefs.push({ key: ref, suggestion: cand, reason: 'case-mismatch', where: keyToOccurrences.get(ref) || [] });
      } else {
        missingRefs.push({ key: ref, where: keyToOccurrences.get(ref) || [] });
      }
    }
  }
  if (missingRefs.length) {
    console.error('Missing i18n messages referenced in code:');
    for (const m of missingRefs.slice(0, 100)) {
      const loc = (m.where && m.where.length) ? ` @ ${m.where[0].file}:${m.where[0].line}` : '';
      if (m.suggestion) console.error(` - ${m.key} (did you mean: ${m.suggestion})${loc}`);
      else console.error(` - ${m.key}${loc}`);
    }
    process.exit(1);
  }
  console.log('i18n check passed: no duplicates, full key parity, and all referenced keys exist.');
}

main();

// --- Helpers for code scanning ---
function shouldSkipDir(dir){
  const name = path.basename(dir);
  return name === 'node_modules' || name === '.git' || name === '.next' || name === 'tmp' || name === 'public';
}
function listFilesRecursive(startDir){
  const out = [];
  const stack = [startDir];
  while (stack.length) {
    const dir = stack.pop();
    if (shouldSkipDir(dir)) continue;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { stack.push(p); }
      else if (/\.(ts|tsx|js|jsx)$/.test(e.name)) { out.push(p); }
    }
  }
  return out;
}
function collectReferencedKeys(root){
  const files = listFilesRecursive(root);
  const refs = new Set();
  const keyToOccurrences = new Map();
  const add = (k, file, line) => {
    if (!k || typeof k !== 'string') return;
    refs.add(k);
    if (!keyToOccurrences.has(k)) keyToOccurrences.set(k, []);
    keyToOccurrences.get(k).push({ file: path.relative(root, file), line });
  };
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    const lines = text.split(/\r?\n/);
    // 1) getMessage('es'|'en', 'Path.Here')
    const reMsg = /getMessage\(\s*['\"][a-z]{2}['\"],\s*['\"]([A-Za-z0-9_.]+)['\"]\s*\)/g;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const m of line.matchAll(reMsg)) add(m[1], f, i + 1);
    }
    // 2) const t = (await )?getTranslations("Base.Path") or useTranslations("Base.Path")
    const basePatterns = [
      /const\s+([a-zA-Z_$][\w$]*)\s*=\s*await\s*getTranslations\(\s*['\"]([A-Za-z0-9_.]+)['\"]\s*\)/g,
      /const\s+([a-zA-Z_$][\w$]*)\s*=\s*getTranslations\(\s*['\"]([A-Za-z0-9_.]+)['\"]\s*\)/g,
      /const\s+([a-zA-Z_$][\w$]*)\s*=\s*useTranslations\(\s*['\"]([A-Za-z0-9_.]+)['\"]\s*\)/g,
    ];
    const varToBase = new Map();
    for (const re of basePatterns) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const m of line.matchAll(re)) varToBase.set(m[1], m[2]);
      }
    }
    if (varToBase.size) {
      // find tVar("child.path") usages
      for (const [v, base] of varToBase.entries()) {
        const re = new RegExp(v.replace(/[$]/g, '\\$&') + "\\(\\s*['\"]([A-Za-z0-9_.]+)['\"]\\s*\\)", 'g');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          for (const m of line.matchAll(re)) add(base + '.' + m[1], f, i + 1);
        }
      }
    }
  }
  return { allKeys: [...refs], keyToOccurrences };
}
