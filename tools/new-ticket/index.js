#!/usr/bin/env node
// Usage: node ~/tools/new-ticket/index.js

import { select, input, editor, confirm } from '@inquirer/prompts';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_PATH = join(homedir(), '.new-ticket.json');

function loadConfig() {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    console.error(`Warning: Could not read config from ${CONFIG_PATH}. Using defaults.`);
    return {};
  }
}

const config = loadConfig();
const PROJECT = config.project;
if (!PROJECT) {
  console.error(`Error: "project" is required in ${CONFIG_PATH}`);
  process.exit(1);
}

const q = s => `'${s.replace(/'/g, `'\\''`)}'`;

function fetchEpics() {
  try {
    const jql = `project = ${PROJECT} AND issuetype = Epic ORDER BY created DESC`;
    const output = execSync(
      `acli jira workitem search --jql ${q(jql)} --fields "key,summary" --json --limit 50`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const items = JSON.parse(output);
    return items.map(item => ({
      name: `${item.key}: ${item.fields.summary}`,
      value: item.key,
    }));
  } catch (e) {
    console.error('Warning: Could not fetch epics:', e.message);
    return [];
  }
}

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

let parent = '';
if (type !== 'Epic') {
  console.log('Fetching epics...');
  const epics = fetchEpics();
  const epicChoices = [
    { name: 'None', value: '' },
    ...epics,
    { name: 'Enter manually...', value: '__manual__' },
  ];
  const epicSelection = await select({
    message: 'Parent epic (optional)',
    choices: epicChoices,
  });
  if (epicSelection === '__manual__') {
    parent = await input({ message: 'Parent work item key (e.g. BOARD-123)' });
  } else {
    parent = epicSelection;
  }
}

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
