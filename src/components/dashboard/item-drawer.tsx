'use client';

import {
  createElement,
  useEffect,
  useState,
  type ComponentProps,
  type CSSProperties,
  type FormEvent,
} from 'react';
import { ChevronsUpDown, Copy, Crown, Download, FileText, Link2, Loader2, Pencil, Pin, Sparkles, Star, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { explainCode, optimizePrompt } from '@/actions/ai';
import { deleteItem, updateItem, type UpdateItemActionError } from '@/actions/items';
import type { CollectionOption } from '@/lib/db/collections';
import type { DashboardItem, ItemDrawerDetail } from '@/lib/db/items';
import { getCodeEditorLanguageOptions, isCodeEditorItemType } from '@/lib/editors/code';
import { formatFileSize } from '@/lib/files/size';
import { isSvgFileName } from '@/lib/files/upload';
import { isContentItemType, isFileItemType, isLanguageItemType, isUrlItemType, parseItemTagsInput } from '@/lib/item-form';
import { isMarkdownEditorItemType } from '@/lib/editors/markdown';

import { cn } from '@/lib/utils';

import { CollectionPicker } from '@/components/dashboard/collection-picker';
import { AiDescriptionSummaryButton } from '@/components/dashboard/ai-description-summary-button';
import { AiTagSuggestions } from '@/components/dashboard/ai-tag-suggestions';
import { ItemFavoriteButton } from '@/components/dashboard/item-favorite-button';
import { ItemPinButton } from '@/components/dashboard/item-pin-button';
import { useSearch } from '@/components/dashboard/search-provider';
import { CodeEditor } from '@/components/ui/code-editor';
import { formatDate, formatUpdatedAt } from '@/components/utils/date';
import { getItemTypeIcon } from '@/components/utils/item-type';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';

interface EditFormState {
  title: string;
  description: string;
  tags: string;
  content: string;
  language: string;
  url: string;
  collectionIds: string[];
}

type EditFormField = keyof EditFormState;
type EditFormErrors = Partial<Record<EditFormField, string[]>>;

const getCopyValue = (item: ItemDrawerDetail | null) => {
  if (!item) {
    return null;
  }

  if (item.content?.trim()) {
    return item.content;
  }

  if (item.url?.trim()) {
    return item.url;
  }

  if (item.fileUrl?.trim()) {
    return item.fileUrl;
  }

  return item.title;
};

const getInitialFormState = (item: ItemDrawerDetail | null): EditFormState => ({
  title: item?.title ?? '',
  description: item?.description ?? '',
  tags: item?.tags.join(', ') ?? '',
  content: item?.content ?? '',
  language: item?.language ?? '',
  url: item?.url ?? '',
  collectionIds: item?.collections.map((collection) => collection.id) ?? [],
});

const usesCodeEditor = (itemTypeName: string) => isCodeEditorItemType(itemTypeName);
const usesMarkdownEditor = (itemTypeName: string) => isMarkdownEditorItemType(itemTypeName);
const isImageItem = (item: ItemDrawerDetail) => item.itemType.name.toLowerCase() === 'image';
const supportsInlineImagePreview = (item: ItemDrawerDetail) =>
  isImageItem(item) && !isSvgFileName(item.fileName);
const isPromptItem = (itemTypeName: string) => itemTypeName.trim().toLowerCase() === 'prompt';
const dropdownTriggerClassName =
  'h-10 justify-between rounded-xl border-border/80 bg-[#121212] px-3 text-sm font-medium text-foreground shadow-none hover:bg-[#171717]';
const LANGUAGE_DEFAULT_VALUE = '__default';

const DrawerActionButton = ({
  active = false,
  children,
  className,
  ...props
}: ComponentProps<typeof Button> & {
  active?: boolean;
}) => (
  <Button
    type='button'
    variant='ghost'
    size='sm'
    className={cn(
      'h-9 rounded-xl border border-border/60 bg-background/80 px-3 text-muted-foreground hover:bg-muted/60',
      active && 'text-yellow-400 hover:text-yellow-400',
      className,
    )}
    {...props}
  >
    {children}
  </Button>
);

const FieldErrorText = ({ errors }: { errors?: string[] }) => {
  if (!errors?.length) {
    return null;
  }

  return <p className='text-sm text-destructive'>{errors[0]}</p>;
};

const ItemDrawerLoading = ({ preview }: { preview: DashboardItem | null }) => (
  <div className='space-y-6'>
    <div className='space-y-3'>
      <div className='h-8 w-3/4 animate-pulse rounded-xl bg-muted/70' />
      <div className='h-4 w-full animate-pulse rounded-xl bg-muted/50' />
      <div className='h-4 w-2/3 animate-pulse rounded-xl bg-muted/50' />
    </div>

    <div className='flex flex-wrap gap-2'>
      <div className='h-8 w-20 animate-pulse rounded-full bg-muted/60' />
      <div className='h-8 w-24 animate-pulse rounded-full bg-muted/60' />
      <div className='h-8 w-28 animate-pulse rounded-full bg-muted/60' />
    </div>

    <div className='grid gap-3 sm:grid-cols-2'>
      <div className='rounded-2xl border border-border/60 bg-card/40 p-4'>
        <p className='text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase'>
          Updated
        </p>
        <p className='mt-2 text-sm text-foreground/80'>
          {preview ? formatUpdatedAt(preview.updatedAt) : 'Loading...'}
        </p>
      </div>
      <div className='rounded-2xl border border-border/60 bg-card/40 p-4'>
        <p className='text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase'>
          Collection
        </p>
        <p className='mt-2 text-sm text-foreground/80'>
          {preview?.collection?.name ?? 'Loading...'}
        </p>
      </div>
    </div>

    <div className='space-y-2'>
      <div className='h-4 w-24 animate-pulse rounded-xl bg-muted/60' />
      <div className='h-28 w-full animate-pulse rounded-[1.5rem] bg-muted/50' />
    </div>
  </div>
);

const ItemDrawerError = ({ message }: { message: string }) => (
  <div className='rounded-[1.75rem] border border-destructive/30 bg-destructive/5 px-5 py-6'>
    <p className='text-sm font-medium text-foreground'>Unable to load item</p>
    <p className='mt-2 text-sm text-muted-foreground'>{message}</p>
  </div>
);

interface ItemMetadataLineProps {
  label: string;
  secondaryValue?: string | null;
  value: string;
}

const ItemMetadataLine = ({
  label,
  secondaryValue,
  value,
}: ItemMetadataLineProps) => (
  <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-1.5 text-xs'>
    <span className='font-medium text-muted-foreground'>{label}</span>
    <span className='text-right text-foreground/80'>
      {value}
      {secondaryValue ? (
        <span className='ml-2 text-muted-foreground'>{secondaryValue}</span>
      ) : null}
    </span>
  </div>
);

const ItemDrawerMetadata = ({ item }: { item: ItemDrawerDetail }) => (
  <div className='divide-y divide-border/50 border-y border-border/50'>
    <ItemMetadataLine
      label='Updated'
      value={formatUpdatedAt(item.updatedAt)}
      secondaryValue={formatDate(item.updatedAt)}
    />
    <ItemMetadataLine
      label='Created'
      value={formatDate(item.createdAt)}
    />
  </div>
);

const ItemDrawerPreviewMetadata = ({ item }: { item: ItemDrawerDetail }) => (
  <div className='divide-y divide-border/50 border-y border-border/50'>
    <ItemMetadataLine label='Type' value={item.itemType.name} />
    {item.language ? (
      <ItemMetadataLine label='Language' value={item.language} />
    ) : null}
    <ItemMetadataLine
      label='Updated'
      value={formatUpdatedAt(item.updatedAt)}
      secondaryValue={formatDate(item.updatedAt)}
    />
    <ItemMetadataLine
      label='Created'
      value={formatDate(item.createdAt)}
    />
  </div>
);

const ItemDrawerCollections = ({ item }: { item: ItemDrawerDetail }) => {
  if (item.collections.length === 0) {
    return null;
  }

  return (
    <div className='space-y-2'>
      <p className='text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase'>
        Collections
      </p>
      <div className='flex flex-wrap gap-2'>
        {item.collections.map((collection) => (
          <Badge key={collection.id} variant='outline' className='rounded-full px-3 py-1'>
            {collection.name}
          </Badge>
        ))}
      </div>
    </div>
  );
};

const ItemDrawerTags = ({ tags }: { tags: string[] }) => {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className='space-y-2'>
      <p className='text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase'>
        Tags
      </p>
      <div className='flex flex-wrap gap-2'>
        {tags.map((tag) => (
          <Badge key={tag} variant='outline' className='rounded-full px-3 py-1'>
            #{tag}
          </Badge>
        ))}
      </div>
    </div>
  );
};

const ItemDrawerContent = ({
  isPro,
  item,
  onItemUpdated,
  onPromptOptimizationPendingChange,
}: {
  isPro: boolean;
  item: ItemDrawerDetail;
  onItemUpdated: (item: ItemDrawerDetail) => void;
  onPromptOptimizationPendingChange: (pending: boolean) => void;
}) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanationView, setExplanationView] = useState<'code' | 'explain'>('code');
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
  const [optimizedPrompt, setOptimizedPrompt] = useState<string | null>(null);
  const [isApplyingOptimizedPrompt, setIsApplyingOptimizedPrompt] = useState(false);
  const [promptView, setPromptView] = useState<'current' | 'optimized'>('current');

  useEffect(() => {
    onPromptOptimizationPendingChange(isOptimizingPrompt || isApplyingOptimizedPrompt);

    return () => {
      onPromptOptimizationPendingChange(false);
    };
  }, [isApplyingOptimizedPrompt, isOptimizingPrompt, onPromptOptimizationPendingChange]);

  if (!item.content) {
    return null;
  }

  if (usesCodeEditor(item.itemType.name)) {
    const normalizedItemType =
      item.itemType.name.trim().toLowerCase() === 'command' ? 'command' : 'snippet';

    return (
      <CodeEditor
        aiExplanation={{
          isPending: isExplaining,
          isPro,
          onExplain: () => {
            if (!isPro) {
              toast.error('AI features require Pro subscription.');
              return;
            }

            setIsExplaining(true);

            void explainCode({
              content: item.content ?? '',
              itemType: normalizedItemType,
              language: item.language ?? '',
              title: item.title,
            })
              .then((result) => {
                setIsExplaining(false);

                if (!result.success || !result.data) {
                  toast.error(result.error ?? 'Unable to explain this code.');
                  return;
                }

                setExplanation(result.data.explanation);
                setExplanationView('explain');
              })
              .catch((error: unknown) => {
                console.error('Failed to explain code in item drawer.', error);
                setIsExplaining(false);
                toast.error('Unable to explain this code.');
              });
          },
          onViewChange: setExplanationView,
          value: explanation,
          view: explanationView,
        }}
        itemType={item.itemType.name}
        language={item.language}
        readOnly
        value={item.content}
      />
    );
  }

  if (usesMarkdownEditor(item.itemType.name)) {
    const promptPreviewValue =
      promptView === 'optimized' && optimizedPrompt ? optimizedPrompt : item.content;

    return (
      <div className='space-y-3'>
        <MarkdownEditor
          readOnly
          readOnlyView={promptView}
          readOnlyViewLabels={{
            current: 'Current',
            optimized: 'Optimized',
          }}
          onReadOnlyViewChange={
            optimizedPrompt
              ? (view) => {
                  setPromptView(view);
                }
              : undefined
          }
          value={promptPreviewValue}
          headerActions={
            isPromptItem(item.itemType.name) ? (
              optimizedPrompt ? (
                <>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='h-8 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 text-emerald-200 hover:bg-emerald-500/15 hover:text-emerald-100'
                    onClick={() => {
                      setIsApplyingOptimizedPrompt(true);

                      void updateItem(item.id, {
                        collectionIds: item.collections.map((collection) => collection.id),
                        content: optimizedPrompt,
                        description: item.description ?? '',
                        language: item.language ?? '',
                        tags: item.tags,
                        title: item.title,
                        url: item.url ?? '',
                      })
                        .then((result) => {
                          setIsApplyingOptimizedPrompt(false);

                          if (!result.success || !result.data) {
                            toast.error(
                              typeof result.error === 'string'
                                ? result.error
                                : result.error?.message ?? 'Unable to update item.',
                            );
                            return;
                          }

                          onItemUpdated(result.data);
                          setOptimizedPrompt(null);
                          setPromptView('current');
                          toast.success('Optimized prompt saved.');
                        })
                        .catch((error: unknown) => {
                          console.error('Failed to apply optimized prompt.', error);
                          setIsApplyingOptimizedPrompt(false);
                          toast.error('Unable to update item.');
                        });
                    }}
                    disabled={isApplyingOptimizedPrompt}
                  >
                    {isApplyingOptimizedPrompt ? (
                      <Loader2 className='size-4 animate-spin' />
                    ) : (
                      <Sparkles className='size-4' />
                    )}
                    {isApplyingOptimizedPrompt ? 'Saving...' : 'Use optimized'}
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='h-8 rounded-lg border border-[#4b5563] bg-[#1e1e1e] px-2.5 text-slate-300 hover:bg-[#242424] hover:text-slate-100'
                    onClick={() => {
                      setOptimizedPrompt(null);
                      setPromptView('current');
                    }}
                    disabled={isApplyingOptimizedPrompt}
                  >
                    Keep current
                  </Button>
                </>
              ) : isPro ? (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='h-8 rounded-lg border border-[#4b5563] bg-[#1e1e1e] px-2.5 text-slate-300 hover:bg-[#242424] hover:text-slate-100'
                  onClick={() => {
                    setIsOptimizingPrompt(true);

                    void optimizePrompt({
                      content: item.content ?? '',
                      description: item.description ?? '',
                      title: item.title,
                    })
                      .then((result) => {
                        setIsOptimizingPrompt(false);

                        if (!result.success || !result.data) {
                          toast.error(result.error ?? 'Unable to optimize this prompt.');
                          return;
                        }

                        if (!result.data.changed || !result.data.optimizedPrompt) {
                          toast.success('This prompt already looks good.');
                          return;
                        }

                        setOptimizedPrompt(result.data.optimizedPrompt);
                        setPromptView('optimized');
                        toast.success('Review the optimized prompt and choose whether to use it.');
                      })
                      .catch((error: unknown) => {
                        console.error('Failed to optimize prompt in item drawer.', error);
                        setIsOptimizingPrompt(false);
                        toast.error('Unable to optimize this prompt.');
                      });
                  }}
                  disabled={!item.content.trim() || isOptimizingPrompt}
                  aria-label='Optimize prompt'
                >
                  {isOptimizingPrompt ? (
                    <Loader2 className='size-4 animate-spin' />
                  ) : (
                    <Sparkles className='size-4' />
                  )}
                  {isOptimizingPrompt ? 'Optimizing...' : 'Optimize'}
                </Button>
              ) : (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  title='AI features require Pro subscription'
                  className='h-8 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 text-amber-200 hover:bg-amber-500/15 hover:text-amber-100'
                  onClick={() => {
                    toast.error('AI features require Pro subscription.');
                  }}
                  aria-label='AI features require Pro subscription'
                >
                  <Crown className='size-4' />
                  Pro
                </Button>
              )
            ) : null
          }
        />
        {optimizedPrompt ? (
          <p className='text-sm text-muted-foreground'>
            Toggle between the current and optimized prompt, then save only if you want to keep the optimized version.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className='overflow-x-auto rounded-[1.5rem] border border-border/60 bg-card/45 p-4'>
      <pre className='font-mono text-sm leading-6 whitespace-pre-wrap text-foreground'>
        {item.content}
      </pre>
    </div>
  );
};

const ItemDrawerUrl = ({ url }: { url: string | null }) => {
  if (!url) {
    return null;
  }

  return (
    <div className='rounded-[1.5rem] border border-border/60 bg-card/45 p-4'>
      <p className='text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase'>
        URL
      </p>
      <a
        href={url}
        target='_blank'
        rel='noreferrer'
        className='mt-2 block break-all text-sm text-primary underline-offset-4 hover:underline'
      >
        {url}
      </a>
    </div>
  );
};

const ItemDrawerFile = ({ item }: { item: ItemDrawerDetail }) => {
  if (!item.fileUrl && !item.fileName) {
    return null;
  }

  const fileSize = formatFileSize(item.fileSize);
  const downloadHref = `/api/items/${item.id}/download`;
  const inlinePreviewHref = `${downloadHref}?inline=1`;
  const showsInlineImage = supportsInlineImagePreview(item);
  const isFile = isFileItemType(item.itemType.name);

  return (
    <div className='rounded-[1.5rem] border border-border/60 bg-card/45 p-4'>
      <p className='text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase'>
        File
      </p>
      {showsInlineImage ? (
        <div className='mt-3 overflow-hidden rounded-2xl border border-border/60 bg-background/80'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={inlinePreviewHref}
            alt={item.title}
            className='max-h-[28rem] w-full object-contain'
          />
        </div>
      ) : null}
      <p className='mt-2 text-sm text-foreground'>{item.fileName ?? 'Attached file'}</p>
      {fileSize ? <p className='mt-1 text-sm text-muted-foreground'>{fileSize}</p> : null}
      {item.fileUrl ? (
        isFile ? (
          <a
            href={downloadHref}
            className='mt-2 inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline'
          >
            <Download className='size-4' />
            Download file
          </a>
        ) : showsInlineImage ? (
          <a
            href={inlinePreviewHref}
            target='_blank'
            rel='noreferrer'
            className='mt-2 inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline'
          >
            <Link2 className='size-4' />
            Open image
          </a>
        ) : (
          <a
            href={downloadHref}
            className='mt-2 inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline'
          >
            <Download className='size-4' />
            Download image
          </a>
        )
      ) : null}
    </div>
  );
};

const ItemDrawerBody = ({
  isPro,
  item,
  onItemSaved,
  onPromptOptimizationPendingChange,
}: {
  isPro: boolean;
  item: ItemDrawerDetail;
  onItemSaved: (item: ItemDrawerDetail) => void;
  onPromptOptimizationPendingChange: (pending: boolean) => void;
}) => (
  <div className='space-y-6'>
    <div className='space-y-3'>
      <p className='text-sm font-medium'>Content</p>
      <ItemDrawerContent
        key={`${item.id}:${item.updatedAt}`}
        isPro={isPro}
        item={item}
        onItemUpdated={onItemSaved}
        onPromptOptimizationPendingChange={onPromptOptimizationPendingChange}
      />
      <ItemDrawerUrl url={item.url} />
      <ItemDrawerFile item={item} />
    </div>

    <ItemDrawerTags tags={item.tags} />
    <ItemDrawerCollections item={item} />
    <ItemDrawerPreviewMetadata item={item} />
  </div>
);

interface LanguageDropdownProps {
  defaultLabel: string;
  errors?: string[];
  id: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}

const LanguageDropdown = ({
  defaultLabel,
  errors,
  id,
  onChange,
  options,
  value,
}: LanguageDropdownProps) => {
  const selectedLabel =
    value === ''
      ? defaultLabel
      : (options.find((option) => option.value === value)?.label ?? value);

  return (
    <div className='space-y-3'>
      <label className='block text-sm font-medium' htmlFor={id}>
        Language
      </label>
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              id={id}
              type='button'
              variant='outline'
              className={cn(dropdownTriggerClassName, 'w-fit min-w-40 gap-3')}
              aria-invalid={errors ? 'true' : 'false'}
            >
              <span className='truncate'>{selectedLabel}</span>
              <ChevronsUpDown className='size-4 shrink-0 text-muted-foreground' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='start'
            className='max-h-72 w-56 overflow-y-auto'
          >
            <DropdownMenuRadioGroup
              value={value || LANGUAGE_DEFAULT_VALUE}
              onValueChange={(nextValue) =>
                onChange(nextValue === LANGUAGE_DEFAULT_VALUE ? '' : nextValue)
              }
            >
              <DropdownMenuRadioItem value={LANGUAGE_DEFAULT_VALUE}>
                {defaultLabel}
              </DropdownMenuRadioItem>
              {options.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <FieldErrorText errors={errors} />
    </div>
  );
};

interface ItemDrawerEditBodyProps {
  collections: CollectionOption[];
  fieldErrors: EditFormErrors;
  formState: EditFormState;
  isPro: boolean;
  item: ItemDrawerDetail;
  onFieldChange: <T extends EditFormField>(field: T, value: EditFormState[T]) => void;
  submitError: string | null;
}

const ItemDrawerEditBody = ({
  collections,
  fieldErrors,
  formState,
  isPro,
  item,
  onFieldChange,
  submitError,
}: ItemDrawerEditBodyProps) => {
  const showContentField = isContentItemType(item.itemType.name);
  const showLanguageField = isLanguageItemType(item.itemType.name);
  const showUrlField = isUrlItemType(item.itemType.name);
  const showCodeLanguageDropdown = showLanguageField && usesCodeEditor(item.itemType.name);
  const languageOptions = getCodeEditorLanguageOptions(formState.language);

  return (
    <div className='space-y-6'>
      {submitError ? (
        <div className='rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
          {submitError}
        </div>
      ) : null}

      <div className='space-y-3'>
        <label htmlFor='item-title' className='block text-sm font-medium'>
          Title
        </label>
        <Input
          id='item-title'
          value={formState.title}
          onChange={(event) => onFieldChange('title', event.target.value)}
          placeholder='Give this item a clear name'
          autoFocus
          aria-invalid={fieldErrors.title ? 'true' : 'false'}
        />
        <FieldErrorText errors={fieldErrors.title} />
      </div>

      <div className='space-y-2'>
        <AiDescriptionSummaryButton
          content={formState.content}
          description={formState.description}
          fileName={item.fileName ?? undefined}
          fileSize={item.fileSize ?? undefined}
          inputId='item-description'
          isPro={isPro}
          itemType={item.itemType.name}
          language={formState.language}
          title={formState.title}
          url={formState.url}
          onSummaryChange={(value) => onFieldChange('description', value)}
        />
        <Textarea
          id='item-description'
          value={formState.description}
          onChange={(event) => onFieldChange('description', event.target.value)}
          className='min-h-24'
          placeholder='Add optional context or a short summary'
        />
        <FieldErrorText errors={fieldErrors.description} />
      </div>

      {showCodeLanguageDropdown ? (
        <LanguageDropdown
          id='item-language'
          value={formState.language}
          defaultLabel={
            item.itemType.name.toLowerCase() === 'command'
              ? 'Default (Shell)'
              : 'Plain text'
          }
          options={languageOptions}
          errors={fieldErrors.language}
          onChange={(value) => onFieldChange('language', value)}
        />
      ) : null}

      {showContentField ? (
        <div className='space-y-3'>
          <label htmlFor='item-content' className='block text-sm font-medium'>
            Content
          </label>
          {usesCodeEditor(item.itemType.name) ? (
            <CodeEditor
              id='item-content'
              itemType={item.itemType.name}
              language={formState.language}
              showLanguageBadge={false}
              value={formState.content}
              onChange={(value) => onFieldChange('content', value)}
            />
          ) : usesMarkdownEditor(item.itemType.name) ? (
            <MarkdownEditor
              id='item-content'
              value={formState.content}
              onChange={(value) => onFieldChange('content', value)}
              placeholder={
                item.itemType.name.toLowerCase() === 'prompt'
                  ? 'Write the prompt text'
                  : 'Write your note'
              }
            />
          ) : (
            <Textarea
              id='item-content'
              value={formState.content}
              onChange={(event) => onFieldChange('content', event.target.value)}
              className='min-h-48 font-mono text-sm'
              placeholder={
                item.itemType.name.toLowerCase() === 'prompt'
                  ? 'Write the prompt text'
                  : item.itemType.name.toLowerCase() === 'note'
                    ? 'Write your note'
                    : 'Paste the content here'
              }
            />
          )}
          <FieldErrorText errors={fieldErrors.content} />
        </div>
      ) : null}

      {showLanguageField && !showCodeLanguageDropdown ? (
        <div className='space-y-3'>
          <label htmlFor='item-language' className='block text-sm font-medium'>
            Language
          </label>
          <Input
            id='item-language'
            value={formState.language}
            onChange={(event) => onFieldChange('language', event.target.value)}
            placeholder='TypeScript, Bash, SQL...'
          />
          <FieldErrorText errors={fieldErrors.language} />
        </div>
      ) : null}

      {showUrlField ? (
        <div className='space-y-3'>
          <label htmlFor='item-url' className='block text-sm font-medium'>
            URL
          </label>
          <Input
            id='item-url'
            type='url'
            value={formState.url}
            onChange={(event) => onFieldChange('url', event.target.value)}
            placeholder='https://example.com'
            aria-invalid={fieldErrors.url ? 'true' : 'false'}
          />
          <FieldErrorText errors={fieldErrors.url} />
        </div>
      ) : null}

      <div className='space-y-2'>
        <AiTagSuggestions
          key={item.id}
          content={formState.content}
          description={formState.description}
          inputId='item-tags'
          isPro={isPro}
          itemType={item.itemType.name}
          language={formState.language}
          tagsValue={formState.tags}
          title={formState.title}
          url={formState.url}
          onTagsChange={(value) => onFieldChange('tags', value)}
        />
        <Input
          id='item-tags'
          value={formState.tags}
          onChange={(event) => onFieldChange('tags', event.target.value)}
          placeholder='react, prisma, auth'
        />
        <p className='text-sm text-muted-foreground'>
          Separate tags with commas.
        </p>
        <FieldErrorText errors={fieldErrors.tags} />
      </div>

      <CollectionPicker
        collections={collections}
        errors={fieldErrors.collectionIds}
        id='item-collections'
        onChange={(collectionIds) => onFieldChange('collectionIds', collectionIds)}
        selectedCollectionIds={formState.collectionIds}
      />

      <ItemDrawerMetadata item={item} />
    </div>
  );
};

interface ItemDrawerProps {
  collections: CollectionOption[];
  error: string | null;
  isLoading: boolean;
  isPro: boolean;
  item: ItemDrawerDetail | null;
  onCopy: () => Promise<void> | void;
  onItemDeleted: (itemId: string) => void;
  onItemUpdated: (item: ItemDrawerDetail) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  preview: DashboardItem | null;
}

export const ItemDrawer = ({
  collections,
  error,
  isLoading,
  isPro,
  item,
  onCopy,
  onItemDeleted,
  onItemUpdated,
  onOpenChange,
  open,
  preview,
}: ItemDrawerProps) => {
  const router = useRouter();
  const { invalidateSearchData } = useSearch();
  const activeItem = item ?? preview;
  const canCopy = Boolean(getCopyValue(item));
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPromptOptimizationPending, setIsPromptOptimizationPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<EditFormErrors>({});
  const [formState, setFormState] = useState<EditFormState>(() =>
    getInitialFormState(item),
  );

  const handleFieldChange = <T extends EditFormField>(field: T, value: EditFormState[T]) => {
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

  const handleEditStart = () => {
    if (!item) {
      return;
    }

    setFormState(getInitialFormState(item));
    setFieldErrors({});
    setSubmitError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormState(getInitialFormState(item));
    setFieldErrors({});
    setSubmitError(null);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!item) {
      return;
    }

    setIsDeleting(true);

    const result = await deleteItem(item.id);

    setIsDeleting(false);

    if (!result.success) {
      toast.error(result.error ?? 'Unable to delete item.');
      return;
    }

    setIsDeleteDialogOpen(false);
    setIsEditing(false);
    setFieldErrors({});
    setSubmitError(null);
    onItemDeleted(item.id);
    invalidateSearchData();
    toast.success('Item deleted.');
    router.refresh();
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!item) {
      return;
    }

    setIsSaving(true);
    setSubmitError(null);
    setFieldErrors({});

    const payload = {
      title: formState.title,
      description: formState.description,
      tags: parseItemTagsInput(formState.tags),
      ...(isContentItemType(item.itemType.name) ? { content: formState.content } : {}),
      ...(isLanguageItemType(item.itemType.name) ? { language: formState.language } : {}),
      ...(isUrlItemType(item.itemType.name) ? { url: formState.url } : {}),
      collectionIds: formState.collectionIds,
    };

    const result = await updateItem(item.id, payload);

    setIsSaving(false);

    if (!result.success || !result.data) {
      const actionError =
        typeof result.error === 'string'
          ? ({ message: result.error } satisfies UpdateItemActionError)
          : result.error;

      setSubmitError(actionError?.message ?? 'Unable to update item.');
      setFieldErrors(actionError?.fieldErrors ?? {});
      toast.error(actionError?.message ?? 'Unable to update item.');
      return;
    }

    onItemUpdated(result.data);
    setIsEditing(false);
    invalidateSearchData();
    toast.success('Item updated.');
    router.refresh();
  };

  const saveDisabled = isSaving || isDeleting || !formState.title.trim();
  const handlePersistedItemUpdate = (updatedItem: ItemDrawerDetail) => {
    onItemUpdated(updatedItem);
    invalidateSearchData();
    router.refresh();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className='w-full overflow-y-auto border-l-border/70 bg-background/98 p-0'
        style={
          {
            '--sheet-width': 'min(560px, 100vw)',
            '--sheet-max-width': 'none',
          } as CSSProperties
        }
      >
        <form onSubmit={handleSave}>
          <SheetHeader className='border-b border-border/70 px-6 py-5 sm:px-8'>
            <div className='flex items-start gap-4'>
              <div
                className='rounded-2xl border border-border/60 bg-muted/35 p-3 text-muted-foreground'
                style={
                  activeItem
                    ? {
                        borderColor: activeItem.itemType.color,
                      }
                    : undefined
                }
              >
                {activeItem ? (
                  createElement(getItemTypeIcon(activeItem.itemType.icon), {
                    className: 'size-5',
                    style: { color: activeItem.itemType.color },
                  })
                ) : (
                  <FileText className='size-5' />
                )}
              </div>

              <div className='min-w-0 flex-1'>
                <SheetTitle className='truncate text-left text-2xl font-semibold tracking-tight'>
                  {activeItem?.title ?? 'Item details'}
                </SheetTitle>
                <SheetDescription className='mt-2 text-left text-sm leading-6'>
                  {activeItem?.description ??
                    'View item details without leaving the page.'}
                </SheetDescription>
              </div>
            </div>

            <div className='mt-5 flex flex-wrap items-center gap-2'>
              {isEditing ? (
                <>
                  <Button
                    type='button'
                    variant='outline'
                    className='rounded-xl'
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button type='submit' className='rounded-xl' disabled={saveDisabled}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </>
              ) : (
                <>
                  {item && item.fileUrl && isFileItemType(item.itemType.name) ? (
                    <DrawerActionButton asChild aria-label='Download file'>
                      <a href={`/api/items/${item.id}/download`}>
                        <Download className='size-4' />
                        Download
                      </a>
                    </DrawerActionButton>
                  ) : null}
                  {item ? (
                    <ItemFavoriteButton
                      itemId={item.id}
                      itemTitle={item.title}
                      isFavorite={item.isFavorite}
                      label='Favorite'
                      onToggled={onItemUpdated}
                      size='sm'
                      className='h-9 rounded-xl border border-border/60 bg-background/80 px-3 text-muted-foreground hover:bg-muted/60'
                      iconClassName='size-4'
                      stopPropagation={false}
                    />
                  ) : (
                    <DrawerActionButton aria-label='Favorite' disabled>
                      <Star className='size-4' />
                      Favorite
                    </DrawerActionButton>
                  )}
                  {item ? (
                    <ItemPinButton
                      itemId={item.id}
                      itemTitle={item.title}
                      isPinned={item.isPinned}
                      label='Pin'
                      onToggled={onItemUpdated}
                      size='sm'
                      className='h-9 rounded-xl border border-border/60 bg-background/80 px-3 text-muted-foreground hover:bg-muted/60'
                      iconClassName='size-4'
                      stopPropagation={false}
                    />
                  ) : (
                    <DrawerActionButton aria-label='Pin' disabled>
                      <Pin className='size-4' />
                      Pin
                    </DrawerActionButton>
                  )}
                  <DrawerActionButton
                    aria-label='Copy'
                    disabled={!canCopy}
                    onClick={() => {
                      void onCopy();
                    }}
                  >
                    <Copy className='size-4' />
                    Copy
                  </DrawerActionButton>
                  <DrawerActionButton
                    aria-label='Edit'
                    disabled={!item || isLoading || isDeleting || isPromptOptimizationPending}
                    onClick={handleEditStart}
                  >
                    <Pencil className='size-4' />
                    Edit
                  </DrawerActionButton>
                  <AlertDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <DrawerActionButton
                        aria-label='Delete'
                        className='ml-auto text-destructive hover:text-destructive'
                        disabled={!item || isLoading || isDeleting || isPromptOptimizationPending}
                      >
                        <Trash2 className='size-4' />
                        Delete
                      </DrawerActionButton>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently deletes {item?.title ?? 'this item'} from your
                          library. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel type='button' disabled={isDeleting}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                          <Button
                            type='button'
                            variant='destructive'
                            onClick={() => {
                              void handleDelete();
                            }}
                            disabled={isDeleting}
                          >
                            {isDeleting ? 'Deleting...' : 'Delete item'}
                          </Button>
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </SheetHeader>

          <div className='px-6 py-6 sm:px-8'>
            {error ? (
              <ItemDrawerError message={error} />
            ) : isLoading ? (
              <ItemDrawerLoading preview={preview} />
            ) : item ? (
              isEditing ? (
                <ItemDrawerEditBody
                  collections={collections}
                  fieldErrors={fieldErrors}
                  formState={formState}
                  isPro={isPro}
                  item={item}
                  onFieldChange={handleFieldChange}
                  submitError={submitError}
                />
              ) : (
                <ItemDrawerBody
                  isPro={isPro}
                  item={item}
                  onItemSaved={handlePersistedItemUpdate}
                  onPromptOptimizationPendingChange={setIsPromptOptimizationPending}
                />
              )
            ) : (
              <ItemDrawerError message='Select an item to view its details.' />
            )}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
