#!/usr/bin/env node
/**
 * Build the V2 translation manifest: dist/i18n/strings.json.
 *
 * The WordPress plugin (BM_V2_Translation_Bridge) reads it from
 * react-frontend-v2/i18n/strings.json. "Scan" in Translation Management
 * registers every string in it, and the page catalog only carries these
 * strings. A string missing here cannot be translated.
 *
 * It collects literal arguments of __(), _x(), _n() and _nx() in src/, and
 * applies the bridge's validation rules. The plugin rejects the whole
 * manifest if any rule fails, so this script fails the build instead.
 *
 * Usage: node scripts/extract-i18n.mjs [--check]
 *   --check  validate and report only, do not write the file.
 */
import { readFileSync, readdirSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { join, relative, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { Parser } from "acorn";
import jsx from "acorn-jsx";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const OUT = join(ROOT, "dist", "i18n", "strings.json");
const CHECK_ONLY = process.argv.includes("--check");

// Mirrors BM_V2_Translation_Bridge.
const DOMAIN = "service-booking";
const MAX_STRINGS = 5000;
const MAX_BYTES = 1048576;
const FORBIDDEN = new Set(["__proto__", "constructor", "prototype"]);

// Argument positions of [source, plural, context] per helper.
const HELPERS = {
  __: { source: 0 },
  _x: { source: 0, context: 1 },
  _n: { source: 0, plural: 1 },
  _nx: { source: 0, plural: 1, context: 3 },
};

const JSXParser = Parser.extend(jsx());

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listFiles(path);
    return [".js", ".jsx", ".mjs"].includes(extname(name)) ? [path] : [];
  });
}

// Literal string value of an argument node, or null if it is dynamic.
function literal(node) {
  if (!node) return null;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis[0].value.cooked;
  }
  if (node.type === "BinaryExpression" && node.operator === "+") {
    const left = literal(node.left);
    const right = literal(node.right);
    return left !== null && right !== null ? left + right : null;
  }
  return null;
}

function walk(node, visit) {
  if (!node || typeof node.type !== "string") return;
  visit(node);
  for (const key of Object.keys(node)) {
    if (key === "loc" || key === "start" || key === "end") continue;
    const child = node[key];
    if (Array.isArray(child)) child.forEach((c) => walk(c, visit));
    else if (child && typeof child === "object") walk(child, visit);
  }
}

const entries = []; // { source, context, plural, where }
const problems = [];

for (const file of listFiles(SRC)) {
  const rel = relative(ROOT, file);
  let ast;
  try {
    ast = JSXParser.parse(readFileSync(file, "utf8"), {
      ecmaVersion: "latest",
      sourceType: "module",
      locations: true,
      allowHashBang: true,
    });
  } catch (error) {
    problems.push(`${rel}: cannot parse (${error.message})`);
    continue;
  }

  walk(ast, (node) => {
    if (node.type !== "CallExpression" || node.callee.type !== "Identifier") return;
    const spec = HELPERS[node.callee.name];
    if (!spec) return;
    const where = `${rel}:${node.loc.start.line}`;
    const pick = (field) =>
      spec[field] === undefined ? "" : literal(node.arguments[spec[field]]);
    const source = pick("source");
    const plural = pick("plural");
    const context = pick("context");
    if (source === null || plural === null || context === null) {
      problems.push(
        `${where}: ${node.callee.name}() needs string literals; use sprintf() for values`,
      );
      return;
    }
    entries.push({ source, context, plural, where });
  });
}

// Validation identical to BM_V2_Translation_Bridge::validate_manifest().
const byKey = new Map();
const claims = new Map();
for (const entry of entries) {
  const { source, context, plural, where } = entry;
  if (source.trim() === "") {
    problems.push(`${where}: empty source string`);
    continue;
  }
  if (plural !== "" && (plural.trim() === "" || plural === source)) {
    problems.push(`${where}: plural must differ from the singular`);
    continue;
  }
  const invalid = Object.entries({ source, context, plural }).find(
    ([field, value]) =>
      Buffer.byteLength(value) > (field === "context" ? 512 : 4096) ||
      /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value) ||
      FORBIDDEN.has(value),
  );
  if (invalid) {
    problems.push(`${where}: invalid ${invalid[0]} "${invalid[1].slice(0, 60)}"`);
    continue;
  }

  const key = `${context}\x04${source}`;
  const existing = byKey.get(key);
  if (existing) {
    if (existing.plural !== plural) {
      problems.push(
        `${where}: "${source}" is used with a different plural at ${existing.where}`,
      );
    }
    continue;
  }
  let conflict = false;
  for (const text of [source, plural].filter(Boolean)) {
    const claim = `${context}\x04${text}`;
    const owner = claims.get(claim);
    if (owner && owner.key !== key) {
      problems.push(
        `${where}: "${text}" is both a singular and a plural form (see ${owner.where}); add a context with _x()/_nx()`,
      );
      conflict = true;
    }
  }
  if (conflict) continue;
  [source, plural].filter(Boolean).forEach((text) =>
    claims.set(`${context}\x04${text}`, { key, where }),
  );
  byKey.set(key, entry);
}

if (byKey.size > MAX_STRINGS) {
  problems.push(`too many strings: ${byKey.size} (limit ${MAX_STRINGS})`);
}

if (problems.length) {
  console.error(`extract-i18n: ${problems.length} problem(s):`);
  problems.forEach((p) => console.error(`  - ${p}`));
  process.exit(1);
}

const strings = [...byKey.entries()]
  .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  .map(([, { source, context, plural }]) => ({
    source,
    ...(context ? { context } : {}),
    ...(plural ? { plural } : {}),
  }));

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const manifest = {
  schema_version: 1,
  bundle: "v2",
  domain: DOMAIN,
  version: `${pkg.version}+${new Date().toISOString()}`,
  strings,
};
const json = `${JSON.stringify(manifest, null, 2)}\n`;
if (Buffer.byteLength(json) > MAX_BYTES) {
  console.error(`extract-i18n: manifest is larger than ${MAX_BYTES} bytes`);
  process.exit(1);
}

if (CHECK_ONLY) {
  console.log(`extract-i18n: ${strings.length} strings OK (not written)`);
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, json);
  console.log(`extract-i18n: wrote ${strings.length} strings to ${relative(ROOT, OUT)}`);
}
