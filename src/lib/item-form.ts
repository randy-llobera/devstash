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

const CONTENT_ITEM_TYPES = new Set<ItemFormType>(['snippet', 'prompt', 'command', 'note']);
const FILE_ITEM_TYPES = new Set<ItemFormType>(['file', 'image']);
const LANGUAGE_ITEM_TYPES = new Set<ItemFormType>(['snippet', 'command']);
const URL_ITEM_TYPES = new Set<ItemFormType>(['link']);

const normalizeItemType = (itemType: string | null | undefined) =>
  itemType?.trim().toLowerCase() ?? '';

export const isContentItemType = (itemType: string | null | undefined) =>
  CONTENT_ITEM_TYPES.has(normalizeItemType(itemType) as ItemFormType);

export const isFileItemType = (itemType: string | null | undefined) =>
  FILE_ITEM_TYPES.has(normalizeItemType(itemType) as ItemFormType);

export const isLanguageItemType = (itemType: string | null | undefined) =>
  LANGUAGE_ITEM_TYPES.has(normalizeItemType(itemType) as ItemFormType);

export const isUrlItemType = (itemType: string | null | undefined) =>
  URL_ITEM_TYPES.has(normalizeItemType(itemType) as ItemFormType);

export const parseItemTagsInput = (value: string) =>
  Array.from(
    new Set(
      value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
