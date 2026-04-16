'use client';

import { createElement, useMemo, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { createItem, type CreateItemActionError } from '@/actions/items';
import type { SidebarItemType } from '@/lib/db/items';
import { isCodeEditorItemType } from '@/lib/code-editor';
import { isMarkdownEditorItemType } from '@/lib/markdown-editor';

import { cn } from '@/lib/utils';

import { getItemTypeIcon } from '@/components/utils/item-type';
import { Button } from '@/components/ui/button';
import { CodeEditor } from '@/components/ui/code-editor';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { Textarea } from '@/components/ui/textarea';

const CREATE_ITEM_TYPES = ['snippet', 'prompt', 'command', 'note', 'link'] as const;
type CreateItemType = (typeof CREATE_ITEM_TYPES)[number];

const CONTENT_ITEM_TYPES = new Set<CreateItemType>(['snippet', 'prompt', 'command', 'note']);
const LANGUAGE_ITEM_TYPES = new Set<CreateItemType>(['snippet', 'command']);
const TYPE_LABELS: Record<CreateItemType, string> = {
  snippet: 'Snippet',
  prompt: 'Prompt',
  command: 'Command',
  note: 'Note',
  link: 'Link',
};
const TYPE_ICON_FALLBACKS: Record<CreateItemType, string> = {
  snippet: 'Code',
  prompt: 'Sparkles',
  command: 'Terminal',
  note: 'StickyNote',
  link: 'Link',
};
const TYPE_SLUGS: Record<CreateItemType, string> = {
  snippet: 'snippets',
  prompt: 'prompts',
  command: 'commands',
  note: 'notes',
  link: 'links',
};

interface CreateItemDialogProps {
  itemTypes: SidebarItemType[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

interface CreateItemFormState {
  itemType: CreateItemType;
  title: string;
  description: string;
  tags: string;
  content: string;
  language: string;
  url: string;
}

type CreateItemFormField = keyof CreateItemFormState;
type CreateItemFormErrors = Partial<Record<CreateItemFormField, string[]>>;

const INITIAL_FORM_STATE: CreateItemFormState = {
  itemType: 'snippet',
  title: '',
  description: '',
  tags: '',
  content: '',
  language: '',
  url: '',
};

const parseTagsInput = (value: string) =>
  Array.from(
    new Set(
      value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );

const FieldErrorText = ({ errors }: { errors?: string[] }) => {
  if (!errors?.length) {
    return null;
  }

  return <p className='text-sm text-destructive'>{errors[0]}</p>;
};

export const CreateItemDialog = ({
  itemTypes,
  onOpenChange,
  open,
}: CreateItemDialogProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CreateItemFormErrors>({});
  const [formState, setFormState] = useState<CreateItemFormState>(INITIAL_FORM_STATE);

  const typeOptions = useMemo(() => {
    const itemTypesBySlug = new Map(itemTypes.map((itemType) => [itemType.slug, itemType]));

    return CREATE_ITEM_TYPES.map((itemType) => {
      const itemTypeMeta = itemTypesBySlug.get(TYPE_SLUGS[itemType]);

      return {
        value: itemType,
        label: TYPE_LABELS[itemType],
        color: itemTypeMeta?.color,
        icon: itemTypeMeta?.icon ?? TYPE_ICON_FALLBACKS[itemType],
      };
    });
  }, [itemTypes]);

  const resetForm = () => {
    setFormState(INITIAL_FORM_STATE);
    setFieldErrors({});
    setSubmitError(null);
    setIsSubmitting(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }

    onOpenChange(nextOpen);
  };

  const handleFieldChange = (field: CreateItemFormField, value: string) => {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }));
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
    setSubmitError(null);
  };

  const handleTypeChange = (itemType: CreateItemType) => {
    setFormState((currentState) => ({
      ...currentState,
      itemType,
      ...(CONTENT_ITEM_TYPES.has(itemType) ? {} : { content: '' }),
      ...(LANGUAGE_ITEM_TYPES.has(itemType) ? {} : { language: '' }),
      ...(itemType === 'link' ? {} : { url: '' }),
    }));
    setFieldErrors({});
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});

    const result = await createItem({
      itemType: formState.itemType,
      title: formState.title,
      description: formState.description,
      tags: parseTagsInput(formState.tags),
      ...(CONTENT_ITEM_TYPES.has(formState.itemType) ? { content: formState.content } : {}),
      ...(LANGUAGE_ITEM_TYPES.has(formState.itemType) ? { language: formState.language } : {}),
      ...(formState.itemType === 'link' ? { url: formState.url } : {}),
    });

    setIsSubmitting(false);

    if (!result.success || !result.data) {
      const actionError =
        typeof result.error === 'string'
          ? ({ message: result.error } satisfies CreateItemActionError)
          : result.error;

      setSubmitError(actionError?.message ?? 'Unable to create item.');
      setFieldErrors(actionError?.fieldErrors ?? {});
      toast.error(actionError?.message ?? 'Unable to create item.');
      return;
    }

    handleOpenChange(false);
    toast.success('Item created.');
    startTransition(() => {
      router.refresh();
    });
  };

  const requiresUrl = formState.itemType === 'link';
  const showsContent = CONTENT_ITEM_TYPES.has(formState.itemType);
  const usesCodeEditor = isCodeEditorItemType(formState.itemType);
  const usesMarkdownEditor = isMarkdownEditorItemType(formState.itemType);
  const showsLanguage = LANGUAGE_ITEM_TYPES.has(formState.itemType);
  const saveDisabled =
    isSubmitting ||
    isRefreshPending ||
    !formState.title.trim() ||
    (requiresUrl && !formState.url.trim());

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-2xl'>
        <DialogHeader className='border-b border-border/70 px-6 py-5'>
          <DialogTitle>Create a new item</DialogTitle>
          <DialogDescription>
            Add a snippet, prompt, command, note, or link without leaving the page.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex max-h-[calc(90vh-5rem)] flex-col'>
          <div className='space-y-6 overflow-y-auto px-6 py-5'>
            <div className='space-y-3'>
              <div className='space-y-1'>
                <label className='text-sm font-medium' htmlFor='item-type-selector'>
                  Type
                </label>
                <p className='text-sm text-muted-foreground'>
                  Pick the item type first. The form adjusts to match it.
                </p>
              </div>

              <div
                id='item-type-selector'
                className='grid gap-3 sm:grid-cols-2 lg:grid-cols-5'
                role='radiogroup'
                aria-label='Item type'
              >
                {typeOptions.map((option) => {
                  const isActive = formState.itemType === option.value;

                  return (
                    <button
                      key={option.value}
                      type='button'
                      role='radio'
                      aria-checked={isActive}
                      className={cn(
                        'flex min-h-24 flex-col items-start justify-between rounded-2xl border px-4 py-3 text-left transition-colors',
                        isActive
                          ? 'border-foreground/30 bg-muted/60 text-foreground'
                          : 'border-border/70 bg-background hover:bg-muted/40',
                      )}
                      onClick={() => handleTypeChange(option.value)}
                    >
                      <span
                        className='rounded-xl border border-border/70 bg-background/80 p-2 text-muted-foreground'
                        style={option.color ? { color: option.color } : undefined}
                      >
                        {createElement(getItemTypeIcon(option.icon), {
                          className: 'size-4',
                        })}
                      </span>
                      <span className='text-sm font-medium'>{option.label}</span>
                    </button>
                  );
                })}
              </div>
              <FieldErrorText errors={fieldErrors.itemType} />
            </div>

            <div className='grid gap-5 sm:grid-cols-2'>
              <div className='space-y-2 sm:col-span-2'>
                <label className='text-sm font-medium' htmlFor='create-item-title'>
                  Title
                </label>
                <Input
                  id='create-item-title'
                  value={formState.title}
                  onChange={(event) => handleFieldChange('title', event.target.value)}
                  placeholder='Give this item a clear name'
                  aria-invalid={fieldErrors.title ? 'true' : 'false'}
                />
                <FieldErrorText errors={fieldErrors.title} />
              </div>

              <div className='space-y-2 sm:col-span-2'>
                <label className='text-sm font-medium' htmlFor='create-item-description'>
                  Description
                </label>
                <Textarea
                  id='create-item-description'
                  value={formState.description}
                  onChange={(event) => handleFieldChange('description', event.target.value)}
                  placeholder='Add optional context or a short summary'
                  className='min-h-24'
                />
                <FieldErrorText errors={fieldErrors.description} />
              </div>

              {showsContent ? (
                <div className='space-y-2 sm:col-span-2'>
                  <label className='text-sm font-medium' htmlFor='create-item-content'>
                    Content
                  </label>
                  {usesCodeEditor ? (
                    <CodeEditor
                      id='create-item-content'
                      itemType={formState.itemType}
                      language={formState.language}
                      value={formState.content}
                      onChange={(value) => handleFieldChange('content', value)}
                    />
                  ) : usesMarkdownEditor ? (
                    <MarkdownEditor
                      id='create-item-content'
                      value={formState.content}
                      onChange={(value) => handleFieldChange('content', value)}
                      placeholder={
                        formState.itemType === 'prompt'
                          ? 'Write the prompt text'
                          : 'Write your note'
                      }
                    />
                  ) : (
                    <Textarea
                      id='create-item-content'
                      value={formState.content}
                      onChange={(event) => handleFieldChange('content', event.target.value)}
                      placeholder={
                        formState.itemType === 'prompt'
                          ? 'Write the prompt text'
                          : formState.itemType === 'note'
                            ? 'Write your note'
                            : 'Paste the content here'
                      }
                      className='min-h-48 font-mono text-sm'
                    />
                  )}
                  <FieldErrorText errors={fieldErrors.content} />
                </div>
              ) : null}

              {showsLanguage ? (
                <div className='space-y-2'>
                  <label className='text-sm font-medium' htmlFor='create-item-language'>
                    Language
                  </label>
                  <Input
                    id='create-item-language'
                    value={formState.language}
                    onChange={(event) => handleFieldChange('language', event.target.value)}
                    placeholder='TypeScript, Bash, SQL...'
                  />
                  <FieldErrorText errors={fieldErrors.language} />
                </div>
              ) : null}

              {requiresUrl ? (
                <div className='space-y-2 sm:col-span-2'>
                  <label className='text-sm font-medium' htmlFor='create-item-url'>
                    URL
                  </label>
                  <Input
                    id='create-item-url'
                    type='url'
                    value={formState.url}
                    onChange={(event) => handleFieldChange('url', event.target.value)}
                    placeholder='https://example.com'
                    aria-invalid={fieldErrors.url ? 'true' : 'false'}
                  />
                  <FieldErrorText errors={fieldErrors.url} />
                </div>
              ) : null}

              <div className='space-y-2 sm:col-span-2'>
                <label className='text-sm font-medium' htmlFor='create-item-tags'>
                  Tags
                </label>
                <Input
                  id='create-item-tags'
                  value={formState.tags}
                  onChange={(event) => handleFieldChange('tags', event.target.value)}
                  placeholder='react, prisma, auth'
                />
                <p className='text-sm text-muted-foreground'>
                  Separate tags with commas.
                </p>
                <FieldErrorText errors={fieldErrors.tags} />
              </div>

              {submitError ? (
                <div className='sm:col-span-2'>
                  <p className='text-sm text-destructive'>{submitError}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className='flex flex-col-reverse gap-3 border-t border-border/70 bg-muted/30 px-6 py-4 sm:flex-row sm:justify-end'>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={saveDisabled}>
              {isSubmitting ? 'Creating...' : 'Create item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
