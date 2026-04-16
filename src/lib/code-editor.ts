const CODE_EDITOR_ITEM_TYPES = new Set(['snippet', 'command']);

const LANGUAGE_ALIASES: Record<string, { editorLanguage: string; label: string }> = {
  bash: { editorLanguage: 'shell', label: 'Bash' },
  c: { editorLanguage: 'c', label: 'C' },
  'c#': { editorLanguage: 'csharp', label: 'C#' },
  cpp: { editorLanguage: 'cpp', label: 'C++' },
  'c++': { editorLanguage: 'cpp', label: 'C++' },
  css: { editorLanguage: 'css', label: 'CSS' },
  docker: { editorLanguage: 'dockerfile', label: 'Dockerfile' },
  dockerfile: { editorLanguage: 'dockerfile', label: 'Dockerfile' },
  go: { editorLanguage: 'go', label: 'Go' },
  html: { editorLanguage: 'html', label: 'HTML' },
  java: { editorLanguage: 'java', label: 'Java' },
  javascript: { editorLanguage: 'javascript', label: 'JavaScript' },
  js: { editorLanguage: 'javascript', label: 'JavaScript' },
  json: { editorLanguage: 'json', label: 'JSON' },
  markdown: { editorLanguage: 'markdown', label: 'Markdown' },
  md: { editorLanguage: 'markdown', label: 'Markdown' },
  php: { editorLanguage: 'php', label: 'PHP' },
  plaintext: { editorLanguage: 'plaintext', label: 'Plain text' },
  postgres: { editorLanguage: 'sql', label: 'SQL' },
  python: { editorLanguage: 'python', label: 'Python' },
  py: { editorLanguage: 'python', label: 'Python' },
  rs: { editorLanguage: 'rust', label: 'Rust' },
  ruby: { editorLanguage: 'ruby', label: 'Ruby' },
  rust: { editorLanguage: 'rust', label: 'Rust' },
  shell: { editorLanguage: 'shell', label: 'Shell' },
  sh: { editorLanguage: 'shell', label: 'Shell' },
  sql: { editorLanguage: 'sql', label: 'SQL' },
  text: { editorLanguage: 'plaintext', label: 'Plain text' },
  ts: { editorLanguage: 'typescript', label: 'TypeScript' },
  tsx: { editorLanguage: 'typescript', label: 'TypeScript' },
  typescript: { editorLanguage: 'typescript', label: 'TypeScript' },
  xml: { editorLanguage: 'xml', label: 'XML' },
  yaml: { editorLanguage: 'yaml', label: 'YAML' },
  yml: { editorLanguage: 'yaml', label: 'YAML' },
  zsh: { editorLanguage: 'shell', label: 'Zsh' },
};

const normalizeLanguageKey = (value: string) => value.trim().toLowerCase();

export const isCodeEditorItemType = (itemType: string) =>
  CODE_EDITOR_ITEM_TYPES.has(itemType.trim().toLowerCase());

export const getCodeEditorLanguage = (
  language: string | null | undefined,
  itemType: string | null | undefined,
) => {
  const normalizedLanguage = language ? normalizeLanguageKey(language) : '';

  if (normalizedLanguage) {
    const alias = LANGUAGE_ALIASES[normalizedLanguage];

    return {
      editorLanguage: alias?.editorLanguage ?? 'plaintext',
      label: alias?.label ?? language!.trim(),
    };
  }

  if (itemType?.trim().toLowerCase() === 'command') {
    return {
      editorLanguage: 'shell',
      label: 'Shell',
    };
  }

  return {
    editorLanguage: 'plaintext',
    label: 'Plain text',
  };
};
