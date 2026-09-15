---
name: caic-issue
description: Write and file a GitHub issue in this repo — body structure, the up-front API contract, sub-issue linking via gh, and escalation to an epic when the work is an umbrella. Use when the user asks to "file an issue", "open a sub-issue", "write up a task", or when breaking an epic into children.
---

How to write a good issue in this repo and how to wire a sub-issue to its parent.

If the work is an umbrella that splits into multiple children, author it as an epic instead — see [epic-authoring.md](references/epic-authoring.md).

## Start from a plan

An issue is a projection of a decision that has already been made. Filing one before the shape is settled produces an issue that gets rewritten twice, so for anything beyond a single obvious PR, plan first.

- **If you already know of a plan, ask which fork it is on** — see [caic-plan](../caic-plan/SKILL.md#pick-the-artifact-first). A plan that produces issues is consumed by filing this one: its Goal, acceptance criteria, and API contract come straight out of it, and an epic's children come from its per-step breakdown table. A plan that produces work keeps its criteria in its `PLAN-{N}` step files and is consumed by producing the PRs — don't lift them into an issue. Whichever artifact holds the criteria owns them; two copies drift.
- **If you don't, ask.** Check `.github/plan-drafts/` for a folder covering this effort and ask the user whether a plan exists that you haven't seen — plans are git-ignored, so one may be sitting on their working copy or in a past session.
- **If there is none and the work spans multiple PRs, draft one first** with the [caic-plan](../caic-plan/SKILL.md) skill. Come back and file only if that plan turns out to be issue-producing; if it produces the work directly, there is nothing to file.

A one-PR change with an obvious approach needs no plan. Don't manufacture one.

This skill owns the body's structure, its criteria, and the `gh` calls that file it. **How the words go is [issue-bodies.md](../caic-copy-writer/references/issue-bodies.md)** — type 10 — including the title, the reading-level gate on the draft, and the claim-before-scaffolding rule that bites hardest here.

## Title style

How to word one: [issue-bodies.md](../caic-copy-writer/references/issue-bodies.md). The only mechanical rule is the prefix, and there isn't one for `gh`-filed sub-issues — the [DEVELOPMENT_TASK.yaml](../../../.github/ISSUE_TEMPLATE/DEVELOPMENT_TASK.yaml) form prepends `[Task]: ` for scannability in lists, and a `gh`-filed issue goes without.

## Body structure

Internal development work uses these sections — the same ones the [DEVELOPMENT_TASK.yaml](../../../.github/ISSUE_TEMPLATE/DEVELOPMENT_TASK.yaml) form prompts, so a `gh`-filed issue and a form-filed one read identically. Read that form's `description:` text for what each section has to contain; it is the per-field instruction for both paths, and `gh` never renders it.

- **Background** — the _why_, opening with the problem in plain language: who is bitten and what goes wrong today, before any file, script, or type name. A reader meets the problem here and the proposed implementation later, so they can judge whether it fits — see [issue-bodies.md](../caic-copy-writer/references/issue-bodies.md). Then the links: the parent epic if this is a sub-issue, and the ADR if this implements a recorded decision — that is what [caic-review](../caic-review/SKILL.md) checks the diff against.
- **Goal** — the change that exists when this is done.
- **Acceptance criteria** — a `- [ ]` list of observable outcomes, each carrying its proof, in the format [caic-plan](../caic-plan/SKILL.md#acceptance-criteria) defines.
- **Public API / contract** — the up-front contract, shape and behavior (see [api-contract.md](../caic-plan/references/api-contract.md)); omit only when nothing a consumer can observe changes.
- **Out of scope** — what this deliberately does not cover.
- **Related** — parent epic, siblings, PRs, designs. A `Depends on: #N (reason)` line carries the _reason_ a blocker blocks; the relationship itself is a dependency link, not prose — see [Recording blockers](#recording-blockers).

## Acceptance criteria

The format — one outcome per box, observable from outside, each naming its proof — is in [caic-plan](../caic-plan/SKILL.md#acceptance-criteria).

When implementation proves a criterion wrong, say so in a **comment** on the issue — what the code does instead, and why the original was wrong. Never rewrite the criterion in the body; the original reasoning has to stay readable beside the correction. An amendment takes the same approval gate as filing.

## Drafting the body

Draft the body into `.github/issue-drafts/<kebab-case-slug>.md` and file it with `--body-file`. That directory is git-ignored, so drafts stay local. Rename to `<issue#>-<slug>.md` once filed, so the draft and the live issue are findable from either side. Use `###` headings: the form emits `### <label>` per field, so a form-filed issue is `###` by construction and a `gh`-filed one has to match.

Keep the draft in sync with the live issue whenever you edit one — correcting only the GitHub copy means the next edit from the draft silently reverts it.

## Define the contract up front

State the contract in the issue, before implementation starts, whenever a task changes what a consumer can observe on the public surface. The locks it has to settle, and how to write them down, are in [api-contract.md](../caic-plan/references/api-contract.md).

## Before anything is filed

Drafting ends at the file. Filing is a separate ask — **never run a `gh` command that writes to GitHub before the user has seen the body and said go.** An issue opened on a public repo is visible immediately, and closing it doesn't undo that. The same gate covers amending a filed issue.

Then, before the command:

- **Resolve the repo.** Every call below takes an explicit `<owner>/<repo>`, and nothing here fills it in for you. Run `git remote -v`; if more than one remote is configured, or any of them points somewhere other than where this issue belongs, ask which repo to file against rather than letting `gh` pick a default. Same check [caic-pr](../caic-pr/SKILL.md) runs before opening a PR.
- **Carry it through.** The sub-issue and dependency calls take the same `<owner>/<repo>`. A child filed on one repo can't be linked under a parent on another.
- **No agent attribution** in the title or body.

## Filing a sub-issue via `gh`

The sub-issues REST API links by the child's database **id**, not its issue number — the common mistake. The flow:

```bash
# 1. Create the child; note the new issue number N from the output.
gh issue create --repo <owner>/<repo> --title "<title>" --body-file <file>

# 2. Resolve the child's database id (NOT the issue number N).
CHILD_ID=$(gh api repos/<owner>/<repo>/issues/N --jq .id)

# 3. Link it under the parent.
gh api --method POST repos/<owner>/<repo>/issues/<parent>/sub_issues -F sub_issue_id="$CHILD_ID"
```

- The POST response echoes the **parent** issue, not the child — that's expected.
- A `422 "duplicate sub-issue"` just means a prior POST already succeeded; treat it as done.
- A sub-issue may have only **one** parent.

## Verifying the link

```bash
gh api --paginate "repos/<owner>/<repo>/issues/<parent>/sub_issues?per_page=100"
```

Check the children list, and `sub_issues_summary.total` on the parent. The summary count can lag a cached read — trust the paginated list if the two disagree.

## Recording blockers

Record a blocker with the dependencies API. GitHub then banners the blocked issue, lists it in the blocker's sidebar, and clears the banner when the blocker closes — body prose does none of that.

The API mirrors sub-issues, including the gotcha: it keys on the blocker's database **id**, not its issue number.

```bash
# 1. Resolve the BLOCKER's database id (NOT its issue number).
BLOCKER_ID=$(gh api repos/<owner>/<repo>/issues/<blocker> --jq .id)

# 2. Link it: <blocked> is now blocked by <blocker>.
gh api --method POST repos/<owner>/<repo>/issues/<blocked>/dependencies/blocked_by \
  -F issue_id="$BLOCKER_ID"

# 3. Verify from either side.
gh api repos/<owner>/<repo>/issues/<blocked>/dependencies/blocked_by
gh api repos/<owner>/<repo>/issues/<blocker>/dependencies/blocking
```

- Unlink with `DELETE repos/<owner>/<repo>/issues/<blocked>/dependencies/blocked_by/$BLOCKER_ID` — database id again.
- Keep the `Depends on: #N (reason)` prose for the _why_, but never in place of the link.
- Bulk linking in a burst trips secondary rate limits. Pace the calls.

## Internal vs. external

- **Internal work** → the [DEVELOPMENT_TASK.yaml](../../../.github/ISSUE_TEMPLATE/DEVELOPMENT_TASK.yaml) form, or a blank issue following the body structure above.
- **External reporters** → the typed forms ([BUG_REPORT.yaml](../../../.github/ISSUE_TEMPLATE/BUG_REPORT.yaml), [FEATURE_REQUEST_OR_ENHANCEMENT.yaml](../../../.github/ISSUE_TEMPLATE/FEATURE_REQUEST_OR_ENHANCEMENT.yaml), and siblings). Don't route internal tasks through these.

## Labels

Apply labels only when they drive a workflow (triage queue, release notes, a board filter). The issue **type** (`Task`) and the parent-epic link already carry most categorization, so skip decorative labels.

## Related guidance

- [epic-authoring.md](references/epic-authoring.md) — when to group sub-issues under an epic, and how to track them
- [issue-bodies.md](../caic-copy-writer/references/issue-bodies.md) — how to word the body and the title, and the gate before filing
- [tone.md](../../../references/tone.md) — voice and quick rules for the issue body
- [caic-pr](../caic-pr/SKILL.md) — turning a completed issue into a PR description
- [Root AGENTS.md](../../../AGENTS.md) — repo overview and pointer index

Task input from the user, if any: $ARGUMENTS
