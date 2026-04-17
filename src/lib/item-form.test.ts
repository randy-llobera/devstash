import { describe, expect, it } from 'vitest';

import {
  isContentItemType,
  isFileItemType,
  isLanguageItemType,
  isUrlItemType,
  parseItemTagsInput,
} from '@/lib/item-form';

describe('item-form helpers', () => {
  it('parses comma-separated tags and removes duplicates', () => {
    expect(parseItemTagsInput(' react, prisma, react , , auth ')).toEqual([
      'react',
      'prisma',
      'auth',
    ]);
  });

  it('matches item form modes case-insensitively', () => {
    expect(isContentItemType('Snippet')).toBe(true);
    expect(isLanguageItemType('COMMAND')).toBe(true);
    expect(isFileItemType('image')).toBe(true);
    expect(isUrlItemType('link')).toBe(true);
    expect(isUrlItemType('note')).toBe(false);
  });
});
