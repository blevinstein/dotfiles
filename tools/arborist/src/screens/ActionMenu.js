import React from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import htm from 'htm';

const html = htm.bind(React.createElement);

// Custom item renderer so items can carry a `color` prop (e.g. red for destructive
// actions). Falls back to the ink-select-input default (blue when selected).
function ColoredItem({ isSelected, label, color }) {
  const resolved = color ?? (isSelected ? 'blue' : undefined);
  return React.createElement(Text, { color: resolved, bold: isSelected }, label);
}

export default function ActionMenu({
  worktree,
  canAdopt,
  adoptBlockedReason,
  canClose,
  closeBlockedReason,
  onAction,
  onBack,
}) {
  useInput((input, key) => {
    if (input === 'q') onBack();
    if (key.escape) onBack();
  });

  const items = [
    { key: 'tmux', label: 'Open in tmux (attach or create session)', value: 'tmux' },
    canAdopt
      ? { key: 'adopt', label: 'Adopt here (remove worktree, checkout branch in cwd)', value: 'adopt' }
      : null,
    canClose
      ? {
          key: 'close',
          label: 'Close out (remove worktree, optionally delete branch)',
          value: 'close',
          color: 'red',
        }
      : null,
    { key: 'back', label: 'Back', value: 'back' },
  ].filter(Boolean);

  const label = worktree.detached ? `(detached @ ${worktree.head?.slice(0, 8) ?? '?'})` : worktree.branch;

  return html`
    <${Box} flexDirection="column">
      <${Box} marginBottom=${1} flexDirection="column">
        <${Text} bold=${true}>Selected: <${Text} color="cyan">${label}</${Text}></${Text}>
        <${Text} dimColor=${true}>${worktree.path}</${Text}>
      </${Box}>
      <${SelectInput}
        items=${items}
        itemComponent=${ColoredItem}
        onSelect=${item => (item.value === 'back' ? onBack() : onAction(item.value))}
      />
      ${!canAdopt && adoptBlockedReason
        ? html`<${Box} marginTop=${1}><${Text} color="yellow">Adopt disabled: ${adoptBlockedReason}</${Text}></${Box}>`
        : null}
      ${!canClose && closeBlockedReason
        ? html`<${Box}><${Text} color="yellow">Close disabled: ${closeBlockedReason}</${Text}></${Box}>`
        : null}
      <${Box} marginTop=${1}>
        <${Text} dimColor=${true}>enter select · q/esc back</${Text}>
      </${Box}>
    </${Box}>
  `;
}
