const MARKDOWN_EDITOR_ITEM_TYPES = new Set(['note', 'prompt']);

export const isMarkdownEditorItemType = (itemType: string | null | undefined) =>
  MARKDOWN_EDITOR_ITEM_TYPES.has(itemType?.trim().toLowerCase() ?? '');
