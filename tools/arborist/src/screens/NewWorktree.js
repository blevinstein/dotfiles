import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import htm from 'htm';
import { join } from 'node:path';

const html = htm.bind(React.createElement);

// Multi-step form:
//   1. branch name (text)
//   2. path (text, prefilled)
//   3. confirm (select)
export default function NewWorktree({ defaultParent, repoName, branchExistsFn, onCreate, onCancel }) {
  const [step, setStep] = useState('branch');
  const [branch, setBranch] = useState('');
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
              setStep('path');
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

  if (step === 'path') {
    return html`
      <${Box} flexDirection="column">
        <${Box} marginBottom=${1} flexDirection="column">
          <${Text} bold=${true}>New worktree — path</${Text}>
          <${Text} dimColor=${true}>branch: ${branch} ${exists ? '(existing branch)' : '(will be created)'}</${Text}>
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
        <${Text}>branch: <${Text} color="cyan">${branch}</${Text}> ${exists ? '(existing)' : '(new, from HEAD)'}</${Text}>
        <${Text}>path:   ${path}</${Text}>
      </${Box}>
      <${SelectInput}
        items=${[
          { key: 'no', label: 'Cancel', value: 'no' },
          { key: 'yes', label: 'Create worktree', value: 'yes' },
        ]}
        onSelect=${item => {
          if (item.value === 'yes') onCreate({ branch, path, createBranch: !exists });
          else onCancel();
        }}
      />
    </${Box}>
  `;
}
