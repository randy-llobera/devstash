import { z } from "zod";

export const EDITOR_THEME_OPTIONS = ["vs-dark", "monokai", "github-dark"] as const;
export const EDITOR_FONT_SIZE_OPTIONS = [12, 13, 14, 15, 16, 18, 20] as const;
export const EDITOR_TAB_SIZE_OPTIONS = [2, 4, 8] as const;

const editorThemeSchema = z.enum(EDITOR_THEME_OPTIONS);
const editorFontSizeSchema = z.union(
  EDITOR_FONT_SIZE_OPTIONS.map((value) => z.literal(value)) as [
    z.ZodLiteral<(typeof EDITOR_FONT_SIZE_OPTIONS)[number]>,
    ...z.ZodLiteral<(typeof EDITOR_FONT_SIZE_OPTIONS)[number]>[],
  ],
);
const editorTabSizeSchema = z.union(
  EDITOR_TAB_SIZE_OPTIONS.map((value) => z.literal(value)) as [
    z.ZodLiteral<(typeof EDITOR_TAB_SIZE_OPTIONS)[number]>,
    ...z.ZodLiteral<(typeof EDITOR_TAB_SIZE_OPTIONS)[number]>[],
  ],
);

export const editorPreferencesSchema = z.object({
  fontSize: editorFontSizeSchema,
  tabSize: editorTabSizeSchema,
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: editorThemeSchema,
});

export const editorPreferencesPatchSchema = editorPreferencesSchema.partial();

export type EditorPreferences = z.infer<typeof editorPreferencesSchema>;
export type EditorPreferencesPatch = z.input<typeof editorPreferencesPatchSchema>;
export type EditorTheme = EditorPreferences["theme"];

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark",
};

export const normalizeEditorPreferences = (value: unknown): EditorPreferences => {
  const parsedValue = editorPreferencesSchema.safeParse(value);

  if (parsedValue.success) {
    return parsedValue.data;
  }

  const fallbackValue =
    value && typeof value === "object" && !Array.isArray(value) ? value : {};

  const mergedValue = {
    ...DEFAULT_EDITOR_PREFERENCES,
    ...fallbackValue,
  };

  const parsedMergedValue = editorPreferencesSchema.safeParse(mergedValue);

  return parsedMergedValue.success ? parsedMergedValue.data : DEFAULT_EDITOR_PREFERENCES;
};

export const mergeEditorPreferences = (
  currentPreferences: unknown,
  patch: EditorPreferencesPatch,
) => {
  const parsedPatch = editorPreferencesPatchSchema.parse(patch);

  return normalizeEditorPreferences({
    ...normalizeEditorPreferences(currentPreferences),
    ...parsedPatch,
  });
};
