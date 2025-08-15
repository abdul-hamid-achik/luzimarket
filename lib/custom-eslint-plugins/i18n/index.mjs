// ESLint plugin: i18n rules for Luzimarket
// - messages-parity: EN/ES parity, duplicate keys, case-collisions
// - messages-sorted: deep alphabetical sorting enforcement
// - no-missing-keys: per-file check of used i18n keys vs messages

import fs from 'fs';
import path from 'path';

const PLUGIN_META = {
  name: 'luzimarket-eslint-plugin-i18n',
  version: '1.0.0',
};

// --- Helpers ---
function readFileText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}
function readJson(filePath) {
  const text = readFileText(filePath);
  if (text == null) return { data: null, text: null };
  try {
    return { data: JSON.parse(text), text };
  } catch {
    return { data: null, text };
  }
}
function flattenMessages(obj, prefix = '') {
  const out = {};
  if (!obj || typeof obj !== 'object') return out;
  for (const [key, value] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(out, flattenMessages(value, next));
    } else {
      out[next] = true;
    }
  }
  return out;
}
function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    const sorted = {};
    for (const key of Object.keys(value).sort((a, b) => a.localeCompare(b))) {
      sorted[key] = sortDeep(value[key]);
    }
    return sorted;
  }
  return value;
}
// Duplicate key scan (sibling duplicates) using text-driven parse to avoid JSON parser swallowing dups
function parseStringToken(text, i) {
  let s = '';
  i++;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"') return { value: s, end: i + 1 };
    if (ch === '\\') {
      const n = text[i + 1];
      if (n === 'u') { s += text.slice(i, i + 6); i += 6; }
      else { s += text.slice(i, i + 2); i += 2; }
      continue;
    }
    s += ch; i++;
  }
  return { value: s, end: i };
}
function isWs(ch) { return ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t'; }
function parseValueText(text, i) {
  while (i < text.length && isWs(text[i])) i++;
  const ch = text[i];
  if (ch === '{' || ch === '[') {
    const open = ch, close = ch === '{' ? '}' : ']';
    let depth = 0, j = i, inStr = false;
    for (; j < text.length; j++) {
      const c = text[j];
      if (inStr) { if (c === '"' && text[j - 1] !== '\\') inStr = false; continue; }
      if (c === '"') inStr = true;
      else if (c === open) depth++;
      else if (c === close) { depth--; if (depth === 0) { j++; break; } }
    }
    return { type: open === '{' ? 'object' : 'array', text: text.slice(i, j), end: j };
  }
  if (ch === '"') { const { end } = parseStringToken(text, i); return { type: 'string', text: text.slice(i, end), end }; }
  let j = i; while (j < text.length && !",}]".includes(text[j])) j++; return { type: 'primitive', text: text.slice(i, j).trim(), end: j };
}
function scanObjectForDuplicateKeys(objText, pathPrefix) {
  let i = 1; const entries = []; const dups = [];
  while (i < objText.length - 1) {
    while (i < objText.length - 1 && (isWs(objText[i]) || objText[i] === ',')) i++;
    if (i >= objText.length - 1) break;
    if (objText[i] !== '"') break;
    const nameTok = parseStringToken(objText, i); const propName = nameTok.value; i = nameTok.end;
    while (i < objText.length && isWs(objText[i])) i++;
    if (objText[i] !== ':') break; i++;
    const valTok = parseValueText(objText, i); i = valTok.end;
    const fullPath = pathPrefix ? pathPrefix + '.' + propName : propName;
    entries.push({ key: propName, type: valTok.type, valueText: valTok.text, path: fullPath });
    if (valTok.type === 'object') { dups.push(...scanObjectForDuplicateKeys(valTok.text, fullPath)); }
  }
  const byKey = new Map();
  for (const e of entries) {
    if (!byKey.has(e.key)) byKey.set(e.key, []);
    byKey.get(e.key).push(e);
  }
  for (const [key, arr] of byKey.entries()) { if (arr.length > 1) dups.push({ path: pathPrefix, key, count: arr.length }); }
  return dups;
}

let cachedMessages = null; // { en, es, enTxt, esTxt, enFlat, esFlat, enKeys, esKeys }
function loadMessages(context) {
  if (cachedMessages) return cachedMessages;
  const cwd = process.cwd();
  const enPath = path.join(cwd, 'messages', 'en.json');
  const esPath = path.join(cwd, 'messages', 'es.json');
  const { data: en, text: enTxt } = readJson(enPath);
  const { data: es, text: esTxt } = readJson(esPath);
  const enFlat = en ? flattenMessages(en) : {};
  const esFlat = es ? flattenMessages(es) : {};
  const enKeys = Object.keys(enFlat);
  const esKeys = Object.keys(esFlat);
  cachedMessages = { en, es, enTxt, esTxt, enFlat, esFlat, enKeys, esKeys };
  return cachedMessages;
}

// --- Rules ---
const rules = {
  'messages-parity': {
    meta: {
      type: 'problem',
      docs: { description: 'Ensure messages/en.json and messages/es.json have identical flattened key sets; detect sibling duplicate keys and key case-collisions', recommended: true },
      schema: [],
    },
    create(context) {
      // Only run once per lint run
      if (messagesParityRanOnce._ran) return {};
      messagesParityRanOnce._ran = true;

      const { en, es, enTxt, esTxt, enKeys, esKeys } = loadMessages(context);
      if (!en || !es) {
        context.report({
          loc: { line: 1, column: 0 },
          message: 'Could not load messages/en.json or messages/es.json',
        });
        return {};
      }

      // Duplicate keys
      const enDups = scanObjectForDuplicateKeys(enTxt, '');
      const esDups = scanObjectForDuplicateKeys(esTxt, '');
      if (enDups.length || esDups.length) {
        const first = [...enDups, ...esDups].slice(0, 5).map(d => `${d.path || '<root>'}: duplicate key "${d.key}"`).join('; ');
        context.report({
          loc: { line: 1, column: 0 },
          message: `Duplicate sibling keys detected in messages: ${first}${enDups.length + esDups.length > 5 ? ' …' : ''}`,
        });
      }

      // Parity
      const enSet = new Set(enKeys);
      const esSet = new Set(esKeys);
      const missingInEs = enKeys.filter(k => !esSet.has(k));
      const missingInEn = esKeys.filter(k => !enSet.has(k));
      if (missingInEs.length || missingInEn.length) {
        const msg = [];
        if (missingInEs.length) msg.push(`Missing in ES: ${missingInEs.slice(0, 10).join(', ')}${missingInEs.length > 10 ? ' …' : ''}`);
        if (missingInEn.length) msg.push(`Missing in EN: ${missingInEn.slice(0, 10).join(', ')}${missingInEn.length > 10 ? ' …' : ''}`);
        context.report({ loc: { line: 1, column: 0 }, message: msg.join(' | ') });
      }

      // Case-collisions (EN as source of truth)
      const lcMap = new Map();
      for (const k of enKeys) {
        const lc = k.toLowerCase();
        if (!lcMap.has(lc)) lcMap.set(lc, new Set());
        lcMap.get(lc).add(k);
      }
      const collisions = [...lcMap.entries()].filter(([, set]) => set.size > 1).map(([lower, set]) => ({ lower, variants: [...set] }));
      if (collisions.length) {
        const first = collisions.slice(0, 5).map(c => c.variants.join(' , ')).join(' | ');
        context.report({ loc: { line: 1, column: 0 }, message: `Case-only key collisions in EN: ${first}${collisions.length > 5 ? ' …' : ''}` });
      }
      return {};
    },
  },

  'messages-sorted': {
    meta: {
      type: 'problem',
      docs: { description: 'Ensure messages JSON files are deep-sorted alphabetically by keys', recommended: false },
      schema: [],
    },
    create(context) {
      // Only run once
      if (messagesSortedRanOnce._ran) return {};
      messagesSortedRanOnce._ran = true;

      const { en, es } = loadMessages(context);
      if (!en || !es) return {};
      const sortedEn = sortDeep(en);
      const sortedEs = sortDeep(es);
      const enOk = JSON.stringify(en) === JSON.stringify(sortedEn);
      const esOk = JSON.stringify(es) === JSON.stringify(sortedEs);
      if (!enOk || !esOk) {
        const parts = [];
        if (!enOk) parts.push('messages/en.json');
        if (!esOk) parts.push('messages/es.json');
        context.report({
          loc: { line: 1, column: 0 },
          message: `Message files not sorted: ${parts.join(', ')}`,
        });
      }
      return {};
    },
  },

  'no-missing-keys': {
    meta: {
      type: 'problem',
      docs: { description: 'Report usages of translation keys that do not exist in messages/en.json', recommended: true },
      schema: [],
    },
    create(context) {
      const filename = context.getFilename();
      // Ignore generated/irrelevant files
      if (/node_modules|\.next|tmp|public/.test(filename)) return {};

      const source = context.getSourceCode().text;
      const lines = source.split(/\r?\n/);

      const { enKeys } = loadMessages(context);
      const enSet = new Set(enKeys);

      // 1) getMessage('en'|'es', 'Path.Here')
      const reMsg = /getMessage\(\s*['\"][a-z]{2}['\"],\s*['\"]([A-Za-z0-9_.]+)['\"]\s*\)/g;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const m of line.matchAll(reMsg)) {
          const key = m[1];
          if (!enSet.has(key)) {
            // try case-insensitive suggestion
            const cand = enKeys.find(k => k.toLowerCase() === key.toLowerCase());
            const msg = cand ? `Missing i18n message: "${key}" (did you mean: ${cand})`
                             : `Missing i18n message: "${key}"`;
            context.report({ loc: { line: i + 1, column: Math.max(0, line.indexOf(key)) }, message: msg });
          }
        }
      }

      // 2) Detect base: const t = (await )?getTranslations("Base.Path") or useTranslations("Base.Path")
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
        for (const [v, base] of varToBase.entries()) {
          const re = new RegExp(v.replace(/[$]/g, '\\$&') + "\\(\\s*['\"]([A-Za-z0-9_.]+)['\"]\\s*\\)", 'g');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (const m of line.matchAll(re)) {
              const key = base + '.' + m[1];
              if (!enSet.has(key)) {
                const cand = enKeys.find(k => k.toLowerCase() === key.toLowerCase());
                const msg = cand ? `Missing i18n message: "${key}" (did you mean: ${cand})`
                                 : `Missing i18n message: "${key}"`;
                const col = Math.max(0, line.indexOf(m[1]));
                context.report({ loc: { line: i + 1, column: col }, message: msg });
              }
            }
          }
        }
      }

      return {};
    },
  },
};

const messagesParityRanOnce = { _ran: false };
const messagesSortedRanOnce = { _ran: false };

const plugin = {
  meta: PLUGIN_META,
  rules,
};

export default plugin;
