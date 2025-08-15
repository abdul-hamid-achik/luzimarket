#!/usr/bin/env node
/*
 i18n parity and duplicate check
 - Ensures messages/en.json and messages/es.json have identical flattened key sets
 - Fails if duplicates (same property name repeated within the same object) are present
*/
const fs = require('fs');

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
  console.log('i18n check passed: no duplicates and full key parity.');
}

main();
