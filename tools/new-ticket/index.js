#!/usr/bin/env node
// Usage: node ~/tools/new-ticket/index.js
//
// NOTE: Currently hardcoded to use CLCM project. Eventually I should change to use a config of
// some kind? Also for configuring item choices, labels, etc.

import { select, input, editor, confirm } from '@inquirer/prompts';
import { execSync } from 'child_process';

const PROJECT = 'CLCM';

const q = s => `'${s.replace(/'/g, `'\\''`)}'`;

const type = await select({
  message: 'Work item type',
  choices: ['User Story', 'Bug', 'Task', 'Epic', 'Sub-task', 'Document'].map(t => ({ value: t })),
});

const summary = await input({ message: 'Summary (title)', required: true });

const description = await editor({
  message: 'Description (optional)',
  waitForUserInput: false,
  default: 'Describe your issue here.',
  postfix: '.md',
});

const priority = await select({
  message: 'Priority',
  choices: ['TBD', 'Low', 'Medium', 'High', 'Critical'].map(p => ({ value: p })),
});

const assignee = await input({ message: 'Assignee email (or @me, optional)' });

const parent = (['Sub-task', 'User Story'].includes(type))
  ? await input({ message: 'Parent work item key (e.g. CLCM-123, optional)' })
  : '';

const labels = await input({ message: 'Labels (comma-separated, optional)' });

const args = [
  'acli jira workitem create',
  `--project ${q(PROJECT)}`,
  `--type ${q(type)}`,
  `--summary ${q(summary)}`,
  description && `--description ${q(description)}`,
  priority !== 'TBD' && `--label ${q('priority:' + priority)}`,
  assignee && `--assignee ${q(assignee)}`,
  parent && `--parent ${q(parent)}`,
  labels && `--label ${q(labels)}`,
].filter(Boolean);

const cmd = args.join(' ');

console.error(`\n${cmd}\n`);

const run = await confirm({ message: 'Execute this command?', default: false }).catch(() => false);

if (run) {
  execSync(cmd, { stdio: 'inherit' });
}
