import React from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import htm from 'htm';

const html = htm.bind(React.createElement);

const NEW_VALUE = '__new__';

export default function WorktreeList({ worktrees, cwd, onSelect, onNew, onQuit }) {
  useInput((input, key) => {
    if (input === 'q' || key.escape) onQuit();
  });

  const items = [
    ...worktrees.map((wt, i) => {
      const branch = wt.detached ? `(detached @ ${wt.head?.slice(0, 8) ?? '?'})` : wt.branch ?? '?';
      const flags = [
        wt.isMain ? 'primary' : null,
        wt.isCurrent ? 'here' : null,
        wt.isLocked ? 'locked' : null,
      ].filter(Boolean);
      const flagStr = flags.length ? ` [${flags.join(', ')}]` : '';
      return {
        key: `wt-${i}`,
        label: `${branch}  ${wt.path}${flagStr}`,
        value: i,
      };
    }),
    { key: 'new', label: '+ New worktree', value: NEW_VALUE },
  ];

  const handleSelect = item => {
    if (item.value === NEW_VALUE) onNew();
    else onSelect(worktrees[item.value]);
  };

  return html`
    <${Box} flexDirection="column">
      <${Box} marginBottom=${1}>
        <${Text} bold=${true}>arborist${' '}<${Text} dimColor=${true}>— git worktrees in ${cwd}</${Text}></${Text}>
      </${Box}>
      <${SelectInput} items=${items} onSelect=${handleSelect} />
      <${Box} marginTop=${1}>
        <${Text} dimColor=${true}>↑/↓ move · enter select · q/esc quit</${Text}>
      </${Box}>
    </${Box}>
  `;
}
