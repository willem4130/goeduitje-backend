---
name: fix
description: Run typechecking and linting, then spawn parallel agents to fix all issues
---

# Project Code Quality Check

This command runs all linting and typechecking tools for this Next.js/TypeScript project, collects errors, groups them by domain, and spawns parallel agents to fix them.

## Step 1: Run Linting and Typechecking

Run the following commands for this project:

```bash
npm run lint
npm run type-check
npm run format:check
```

## Step 2: Collect and Parse Errors

Parse the output from the linting and typechecking commands. Group errors by domain:

- **Type errors**: Issues from TypeScript (`npm run type-check`)
- **Lint errors**: Issues from ESLint (`npm run lint`)
- **Format errors**: Issues from Prettier (`npm run format:check`)

Create a list of all files with issues and the specific problems in each file.

## Step 3: Spawn Parallel Agents

For each domain that has issues, spawn an agent in parallel using the Task tool.

**IMPORTANT**: Use a SINGLE response with MULTIPLE Task tool calls to run agents in parallel.

Example agent spawning:

- Spawn a "type-fixer" agent for type errors with prompt: "Fix all TypeScript type errors in the following files: [list of files with type errors]. Read each file, fix the type errors, and verify by running `npm run type-check`."

- Spawn a "lint-fixer" agent for lint errors with prompt: "Fix all ESLint errors in the following files: [list of files with lint errors]. Read each file, fix the lint errors, and verify by running `npm run lint`."

- Spawn a "format-fixer" agent for formatting errors with prompt: "Fix all Prettier formatting errors by running `npm run format`. Verify by running `npm run format:check`."

Each agent should:
1. Receive the list of files and specific errors in their domain
2. Fix all errors in their domain
3. Run the relevant check command to verify fixes
4. Report completion

## Step 4: Verify All Fixes

After all agents complete, run the full check again to ensure all issues are resolved:

```bash
npm run lint && npm run type-check && npm run format:check
```

If all checks pass, report success. If any issues remain, list them for manual review.
