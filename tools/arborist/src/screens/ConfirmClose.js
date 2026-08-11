import React from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import htm from 'htm';

const html = htm.bind(React.createElement);

export default function ConfirmClose({ worktree, warnings, onConfirm, onCancel }) {
  useInput((input, key) => {
    if (input === 'q' || key.escape) onCancel();
  });

  const branch = worktree.detached ? null : worktree.branch;
  const target = worktree.detached ? `(detached ${worktree.head?.slice(0, 8) ?? '?'})` : branch;

  const items = [
    { key: 'no', label: 'Cancel', value: 'no' },
    { key: 'wt', label: 'Remove worktree (keep branch)', value: 'wt' },
    branch
      ? { key: 'wtb', label: `Remove worktree AND delete branch (${branch})`, value: 'wtb' }
      : null,
  ].filter(Boolean);

  return html`
    <${Box} flexDirection="column">
      <${Box} marginBottom=${1} flexDirection="column">
        <${Text} bold=${true} color="yellow">Close out worktree</${Text}>
        <${Box} marginTop=${1} flexDirection="column">
          <${Text}>path:   ${worktree.path}</${Text}>
          <${Text}>branch: ${target}</${Text}>
        </${Box}>
        ${warnings.length > 0
          ? html`<${Box} marginTop=${1} flexDirection="column">
              ${warnings.map((w, i) => html`<${Text} key=${i} color="yellow">! ${w}</${Text}>`)}
            </${Box}>`
          : null}
      </${Box}>
      <${SelectInput}
        items=${items}
        onSelect=${item => {
          if (item.value === 'no') onCancel();
          else onConfirm({ deleteBranch: item.value === 'wtb' });
        }}
      />
    </${Box}>
  `;
}
