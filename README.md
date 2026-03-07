```
 _____ _____ _____ _   _ ____  _   _ ____
/ ____|_   _/ ____| \ | |  _ \| | | |  _ \
| (___  | || |    |  \| | | | | | | | |_) |
 \___ \ | || |    | . ` | | | | | | |  __/
 ____) || || |____| |\  | |_| | |_| | |
|_____/|_____\_____|_| \_|____/ \___/|_|

  G E N E R A T O R
  turn your git log into something
  you can actually say out loud
```

> Zero dependencies. Four personalities. One tool that finally makes standups bearable.

---

## Install

```bash
# Run instantly with npx (no install needed)

[![npm version](https://img.shields.io/npm/v/standup-generator.svg)](https://www.npmjs.com/package/standup-generator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14-brightgreen.svg)](https://nodejs.org)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-blue.svg)](https://www.npmjs.com/package/standup-generator)
npx standup-generator

# Or install globally
npm install -g standup-generator
```

---

## What it does

Reads your actual `git log`, translates commit messages into standup-speak, and generates a Yesterday / Today / Blockers update — in whichever personality you choose.

---

## Personality Modes

### `--personality honest` (default)
Raw developer truth. Use this when you want to actually communicate what happened.

```
Yesterday:
  • mass-murdered the "null check" bug that's been haunting prod since Tuesday
  • moved code from one place to another and called it "architecture" (refactor)
  • wrote tests for login flow — they're red but they EXIST now
  • did the dishes nobody else wanted to touch: update deps

Today:
  • stare at a bug for 2 hours, fix it with one semicolon
  • leave a comment saying "// TODO: fix later" (it will never be fixed)
  • probably break what I fixed yesterday

Blockers:
  • the ticket has no acceptance criteria and I'm fully improvising
  • waiting for review from someone who's "OOO until Thursday"
```

---

### `--personality corporate`
Maximum jargon. Great for when the VP is in the standup.

```
Yesterday:
  • remediated a critical deficiency in our value delivery pipeline pertaining to "null check"
  • executed a strategic architectural realignment to optimise our technical debt portfolio
  • implemented comprehensive quality assurance protocols to validate deliverable integrity

Today:
  • attend a series of alignment syncs to socialise our Q2 deliverables
  • drive consensus on our architectural north star
  • move the needle on our technical debt reduction initiative

Blockers:
  • awaiting alignment from key stakeholders on acceptance criteria
  • resource contention across multiple workstreams
```

---

### `--personality gen-z`
The vibes-first update. Shockingly clear.

```
Yesterday:
  • "null check" was giving broken energy, no cap fixed it fr fr
  • the code was lowkey mid so i cleaned it up, it's bussin now ngl
  • wrote tests and they're giving main character energy (some of them pass bestie)

Today:
  • slay this sprint backlog, no notes
  • fix yesterday's code because yesterday-me was not it
  • do the thing that needs doing, whatever that even is bestie

Blockers:
  • the requirements are giving confusion energy ngl
  • waiting on a PR review and the vibe is off
```

---

### `--personality dramatic`
Shakespeare joined your engineering team.

```
Yesterday:
  • slayed the ancient "null check" dragon that lay within the fortress of production
  • restructured the kingdoms of code so that future generations may thrive
  • forged iron-clad tests — let not a single bug pass through unchallenged

Today:
  • embark upon the treacherous quest to resolve the outstanding tickets
  • stand vigil over the CI pipeline until it turns green
  • seek wisdom from the ancients (Stack Overflow, circa 2014)

Blockers:
  • the ancient dependency refuses to be upgraded — it is cursed
  • the deployment pipeline has fallen silent — its purpose, unknown
```

---

## All Options

```
standup-generator [options]

--personality  honest | corporate | gen-z | dramatic    (default: honest)
--days         How many days back to read git log       (default: 1)
--slack        Output plain text formatted for Slack
--copy         Copy result to clipboard
--help         Show help
```

### Examples

```bash
# Default: honest mode, last 24h
standup-generator

# Corporate mode, last 2 days
standup-generator --personality corporate --days 2

# Gen-Z, copy to clipboard
standup-generator --personality gen-z --copy

# Slack-formatted, ready to paste
standup-generator --personality honest --slack --copy

# Dramatic retrospective for the week
standup-generator --personality dramatic --days 7
```

---

## Commit Translation Rules

| Commit type | Translation |
|-------------|-------------|
| `fix` / `bug` / `hotfix` | Combat/battle metaphors |
| `refactor` | Moving furniture metaphors |
| `test` | Self-deprecating test humor |
| `feat` / `add` | Building/creation metaphors |
| `docs` | "wrote words about code instead of writing code" |
| `style` / `lint` | "made the computer happy about whitespace" |
| `chore` / `deps` | "did the dishes nobody else wanted to touch" |
| `merge` | Diplomatic relations / peace treaty |
| `revert` | Time travel humor |
| `WIP` | "committed code that definitely works (narrator: it did not)" |
| `initial commit` | "brought another repository into this world" |

Works with conventional commits (`fix: null check`, `feat(auth): add login`) and plain messages alike.

---

## Requirements

- Node.js 14+
- Must be run inside a git repository
- Zero npm dependencies (pure Node.js stdlib)

---

## You might also like

Check out more tools at [github.com/NickCirv](https://github.com/NickCirv)

---

## License

MIT

## Contributing

PRs welcome! If you have a funny idea or improvement:

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-idea`)
3. Commit your changes
4. Push to the branch (`git push origin feature/amazing-idea`)
5. Open a Pull Request

Found a bug? [Open an issue](https://github.com/NickCirv/standup-generator/issues).

---

If this made you mass-exhale through your nose, mass-hit that star button.
