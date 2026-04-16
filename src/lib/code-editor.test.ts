import { describe, expect, it } from 'vitest';

import { getCodeEditorLanguage, isCodeEditorItemType } from '@/lib/code-editor';

describe('isCodeEditorItemType', () => {
  it('returns true for snippet and command item types', () => {
    expect(isCodeEditorItemType('snippet')).toBe(true);
    expect(isCodeEditorItemType('command')).toBe(true);
  });

  it('returns false for non-code item types', () => {
    expect(isCodeEditorItemType('note')).toBe(false);
    expect(isCodeEditorItemType('prompt')).toBe(false);
    expect(isCodeEditorItemType('link')).toBe(false);
  });
});

describe('getCodeEditorLanguage', () => {
  it('maps known language aliases to Monaco languages and labels', () => {
    expect(getCodeEditorLanguage('ts', 'snippet')).toEqual({
      editorLanguage: 'typescript',
      label: 'TypeScript',
    });

    expect(getCodeEditorLanguage('bash', 'command')).toEqual({
      editorLanguage: 'shell',
      label: 'Bash',
    });
  });

  it('falls back to shell for commands without an explicit language', () => {
    expect(getCodeEditorLanguage('', 'command')).toEqual({
      editorLanguage: 'shell',
      label: 'Shell',
    });
  });

  it('preserves unknown custom language labels while using plaintext mode', () => {
    expect(getCodeEditorLanguage('Custom DSL', 'snippet')).toEqual({
      editorLanguage: 'plaintext',
      label: 'Custom DSL',
    });
  });
});
