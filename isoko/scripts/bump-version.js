#!/usr/bin/env node
/**
 * Raises the app version and prepares release notes.
 *
 *   node scripts/bump-version.js patch   1.0.0 -> 1.0.1  (small fixes)
 *   node scripts/bump-version.js minor   1.0.0 -> 1.1.0  (new features)
 *   node scripts/bump-version.js major   1.0.0 -> 2.0.0  (big redesign)
 *
 * Use this only for STORE updates (new build). Quick over-the-air updates keep the same version.
 * It updates app.json and package.json, creates updates/release-notes/<version>.md
 * from the template, and adds a line to updates/CHANGELOG.md.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const kind = process.argv[2] || 'patch';
if (!['patch', 'minor', 'major'].includes(kind)) {
  console.error('Use: node scripts/bump-version.js patch | minor | major');
  process.exit(1);
}

const appPath = path.join(root, 'app.json');
const pkgPath = path.join(root, 'package.json');
const app = JSON.parse(fs.readFileSync(appPath, 'utf8'));
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const [maj, min, pat] = app.expo.version.split('.').map(Number);
const next = kind === 'major' ? `${maj + 1}.0.0` : kind === 'minor' ? `${maj}.${min + 1}.0` : `${maj}.${min}.${pat + 1}`;

app.expo.version = next;
pkg.version = next;
fs.writeFileSync(appPath, JSON.stringify(app, null, 2) + '\n');
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

const today = new Date().toISOString().slice(0, 10);
const notesDir = path.join(root, 'updates', 'release-notes');
const template = fs.readFileSync(path.join(notesDir, 'TEMPLATE.md'), 'utf8');
const notesFile = path.join(notesDir, `${next}.md`);
if (!fs.existsSync(notesFile)) {
  fs.writeFileSync(notesFile, template.replace(/{{VERSION}}/g, next).replace(/{{DATE}}/g, today));
}

const changelog = path.join(root, 'updates', 'CHANGELOG.md');
const log = fs.readFileSync(changelog, 'utf8');
const entry = `## ${next} — ${today}\n- (describe what changed — see release-notes/${next}.md)\n\n`;
fs.writeFileSync(changelog, log.replace('<!-- NEW ENTRIES GO BELOW THIS LINE -->\n', `<!-- NEW ENTRIES GO BELOW THIS LINE -->\n\n${entry}`));

console.log(`Version is now ${next}`);
console.log(`Fill in: updates/release-notes/${next}.md`);
console.log('Next: npm run build:production  (a new version number always needs a new store build)');
