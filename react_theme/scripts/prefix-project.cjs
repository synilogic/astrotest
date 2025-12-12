const fs = require('fs');
const path = require('path');

// Config
const ROOT = process.cwd();
const CSS_PATH = path.join(ROOT, 'src', 'index.css');
const SRC_DIR = path.join(ROOT, 'src');

// Vendor/exclusions: classes starting with any of these won't be prefixed
const EXCLUDED_PREFIXES = [
  'react-', // already prefixed
  'swiper', // Swiper library
  'fa', 'fab', 'fas', 'far', 'fal', 'fad', // FontAwesome
  'lucide', // lucide icons used in JSX
  'bootstrap', // just in case
];

// Additional exact class names to exclude (common bootstrap/util names if present)
const EXCLUDED_EXACT = new Set([
  'container', 'row', 'col', 'col-1', 'col-2', 'col-3', 'col-4', 'col-5', 'col-6', 'col-7', 'col-8', 'col-9', 'col-10', 'col-11', 'col-12',
  'navbar', 'nav', 'dropdown', 'dropdown-menu', 'dropdown-item', 'active', 'show',
]);

// Helper: read all files under a directory recursively matching extensions
function listFiles(dir, exts) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (ent.name.startsWith('.')) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...listFiles(full, exts));
    } else {
      if (exts.includes(path.extname(ent.name))) {
        out.push(full);
      }
    }
  }
  return out;
}

function shouldExcludeClass(cls) {
  if (!cls) return true;
  if (EXCLUDED_EXACT.has(cls)) return true;
  return EXCLUDED_PREFIXES.some((p) => cls.startsWith(p));
}

function loadCssClassNames(cssText) {
  const classes = new Set();
  // Match CSS class selectors: .className, optionally combined (.a.b, .a:hover, etc.)
  // We'll capture sequences after a dot that are valid class identifiers
  const classRegex = /\.(?![0-9-])([a-zA-Z_][a-zA-Z0-9_-]*)/g;
  let m;
  while ((m = classRegex.exec(cssText)) !== null) {
    const cls = m[1];
    if (!shouldExcludeClass(cls)) {
      classes.add(cls);
    }
  }
  return classes;
}

function prefixCssSelectors(cssText, classMap) {
  // Replace occurrences of ".class" with ".react-class" for known classes only
  // Use a replacer that checks the captured class name
  return cssText.replace(/\.(?![0-9-])([a-zA-Z_][a-zA-Z0-9_-]*)/g, (full, cls) => {
    if (classMap.has(cls)) {
      return `.react-${cls}`;
    }
    return full;
  });
}

function prefixCustomProperties(cssText) {
  // 1) Rename declarations: --foo: to --react-foo:
  cssText = cssText.replace(/(--)([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/g, (full, dashes, name) => {
    if (name.startsWith('react-')) return full; // already prefixed
    return `--react-${name}:`;
  });
  // 2) Update usages: var(--foo) -> var(--react-foo)
  cssText = cssText.replace(/var\(\s*--([a-zA-Z_][a-zA-Z0-9_-]*)\s*\)/g, (full, name) => {
    if (name.startsWith('react-')) return full;
    return `var(--react-${name})`;
  });
  return cssText;
}

function prefixJsxClassNames(fileText, classSet) {
  // Replace className strings, token-by-token, only for known class names
  // We will find className="..." and className={'...'} forms, split on whitespace, and prefix tokens present in classSet
  return fileText.replace(/className\s*=\s*("([^"]*)"|'([^']*)')/g, (full, quoteGroup, dbl, sgl) => {
    const content = dbl !== undefined ? dbl : sgl;
    const parts = content.split(/\s+/).filter(Boolean);
    const newParts = parts.map((p) => {
      // Ignore dynamic classnames like {expr} — we only handle plain strings here
      // Skip if token has starting prefixes (vendor) or already prefixed
      if (classSet.has(p)) return `react-${p}`;
      return p;
    });
    const newContent = (dbl !== undefined) ? `"${newParts.join(' ')}"` : `'${newParts.join(' ')}'`;
    return `className=${newContent}`;
  });
}

function main() {
  if (!fs.existsSync(CSS_PATH)) {
    console.error('CSS file not found:', CSS_PATH);
    process.exit(1);
  }

  const css = fs.readFileSync(CSS_PATH, 'utf8');

  // Ensure :root (fix if "::root" exists)
  let fixedCss = css.replace(/::root/g, ':root');

  // Collect class names from CSS
  const classSet = loadCssClassNames(fixedCss);

  // Prefix CSS selectors first
  fixedCss = prefixCssSelectors(fixedCss, classSet);

  // Prefix custom properties and usages
  fixedCss = prefixCustomProperties(fixedCss);

  // Write CSS back
  fs.writeFileSync(CSS_PATH, fixedCss, 'utf8');

  // Update JSX/JS/TSX files' className tokens
  const exts = ['.jsx', '.tsx', '.js', '.ts'];
  const files = listFiles(SRC_DIR, exts);

  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    const updated = prefixJsxClassNames(text, classSet);
    if (updated !== text) {
      fs.writeFileSync(f, updated, 'utf8');
    }
  }

  console.log(`Prefixed ${classSet.size} CSS classes and all custom properties with 'react-'.`);
}

main();
