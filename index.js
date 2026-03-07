#!/usr/bin/env node

'use strict';

const { execSync, execFileSync } = require('child_process');

// ─── ANSI Colors ────────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

const color = (str, ...codes) => `${codes.join('')}${str}${c.reset}`;

// ─── CLI Args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getFlag = (flag, defaultVal) => {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  const prefixed = args.find(a => a.startsWith(`${flag}=`));
  if (prefixed) return prefixed.split('=')[1];
  return defaultVal;
};
const hasFlag = flag => args.includes(flag);

if (hasFlag('--help') || hasFlag('-h')) {
  console.log(`
${color(' STANDUP GENERATOR ', c.bold, c.cyan)} ${color('v1.0.0', c.dim)}

${color('Usage:', c.bold)} standup-generator [options]

${color('Options:', c.bold)}
  --personality  <mode>   honest | corporate | gen-z | dramatic  (default: honest)
  --days         <n>      How many days back to scan            (default: 1)
  --slack                 Format output for Slack (no ANSI)
  --copy                  Copy result to clipboard
  -h, --help              Show this help

${color('Examples:', c.bold)}
  standup-generator
  standup-generator --personality corporate --days 2
  standup-generator --personality gen-z --copy
  npx standup-generator --personality dramatic
`);
  process.exit(0);
}

const personality = getFlag('--personality', 'honest');
const days = parseInt(getFlag('--days', '1'), 10) || 1;
const slackMode = hasFlag('--slack');
const copyMode = hasFlag('--copy');

const VALID_PERSONALITIES = ['honest', 'corporate', 'gen-z', 'dramatic'];
if (!VALID_PERSONALITIES.includes(personality)) {
  console.error(color(`Unknown personality: "${personality}". Choose: ${VALID_PERSONALITIES.join(', ')}`, c.red));
  process.exit(1);
}

// ─── Git Log ─────────────────────────────────────────────────────────────────
function isGitRepo() {
  try {
    execFileSync('git', ['rev-parse', '--git-dir'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function getCommits(daysBack) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - daysBack);
    const sinceStr = since.toISOString().split('T')[0];
    const raw = execFileSync(
      'git',
      ['log', `--since=${sinceStr}`, '--oneline', '--no-merges'],
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    if (!raw) return [];
    return raw.split('\n').map(line => {
      const [hash, ...rest] = line.split(' ');
      return { hash, message: rest.join(' ') };
    }).filter(commit => commit.message);
  } catch {
    return [];
  }
}

// ─── Commit Type Detection ────────────────────────────────────────────────────
const PATTERNS = [
  { match: /\b(wip|WIP)\b/,               type: 'wip' },
  { match: /\binitial commit\b/i,          type: 'initial' },
  { match: /\brevert\b/i,                  type: 'revert' },
  { match: /\bmerge\b/i,                   type: 'merge' },
  { match: /\b(fix|bug|hotfix|patch)\b/i,  type: 'fix' },
  { match: /\brefactor\b/i,               type: 'refactor' },
  { match: /\b(test|spec|jest|vitest)\b/i, type: 'test' },
  { match: /\b(feat|feature|add|new|implement)\b/i, type: 'feat' },
  { match: /\b(docs?|readme|changelog)\b/i, type: 'docs' },
  { match: /\b(style|lint|format|prettier|eslint)\b/i, type: 'style' },
  { match: /\b(chore|deps?|upgrade|update|bump)\b/i, type: 'chore' },
];

const CONVENTIONAL_MAP = {
  fix: 'fix', bug: 'fix', hotfix: 'fix', patch: 'fix',
  feat: 'feat', feature: 'feat', add: 'feat',
  refactor: 'refactor', ref: 'refactor',
  test: 'test', tests: 'test',
  docs: 'docs', doc: 'docs',
  style: 'style', lint: 'style', format: 'style',
  chore: 'chore', deps: 'chore', build: 'chore', ci: 'chore',
  revert: 'revert',
  merge: 'merge',
  wip: 'wip',
};

function detectType(msg) {
  const conventional = msg.match(/^(\w+)(\(.+\))?!?:/);
  if (conventional) {
    const mapped = CONVENTIONAL_MAP[conventional[1].toLowerCase()];
    if (mapped) return mapped;
  }
  for (const p of PATTERNS) {
    if (p.match.test(msg)) return p.type;
  }
  return 'default';
}

function stripPrefix(msg) {
  return msg.replace(/^(\w+)(\(.+\))?!?:\s*/, '').trim() || msg;
}

// ─── Personality Translators ──────────────────────────────────────────────────
const translators = {
  honest: {
    fix:      m => `mass-murdered the "${stripPrefix(m)}" bug that's been haunting prod since Tuesday`,
    refactor: m => `moved code around and called it "architecture" (${stripPrefix(m)})`,
    test:     m => `wrote tests for ${stripPrefix(m)} — they're red but they EXIST now`,
    feat:     m => `shipped "${stripPrefix(m)}" which may or may not work in production`,
    docs:     m => `wrote words about code instead of writing code (${stripPrefix(m)})`,
    style:    m => `made the linter happy about whitespace (${stripPrefix(m)})`,
    chore:    m => `did the dishes nobody else wanted to touch: ${stripPrefix(m)}`,
    merge:    () => `survived a merge conflict without flipping a table`,
    revert:   m => `time-travelled back to before I broke everything (${stripPrefix(m)})`,
    wip:      () => `committed code that definitely works (narrator: it did not)`,
    initial:  () => `brought another repository into this world and immediately regretted it`,
    default:  m => `did developer things involving "${m}" and emerged mostly unscathed`,
  },
  corporate: {
    fix:      m => `remediated a critical deficiency in our value delivery pipeline pertaining to "${stripPrefix(m)}"`,
    refactor: m => `executed a strategic architectural realignment to optimise our technical debt portfolio`,
    test:     m => `implemented comprehensive quality assurance protocols to validate deliverable integrity`,
    feat:     m => `leveraged synergistic capabilities to unlock stakeholder value via "${stripPrefix(m)}"`,
    docs:     m => `produced knowledge-transfer artefacts to accelerate cross-functional alignment`,
    style:    m => `harmonised code aesthetics to drive developer experience KPIs`,
    chore:    m => `actioned low-visibility but high-impact operational excellence initiatives (${stripPrefix(m)})`,
    merge:    () => `facilitated a strategic branch consolidation to accelerate release cadence`,
    revert:   m => `course-corrected our implementation trajectory following a learning opportunity`,
    wip:      () => `committed an agile, iterative progress artefact pending further stakeholder refinement`,
    initial:  () => `bootstrapped a transformative new digital product ecosystem`,
    default:  m => `drove impactful cross-functional execution around "${m}" to move the needle`,
  },
  'gen-z': {
    fix:      m => `"${stripPrefix(m)}" was giving broken energy, no cap fixed it fr fr`,
    refactor: m => `the code was lowkey mid so i cleaned it up, it's bussin now ngl`,
    test:     m => `wrote tests and they're giving main character energy (some of them pass bestie)`,
    feat:     m => `shipped "${stripPrefix(m)}" and it absolutely slaps, not gonna lie`,
    docs:     m => `wrote the docs no one will read but it's the vibe`,
    style:    m => `the linter was pressed about formatting, handled it, no drama`,
    chore:    m => `did the boring stuff (${stripPrefix(m)}), it is what it is`,
    merge:    () => `merged the branches, we're all one big family now bestie`,
    revert:   m => `reverted because that commit was not it, not even a little bit`,
    wip:      () => `pushed something that's a whole vibe but also chaotic slay`,
    initial:  () => `first commit just dropped, new era era era`,
    default:  m => `did "${m}" and honestly it's giving, respectfully`,
  },
  dramatic: {
    fix:      m => `slayed the ancient "${stripPrefix(m)}" dragon that lay within the fortress of production`,
    refactor: m => `restructured the kingdoms of code so that future generations may thrive`,
    test:     m => `forged iron-clad tests — let not a single bug pass through unchallenged`,
    feat:     m => `erected grand monuments to "${stripPrefix(m)}" that shall stand for ages`,
    docs:     m => `inscribed the sacred scrolls so that those who follow may understand`,
    style:    m => `vanquished the forces of chaos — whitespace and indentation now bow before us`,
    chore:    m => `completed the unglamorous but noble labours that hold civilisation together`,
    merge:    () => `united two great kingdoms under one branch — peace reigns at last`,
    revert:   m => `wielded the power of temporal sorcery to undo the catastrophe (${stripPrefix(m)})`,
    wip:      () => `committed the unfinished prophecy — its true form is yet to be revealed`,
    initial:  () => `breathed life into a new universe, and saw that it was... probably fine`,
    default:  m => `faced the trials of "${m}" with courage and emerged, battle-worn but victorious`,
  },
};

function translate(commit, mode) {
  const type = detectType(commit.message);
  const t = translators[mode];
  const fn = (t && t[type]) || (t && t['default']) || (m => m.message);
  return fn(commit.message);
}

// ─── Today Predictions ───────────────────────────────────────────────────────
const TODAY_PREDICTIONS = {
  honest: [
    'probably break what I fixed yesterday',
    'attend 3 meetings that could\'ve been emails',
    'stare at a bug for 2 hours, fix it with one semicolon',
    'write code, delete code, rewrite the same code',
    'pretend to understand the microservices architecture diagram',
    'google something I\'ve googled 40 times before',
    'leave a comment saying "// TODO: fix later" (it will never be fixed)',
    'make a change, test locally, push to CI, watch CI explode',
    'open 47 Stack Overflow tabs and close them all unsatisfied',
    'spend 45 minutes naming a variable',
    'touch one thing, somehow break three others',
    'write a commit message that says "fix" and nothing else',
    'convince myself I understand async/await (spoiler: I do not)',
    'read the same error message 10 times hoping it changes',
    'add a console.log "just for debugging" that ships to prod',
    'ask for code review on Friday at 4:45pm',
    'close 12 tabs I\'ve had open since 2023',
  ],
  corporate: [
    'attend a series of alignment syncs to socialise our Q2 deliverables',
    'action several high-priority backlog items to accelerate sprint velocity',
    'unblock cross-functional dependencies via proactive stakeholder engagement',
    'drive consensus on our architectural north star',
    'facilitate knowledge transfer around our new deployment paradigm',
    'optimise developer experience metrics through toolchain harmonisation',
    'deliver a comprehensive status update to the steering committee',
    'redefine our definition of done to better reflect business value',
    'conduct a retrospective retrospective to improve how we retrospect',
    'move the needle on our technical debt reduction initiative',
    'socialise the new branching strategy across the engineering org',
  ],
  'gen-z': [
    'slay this sprint backlog, no notes',
    'probably vibe with some bugs until they go away (manifesting)',
    'attend standup and try not to zone out, it is what it is',
    'push some commits that go absolutely hard',
    'read the ticket three times and still not understand the requirements',
    'fix yesterday\'s code because yesterday-me was not it',
    'gaslight myself into thinking I\'m being productive',
    'end the day with a commit that\'s not embarrassing, fingers crossed',
    'touch grass at lunch and return recharged fr',
    'do the thing that needs doing, whatever that even is bestie',
  ],
  dramatic: [
    'embark upon the treacherous quest to resolve the outstanding tickets',
    'face the trials of the sprint with unwavering resolve',
    'forge new features from the raw iron of requirements',
    'negotiate a ceasefire with the legacy codebase',
    'stand vigil over the CI pipeline until it turns green',
    'seek wisdom from the ancients (Stack Overflow, circa 2014)',
    'rally the troops for the afternoon planning ceremony',
    'decipher the cryptic runes left by the developer before me',
    'write code worthy of the ages, or at least the next PR',
    'battle the relentless tide of technical debt with righteous fury',
  ],
};

const BLOCKERS = {
  honest: [
    'my own code from last week',
    'the build pipeline is having an existential crisis',
    'waiting for review from someone who\'s "OOO until Thursday"',
    'Docker decided to download the entire internet again',
    'the ticket has no acceptance criteria and I\'m fully improvising',
    'I broke the main branch (it was already broken though, I swear)',
    'npm install takes 4 minutes and I have no idea why',
    'the PM changed the requirements again at 4:58pm',
    'my rubber duck is unavailable for debugging consultation',
    'the staging environment has gone rogue',
    '"works on my machine" is not being accepted as a valid deployment strategy',
    'caffeine levels critically low',
    'the WiFi cuts out every 20 minutes like clockwork',
    'I don\'t fully understand what I\'m building but I\'m 3 days in now',
    'Slack is down so I can\'t ask anyone anything',
  ],
  corporate: [
    'awaiting alignment from key stakeholders on acceptance criteria',
    'bandwidth constraints due to concurrent high-priority initiatives',
    'dependency on external team deliverables not yet socialised',
    'pending sign-off from the architecture review board',
    'resource contention across multiple workstreams',
    'ambiguity in requirements documentation requiring clarification',
    'toolchain provisioning request still in the approval queue',
    'cross-team dependencies not yet reflected in the roadmap',
  ],
  'gen-z': [
    'waiting on a PR review and the vibe is off',
    'the requirements are giving confusion energy ngl',
    'staging env is being sus rn',
    'too many meetings today, can\'t catch a vibe',
    'my code is somehow both done and not done at the same time',
    'the ticket was written in 2019 and nobody knows what it means anymore',
    'blocked by someone who\'s "brb" for 3 hours',
    'the linter is being extra and I am tired',
  ],
  dramatic: [
    'the ancient dependency refuses to be upgraded — it is cursed',
    'the code review gods demand sacrifice (more unit tests)',
    'blocked by the Oracle (the PM) who speaks only in riddles',
    'the deployment pipeline has fallen silent — its purpose, unknown',
    'the legacy system resists all attempts at modernisation',
    'awaiting the blessing of the architecture council',
    'the staging environment has been corrupted by forces unknown',
    'my own hubris from the previous sprint',
  ],
};

function pick(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

// ─── Output Formatters ────────────────────────────────────────────────────────
function toPlainText(yesterday, today, blockers, mode) {
  return [
    `[STANDUP — ${mode.toUpperCase()} MODE]`,
    '',
    'Yesterday:',
    ...yesterday.map(l => `• ${l}`),
    '',
    'Today:',
    ...today.map(l => `• ${l}`),
    '',
    'Blockers:',
    ...blockers.map(l => `• ${l}`),
  ].join('\n');
}

function toSlackText(yesterday, today, blockers, mode) {
  return [
    `*[STANDUP — ${mode.toUpperCase()} MODE]*`,
    '',
    '*Yesterday:*',
    ...yesterday.map(l => `• ${l}`),
    '',
    '*Today:*',
    ...today.map(l => `• ${l}`),
    '',
    '*Blockers:*',
    ...blockers.map(l => `• ${l}`),
  ].join('\n');
}

function copyToClipboard(text) {
  try {
    if (process.platform === 'darwin') {
      execFileSync('pbcopy', [], { input: text });
      return true;
    } else if (process.platform === 'linux') {
      execFileSync('xclip', ['-selection', 'clipboard'], { input: text });
      return true;
    } else if (process.platform === 'win32') {
      execFileSync('clip', [], { input: text });
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function drawBox(lines, borderColor) {
  const visibleLens = lines.map(l => stripAnsi(l).length);
  const maxLen = Math.max(...visibleLens);
  const width = maxLen + 2;
  const top    = color(`╔${'═'.repeat(width)}╗`, borderColor);
  const bottom = color(`╚${'═'.repeat(width)}╝`, borderColor);
  const rows = lines.map((l, i) => {
    const pad = width - visibleLens[i] - 1;
    return color('║', borderColor) + ' ' + l + ' '.repeat(pad) + color('║', borderColor);
  });
  return [top, ...rows, bottom].join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
  if (!isGitRepo()) {
    console.error(color('Not a git repository. Run this from inside a project.', c.red));
    process.exit(1);
  }

  const commits = getCommits(days);

  const pColors = {
    honest: c.green,
    corporate: c.blue,
    'gen-z': c.magenta,
    dramatic: c.yellow,
  };
  const pColor = pColors[personality] || c.cyan;

  // Yesterday items
  let yesterdayItems;
  if (commits.length === 0) {
    const fallbacks = {
      honest:    'attended meetings and stared into the void',
      corporate: 'participated in critical alignment ceremonies',
      'gen-z':   'vibed in meetings and called it a day fr',
      dramatic:  'endured the eternal council of meetings, emerging unchanged',
    };
    yesterdayItems = [fallbacks[personality] || fallbacks.honest];
  } else {
    yesterdayItems = commits.slice(0, 8).map(commit => translate(commit, personality));
  }

  const todayPool   = TODAY_PREDICTIONS[personality] || TODAY_PREDICTIONS.honest;
  const blockerPool = BLOCKERS[personality]           || BLOCKERS.honest;
  const todayItems   = pick(todayPool,   Math.min(3, todayPool.length));
  const blockerItems = pick(blockerPool, 2);

  // Slack-only output
  if (slackMode) {
    const text = toSlackText(yesterdayItems, todayItems, blockerItems, personality);
    console.log(text);
    if (copyMode) {
      const ok = copyToClipboard(text);
      console.log(ok ? '\nCopied to clipboard.' : '\nCould not copy — paste manually.');
    }
    return;
  }

  // Terminal output
  const dayLabel = days === 1 ? 'last 24h' : `last ${days} days`;
  const header = drawBox(
    [
      color('  STANDUP UPDATE GENERATOR  ', c.bold, pColor),
      color(`       ${personality.toUpperCase()} MODE        `, c.dim),
    ],
    pColor
  );

  console.log('\n' + header + '\n');

  const bullet    = color('•', pColor);
  const redBullet = color('•', c.red);

  console.log(color(`Yesterday ${color(`(${dayLabel}, ${commits.length} commit${commits.length !== 1 ? 's' : ''})`, c.dim)}:`, c.bold));
  yesterdayItems.forEach(item => console.log(`  ${bullet} ${item}`));

  console.log('\n' + color('Today:', c.bold));
  todayItems.forEach(item => console.log(`  ${bullet} ${item}`));

  console.log('\n' + color('Blockers:', c.bold, c.red));
  blockerItems.forEach(item => console.log(`  ${redBullet} ${item}`));

  console.log('\n' + color('─'.repeat(52), c.dim));

  if (commits.length > 0) {
    console.log(color(`Raw commits (${commits.length}):`, c.dim));
    commits.slice(0, 5).forEach(({ hash, message }) => {
      console.log(color(`  ${hash.slice(0, 7)}  ${message}`, c.dim));
    });
    if (commits.length > 5) {
      console.log(color(`  ... and ${commits.length - 5} more`, c.dim));
    }
    console.log('');
  }

  if (copyMode) {
    const plain = toPlainText(yesterdayItems, todayItems, blockerItems, personality);
    const ok = copyToClipboard(plain);
    console.log(ok
      ? color('Copied to clipboard.', c.green)
      : color('Could not copy — paste manually.', c.yellow)
    );
    console.log('');
  }
}

main();
