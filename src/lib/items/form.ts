export const ITEM_FORM_TYPES = [
  'snippet',
  'prompt',
  'command',
  'note',
  'file',
  'image',
  'link',
] as const;

export type ItemFormType = (typeof ITEM_FORM_TYPES)[number];

export const CONTENT_ITEM_TYPES = ['snippet', 'prompt', 'command', 'note'] as const;
export const FILE_ITEM_TYPES = ['file', 'image'] as const;
export const LANGUAGE_ITEM_TYPES = ['snippet', 'command'] as const;
export const MARKDOWN_ITEM_TYPES = ['note', 'prompt'] as const;
export const URL_ITEM_TYPES = ['link'] as const;

const contentItemTypeSet = new Set<ItemFormType>(CONTENT_ITEM_TYPES);
const fileItemTypeSet = new Set<ItemFormType>(FILE_ITEM_TYPES);
const languageItemTypeSet = new Set<ItemFormType>(LANGUAGE_ITEM_TYPES);
const urlItemTypeSet = new Set<ItemFormType>(URL_ITEM_TYPES);

const normalizeItemType = (itemType: string | null | undefined) =>
  itemType?.trim().toLowerCase() ?? '';

export const isContentItemType = (itemType: string | null | undefined) =>
  contentItemTypeSet.has(normalizeItemType(itemType) as ItemFormType);

export const isFileItemType = (itemType: string | null | undefined) =>
  fileItemTypeSet.has(normalizeItemType(itemType) as ItemFormType);

export const isLanguageItemType = (itemType: string | null | undefined) =>
  languageItemTypeSet.has(normalizeItemType(itemType) as ItemFormType);

export const isUrlItemType = (itemType: string | null | undefined) =>
  urlItemTypeSet.has(normalizeItemType(itemType) as ItemFormType);

export const parseItemTagsInput = (value: string) =>
  Array.from(
    new Set(
      value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
