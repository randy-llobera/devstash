'use client';

import {
  createElement,
  useState,
  type ComponentProps,
  type CSSProperties,
  type FormEvent,
} from 'react';
import { Copy, Download, FileText, Link2, Pencil, Pin, Star, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { deleteItem, updateItem, type UpdateItemActionError } from '@/actions/items';
import type { CollectionOption } from '@/lib/db/collections';
import type { DashboardItem, ItemDrawerDetail } from '@/lib/db/items';
import { isCodeEditorItemType } from '@/lib/code-editor';
import { formatFileSize } from '@/lib/file-size';
import { isSvgFileName } from '@/lib/file-upload';
import { isContentItemType, isFileItemType, isLanguageItemType, isUrlItemType, parseItemTagsInput } from '@/lib/item-form';
import { isMarkdownEditorItemType } from '@/lib/markdown-editor';

import { cn } from '@/lib/utils';

import { CollectionPicker } from '@/components/dashboard/collection-picker';
import { CodeEditor } from '@/components/ui/code-editor';
import { formatDate, formatUpdatedAt } from '@/components/utils/date';
import { getItemTypeIcon } from '@/components/utils/item-type';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface ItemMetadataCardProps {
  label: string;
  secondaryValue?: string | null;
  value: string;
}

const ItemMetadataCard = ({
  label,
  secondaryValue,
  value,
}: ItemMetadataCardProps) => (
  <div className='rounded-2xl border border-border/60 bg-card/40 p-4'>
    <p className='text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase'>
      {label}
    </p>
    <p className='mt-2 text-sm text-foreground'>{value}</p>
    {secondaryValue ? (
      <p className='mt-1 text-xs text-muted-foreground'>{secondaryValue}</p>
    ) : null}
  </div>
);

const ItemDrawerMetadata = ({ item }: { item: ItemDrawerDetail }) => (
  <div className='grid gap-3 sm:grid-cols-2'>
    <ItemMetadataCard
      label='Updated'
      value={formatUpdatedAt(item.updatedAt)}
      secondaryValue={formatDate(item.updatedAt)}
    />
    <ItemMetadataCard
      label='Created'
      value={formatDate(item.createdAt)}
      secondaryValue={item.contentType}
    />
  </div>
);

const ItemDrawerCollections = ({ item }: { item: ItemDrawerDetail }) => (
  <div className='flex flex-wrap items-center gap-2'>
    <Badge variant='outline' className='rounded-full px-3 py-1'>
      <span
        className='mr-2 inline-block size-2 rounded-full'
        style={{ backgroundColor: item.itemType.color }}
      />
      {item.itemType.name}
    </Badge>
    {item.language ? (
      <Badge variant='outline' className='rounded-full px-3 py-1'>
        {item.language}
      </Badge>
    ) : null}
    {item.collections.map((collection) => (
      <Badge key={collection.id} variant='outline' className='rounded-full px-3 py-1'>
        {collection.name}
      </Badge>
    ))}
  </div>
);

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

const ItemDrawerContent = ({ item }: { item: ItemDrawerDetail }) => {
  if (!item.content) {
    return null;
  }

  if (usesCodeEditor(item.itemType.name)) {
    return (
      <CodeEditor
        itemType={item.itemType.name}
        language={item.language}
        readOnly
        value={item.content}
      />
    );
  }

  if (usesMarkdownEditor(item.itemType.name)) {
    return <MarkdownEditor readOnly value={item.content} />;
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

const ItemDrawerBody = ({ item }: { item: ItemDrawerDetail }) => {
  const itemTypeIcon = createElement(getItemTypeIcon(item.itemType.icon), {
    className: 'size-5',
    style: { color: item.itemType.color },
  });

  return (
    <div className='space-y-6'>
      <ItemDrawerCollections item={item} />
      <ItemDrawerMetadata item={item} />
      <ItemDrawerTags tags={item.tags} />

      <div className='space-y-3'>
        <div className='flex items-center gap-3'>
          <div className='rounded-2xl border border-border/60 bg-muted/35 p-3'>
            {itemTypeIcon}
          </div>
          <div>
            <p className='text-sm font-medium'>Details</p>
            <p className='text-sm text-muted-foreground'>
              Full item content and metadata.
            </p>
          </div>
        </div>

        <ItemDrawerContent item={item} />
        <ItemDrawerUrl url={item.url} />
        <ItemDrawerFile item={item} />
      </div>
    </div>
  );
};

interface ItemDrawerEditBodyProps {
  collections: CollectionOption[];
  fieldErrors: EditFormErrors;
  formState: EditFormState;
  item: ItemDrawerDetail;
  onFieldChange: <T extends EditFormField>(field: T, value: EditFormState[T]) => void;
  submitError: string | null;
}

const ItemDrawerEditBody = ({
  collections,
  fieldErrors,
  formState,
  item,
  onFieldChange,
  submitError,
}: ItemDrawerEditBodyProps) => {
  const showContentField = isContentItemType(item.itemType.name);
  const showLanguageField = isLanguageItemType(item.itemType.name);
  const showUrlField = isUrlItemType(item.itemType.name);

  return (
    <div className='space-y-6'>
      {submitError ? (
        <div className='rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
          {submitError}
        </div>
      ) : null}

      <div className='space-y-2'>
        <label htmlFor='item-title' className='text-sm font-medium'>
          Title
        </label>
        <Input
          id='item-title'
          value={formState.title}
          onChange={(event) => onFieldChange('title', event.target.value)}
          placeholder='Enter a title'
          autoFocus
        />
        <FieldErrorText errors={fieldErrors.title} />
      </div>

      <div className='space-y-2'>
        <label htmlFor='item-description' className='text-sm font-medium'>
          Description
        </label>
        <Textarea
          id='item-description'
          value={formState.description}
          onChange={(event) => onFieldChange('description', event.target.value)}
          className='min-h-24 resize-y py-3'
          placeholder='Add a description'
        />
        <FieldErrorText errors={fieldErrors.description} />
      </div>

      <div className='grid gap-3 sm:grid-cols-2'>
        <ItemMetadataCard label='Item type' value={item.itemType.name} />
        <ItemMetadataCard
          label='Updated'
          value={formatUpdatedAt(item.updatedAt)}
          secondaryValue={formatDate(item.updatedAt)}
        />
        <ItemMetadataCard
          label='Created'
          value={formatDate(item.createdAt)}
          secondaryValue={item.contentType}
        />
      </div>

      <CollectionPicker
        collections={collections}
        errors={fieldErrors.collectionIds}
        id='item-collections'
        onChange={(collectionIds) => onFieldChange('collectionIds', collectionIds)}
        selectedCollectionIds={formState.collectionIds}
      />

      <div className='space-y-2'>
        <label htmlFor='item-tags' className='text-sm font-medium'>
          Tags
        </label>
        <Input
          id='item-tags'
          value={formState.tags}
          onChange={(event) => onFieldChange('tags', event.target.value)}
          placeholder='react, prisma, snippet'
        />
        <p className='text-xs text-muted-foreground'>
          Separate tags with commas.
        </p>
        <FieldErrorText errors={fieldErrors.tags} />
      </div>

      {showContentField ? (
        <div className='space-y-2'>
          <label htmlFor='item-content' className='text-sm font-medium'>
            Content
          </label>
          {usesCodeEditor(item.itemType.name) ? (
            <CodeEditor
              id='item-content'
              itemType={item.itemType.name}
              language={formState.language}
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
              className='min-h-40 resize-y py-3 font-mono leading-6'
              placeholder='Add item content'
            />
          )}
          <FieldErrorText errors={fieldErrors.content} />
        </div>
      ) : null}

      {showLanguageField ? (
        <div className='space-y-2'>
          <label htmlFor='item-language' className='text-sm font-medium'>
            Language
          </label>
          <Input
            id='item-language'
            value={formState.language}
            onChange={(event) => onFieldChange('language', event.target.value)}
            placeholder='Type a language'
          />
          <FieldErrorText errors={fieldErrors.language} />
        </div>
      ) : null}

      {showUrlField ? (
        <div className='space-y-2'>
          <label htmlFor='item-url' className='text-sm font-medium'>
            URL
          </label>
          <Input
            id='item-url'
            type='url'
            value={formState.url}
            onChange={(event) => onFieldChange('url', event.target.value)}
            placeholder='https://example.com'
          />
          <FieldErrorText errors={fieldErrors.url} />
        </div>
      ) : null}
    </div>
  );
};

interface ItemDrawerProps {
  collections: CollectionOption[];
  error: string | null;
  isLoading: boolean;
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
  item,
  onCopy,
  onItemDeleted,
  onItemUpdated,
  onOpenChange,
  open,
  preview,
}: ItemDrawerProps) => {
  const router = useRouter();
  const activeItem = item ?? preview;
  const canCopy = Boolean(getCopyValue(item));
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    toast.success('Item updated.');
    router.refresh();
  };

  const saveDisabled = isSaving || isDeleting || !formState.title.trim();

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
                  <DrawerActionButton
                    active={Boolean(item?.isFavorite)}
                    aria-label='Favorite'
                    disabled
                  >
                    <Star
                      className={cn(
                        'size-4',
                        item?.isFavorite ? 'fill-current text-yellow-400' : '',
                      )}
                    />
                    Favorite
                  </DrawerActionButton>
                  <DrawerActionButton
                    active={Boolean(item?.isPinned)}
                    aria-label='Pin'
                    disabled
                  >
                    <Pin
                      className={cn('size-4', item?.isPinned ? 'fill-current' : '')}
                    />
                    Pin
                  </DrawerActionButton>
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
                    disabled={!item || isLoading || isDeleting}
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
                        disabled={!item || isLoading || isDeleting}
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
                  item={item}
                  onFieldChange={handleFieldChange}
                  submitError={submitError}
                />
              ) : (
                <ItemDrawerBody item={item} />
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
