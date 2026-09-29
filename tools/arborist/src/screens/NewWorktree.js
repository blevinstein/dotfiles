import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import htm from 'htm';
import { join } from 'node:path';

const html = htm.bind(React.createElement);

const OTHER_VALUE = '__other__';

// Multi-step form:
//   1. branch name (text)
//   2. base ref, only if the branch is new (select, with a text sub-step for "other")
//   3. path (text, prefilled)
//   4. confirm (select)
export default function NewWorktree({
  defaultParent,
  repoName,
  defaultBranchName,
  currentBranchName,
  branchExistsFn,
  refExistsFn,
  onCreate,
  onCancel,
}) {
  const [step, setStep] = useState('branch');
  const [branch, setBranch] = useState('');
  const [base, setBase] = useState('');
  const [baseInput, setBaseInput] = useState('');
  const [baseError, setBaseError] = useState('');
  const [path, setPath] = useState('');
  const [exists, setExists] = useState(false);

  useInput((input, key) => {
    if (key.escape) onCancel();
  });

  if (step === 'branch') {
    return html`
      <${Box} flexDirection="column">
        <${Box} marginBottom=${1}>
          <${Text} bold=${true}>New worktree — branch name</${Text}>
        </${Box}>
        <${Box}>
          <${Text}>branch: </${Text}>
          <${TextInput}
            value=${branch}
            onChange=${setBranch}
            onSubmit=${value => {
              const b = value.trim();
              if (!b) return;
              const existsBranch = branchExistsFn(b);
              setExists(existsBranch);
              const suggested = defaultParent ? join(defaultParent, repoName, b) : '';
              setPath(suggested);
              setStep(existsBranch ? 'path' : 'base');
            }}
          />
        </${Box}>
        <${Box} marginTop=${1} flexDirection="column">
          <${Text} dimColor=${true}>enter next · esc cancel</${Text}>
          ${!defaultParent
            ? html`<${Text} color="yellow">$WORKTREE_HOME is not set — you will need to type the full path manually.</${Text}>`
            : null}
        </${Box}>
      </${Box}>
    `;
  }

  if (step === 'base') {
    const items = [
      {
        key: 'default',
        label: defaultBranchName ? `${defaultBranchName} (default)` : 'HEAD (default; no main/master found)',
        value: defaultBranchName ?? '',
      },
      currentBranchName && currentBranchName !== defaultBranchName
        ? { key: 'current', label: `current branch (${currentBranchName})`, value: currentBranchName }
        : null,
      { key: 'other', label: 'Enter other (branch or tag)...', value: OTHER_VALUE },
    ].filter(Boolean);

    return html`
      <${Box} flexDirection="column">
        <${Box} marginBottom=${1} flexDirection="column">
          <${Text} bold=${true}>New worktree — base branch</${Text}>
          <${Text} dimColor=${true}>branch: ${branch} (will be created)</${Text}>
        </${Box}>
        <${SelectInput}
          items=${items}
          onSelect=${item => {
            if (item.value === OTHER_VALUE) {
              setBaseError('');
              setStep('baseOther');
            } else {
              setBase(item.value);
              setStep('path');
            }
          }}
        />
        <${Box} marginTop=${1}>
          <${Text} dimColor=${true}>enter select · esc cancel</${Text}>
        </${Box}>
      </${Box}>
    `;
  }

  if (step === 'baseOther') {
    return html`
      <${Box} flexDirection="column">
        <${Box} marginBottom=${1} flexDirection="column">
          <${Text} bold=${true}>New worktree — base branch</${Text}>
          <${Text} dimColor=${true}>branch: ${branch} (will be created)</${Text}>
        </${Box}>
        <${Box}>
          <${Text}>base:   </${Text}>
          <${TextInput}
            value=${baseInput}
            onChange=${setBaseInput}
            onSubmit=${value => {
              const b = value.trim();
              if (!b) return;
              if (refExistsFn && !refExistsFn(b)) {
                setBaseError(`"${b}" does not resolve to a branch, tag, or commit.`);
                return;
              }
              setBase(b);
              setStep('path');
            }}
          />
        </${Box}>
        ${baseError ? html`<${Box} marginTop=${1}><${Text} color="red">${baseError}</${Text}></${Box}>` : null}
        <${Box} marginTop=${1}>
          <${Text} dimColor=${true}>enter next · esc cancel</${Text}>
        </${Box}>
      </${Box}>
    `;
  }

  if (step === 'path') {
    return html`
      <${Box} flexDirection="column">
        <${Box} marginBottom=${1} flexDirection="column">
          <${Text} bold=${true}>New worktree — path</${Text}>
          <${Text} dimColor=${true}>branch: ${branch} ${exists ? '(existing branch)' : `(will be created from ${base || 'HEAD'})`}</${Text}>
        </${Box}>
        <${Box}>
          <${Text}>path:   </${Text}>
          <${TextInput}
            value=${path}
            onChange=${setPath}
            onSubmit=${value => {
              const p = value.trim();
              if (!p) return;
              setStep('confirm');
            }}
          />
        </${Box}>
        <${Box} marginTop=${1}>
          <${Text} dimColor=${true}>enter next · esc cancel</${Text}>
        </${Box}>
      </${Box}>
    `;
  }

  // confirm
  return html`
    <${Box} flexDirection="column">
      <${Box} marginBottom=${1} flexDirection="column">
        <${Text} bold=${true}>Confirm new worktree</${Text}>
        <${Text}>branch: <${Text} color="cyan">${branch}</${Text}> ${exists ? '(existing)' : `(new, from ${base || 'HEAD'})`}</${Text}>
        <${Text}>path:   ${path}</${Text}>
      </${Box}>
      <${SelectInput}
        items=${[
          { key: 'no', label: 'Cancel', value: 'no' },
          { key: 'yes', label: 'Create worktree', value: 'yes' },
        ]}
        onSelect=${item => {
          if (item.value === 'yes') onCreate({ branch, path, createBranch: !exists, base: exists ? undefined : base || undefined });
          else onCancel();
        }}
      />
    </${Box}>
  `;
}
