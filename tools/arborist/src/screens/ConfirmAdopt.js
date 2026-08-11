import React from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import htm from 'htm';

const html = htm.bind(React.createElement);

export default function ConfirmAdopt({ worktree, cwd, cwdBranch, warnings, onConfirm, onCancel }) {
  useInput((input, key) => {
    if (input === 'q' || key.escape) onCancel();
  });

  const target = worktree.detached ? `(detached ${worktree.head?.slice(0, 8) ?? '?'})` : worktree.branch;

  return html`
    <${Box} flexDirection="column">
      <${Box} marginBottom=${1} flexDirection="column">
        <${Text} bold=${true} color="yellow">Adopt worktree into current folder</${Text}>
        <${Box} marginTop=${1} flexDirection="column">
          <${Text}>1. <${Text} color="red">git worktree remove</${Text}> ${worktree.path}</${Text}>
          <${Text}>2. <${Text} color="green">git checkout</${Text}> ${target} (in ${cwd})</${Text}>
        </${Box}>
        ${cwdBranch ? html`<${Box} marginTop=${1}><${Text} dimColor=${true}>current branch here: ${cwdBranch}</${Text}></${Box}>` : null}
        ${warnings.length > 0
          ? html`<${Box} marginTop=${1} flexDirection="column">
              ${warnings.map((w, i) => html`<${Text} key=${i} color="yellow">! ${w}</${Text}>`)}
            </${Box}>`
          : null}
      </${Box}>
      <${SelectInput}
        items=${[
          { key: 'no', label: 'Cancel', value: 'no' },
          { key: 'yes', label: 'Confirm adopt', value: 'yes' },
        ]}
        onSelect=${item => (item.value === 'yes' ? onConfirm() : onCancel())}
      />
    </${Box}>
  `;
}
