'use client';

import { createElement, useMemo, useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { createItem, type CreateItemActionError } from '@/actions/items';
import type { CollectionOption } from '@/lib/db/collections';
import { isFileUploadItemType, type FileUploadItemType } from '@/lib/file-upload';
import { ItemFormType, ITEM_FORM_TYPES, isContentItemType, isFileItemType, isLanguageItemType, parseItemTagsInput, isUrlItemType } from '@/lib/item-form';
import type { SidebarItemType } from '@/lib/db/items';
import { isCodeEditorItemType } from '@/lib/code-editor';
import { isMarkdownEditorItemType } from '@/lib/markdown-editor';

import { cn } from '@/lib/utils';

import { FileUpload } from '@/components/dashboard/file-upload';
import { CollectionPicker } from '@/components/dashboard/collection-picker';
import { useSearch } from '@/components/dashboard/search-provider';
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

type CreateItemType = ItemFormType;

const TYPE_LABELS: Record<CreateItemType, string> = {
  snippet: 'Snippet',
  prompt: 'Prompt',
  command: 'Command',
  note: 'Note',
  file: 'File',
  image: 'Image',
  link: 'Link',
};
const TYPE_ICON_FALLBACKS: Record<CreateItemType, string> = {
  snippet: 'Code',
  prompt: 'Sparkles',
  command: 'Terminal',
  note: 'StickyNote',
  file: 'File',
  image: 'Image',
  link: 'Link',
};
const TYPE_SLUGS: Record<CreateItemType, string> = {
  snippet: 'snippets',
  prompt: 'prompts',
  command: 'commands',
  note: 'notes',
  file: 'files',
  image: 'images',
  link: 'links',
};

interface CreateItemDialogProps {
  collections: CollectionOption[];
  isPro: boolean;
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
  collectionIds: string[];
}

type CreateItemFormField = keyof CreateItemFormState;
type CreateItemFormErrors = Partial<Record<CreateItemFormField, string[]>>;

interface UploadedFilePayload {
  fileName: string;
  fileSize: number;
  fileUrl: string;
}

const INITIAL_FORM_STATE: CreateItemFormState = {
  itemType: 'snippet',
  title: '',
  description: '',
  tags: '',
  content: '',
  language: '',
  url: '',
  collectionIds: [],
};

const FieldErrorText = ({ errors }: { errors?: string[] }) => {
  if (!errors?.length) {
    return null;
  }

  return <p className='text-sm text-destructive'>{errors[0]}</p>;
};

interface TypeOption {
  disabled?: boolean;
  color?: string;
  icon: string;
  label: string;
  value: CreateItemType;
}

const uploadSelectedFile = (
  file: File,
  itemType: FileUploadItemType,
  onProgress: (value: number) => void,
) =>
  new Promise<UploadedFilePayload>((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('itemType', itemType);

    const request = new XMLHttpRequest();
    request.open('POST', '/api/uploads');
    request.responseType = 'json';
    request.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) {
        return;
      }

      onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener('load', () => {
      const response =
        typeof request.response === 'object' && request.response
          ? request.response
          : JSON.parse(request.responseText || '{}');

      if (request.status >= 200 && request.status < 300) {
        resolve(response as UploadedFilePayload);
        return;
      }

      reject(new Error((response as { error?: string }).error ?? 'Unable to upload file.'));
    });
    request.addEventListener('error', () => {
      reject(new Error('Unable to upload file.'));
    });
    request.send(formData);
  });

const cleanupUploadedFile = async (fileUrl: string) => {
  await fetch('/api/uploads', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileUrl }),
  });
};

interface CreateItemTypePickerProps {
  fieldErrors: CreateItemFormErrors;
  formState: CreateItemFormState;
  isPro: boolean;
  onTypeChange: (itemType: CreateItemType) => void;
  typeOptions: TypeOption[];
}

const CreateItemTypePicker = ({
  fieldErrors,
  formState,
  isPro,
  onTypeChange,
  typeOptions,
}: CreateItemTypePickerProps) => (
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
      className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7'
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
            disabled={option.disabled}
            className={cn(
              'flex min-h-24 flex-col items-start justify-between rounded-2xl border px-4 py-3 text-left transition-colors',
              isActive
                ? 'border-foreground/30 bg-muted/60 text-foreground'
                : 'border-border/70 bg-background hover:bg-muted/40',
              option.disabled && 'cursor-not-allowed opacity-50 hover:bg-background',
            )}
            onClick={() => onTypeChange(option.value)}
          >
            <span
              className='rounded-xl border border-border/70 bg-background/80 p-2 text-muted-foreground'
              style={option.color ? { color: option.color } : undefined}
            >
              {createElement(getItemTypeIcon(option.icon), {
                className: 'size-4',
              })}
            </span>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium'>{option.label}</span>
              {option.disabled ? (
                <span className='text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
                  Pro
                </span>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
    {!isPro ? (
      <p className='text-sm text-muted-foreground'>
        File and image items require Pro. Upgrade in{' '}
        <Link href='/settings?billing=upgrade' className='font-medium text-primary hover:text-primary/80'>
          Settings
        </Link>
        .
      </p>
    ) : null}
    <FieldErrorText errors={fieldErrors.itemType} />
  </div>
);

interface CreateItemMainFieldsProps {
  fieldErrors: CreateItemFormErrors;
  formState: CreateItemFormState;
  onFieldChange: <T extends CreateItemFormField>(
    field: T,
    value: CreateItemFormState[T],
  ) => void;
}

const CreateItemMainFields = ({
  fieldErrors,
  formState,
  onFieldChange,
}: CreateItemMainFieldsProps) => (
  <>
    <div className='space-y-2 sm:col-span-2'>
      <label className='text-sm font-medium' htmlFor='create-item-title'>
        Title
      </label>
      <Input
        id='create-item-title'
        value={formState.title}
        onChange={(event) => onFieldChange('title', event.target.value)}
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
        onChange={(event) => onFieldChange('description', event.target.value)}
        placeholder='Add optional context or a short summary'
        className='min-h-24'
      />
      <FieldErrorText errors={fieldErrors.description} />
    </div>
  </>
);

interface CreateItemDynamicFieldsProps {
  fieldErrors: CreateItemFormErrors;
  fileError: string | null;
  formState: CreateItemFormState;
  isSubmitting: boolean;
  onFieldChange: <T extends CreateItemFormField>(
    field: T,
    value: CreateItemFormState[T],
  ) => void;
  onFileChange: (file: File | null) => void;
  selectedFile: File | null;
  uploadProgress: number;
}

const CreateItemDynamicFields = ({
  fieldErrors,
  fileError,
  formState,
  isSubmitting,
  onFieldChange,
  onFileChange,
  selectedFile,
  uploadProgress,
}: CreateItemDynamicFieldsProps) => {
  const showsFileUpload = isFileItemType(formState.itemType);
  const showsContent = isContentItemType(formState.itemType);
  const showsLanguage = isLanguageItemType(formState.itemType);
  const showsUrl = isUrlItemType(formState.itemType);
  const usesCodeEditor = isCodeEditorItemType(formState.itemType);
  const usesMarkdownEditor = isMarkdownEditorItemType(formState.itemType);

  return (
    <>
      {showsFileUpload ? (
        <div className='space-y-2 sm:col-span-2'>
          <FileUpload
            itemType={formState.itemType as FileUploadItemType}
            file={selectedFile}
            error={fileError ?? undefined}
            isUploading={isSubmitting}
            progress={uploadProgress}
            onChange={onFileChange}
          />
        </div>
      ) : null}

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
              onChange={(value) => onFieldChange('content', value)}
            />
          ) : usesMarkdownEditor ? (
            <MarkdownEditor
              id='create-item-content'
              value={formState.content}
              onChange={(value) => onFieldChange('content', value)}
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
              onChange={(event) => onFieldChange('content', event.target.value)}
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
            onChange={(event) => onFieldChange('language', event.target.value)}
            placeholder='TypeScript, Bash, SQL...'
          />
          <FieldErrorText errors={fieldErrors.language} />
        </div>
      ) : null}

      {showsUrl ? (
        <div className='space-y-2 sm:col-span-2'>
          <label className='text-sm font-medium' htmlFor='create-item-url'>
            URL
          </label>
          <Input
            id='create-item-url'
            type='url'
            value={formState.url}
            onChange={(event) => onFieldChange('url', event.target.value)}
            placeholder='https://example.com'
            aria-invalid={fieldErrors.url ? 'true' : 'false'}
          />
          <FieldErrorText errors={fieldErrors.url} />
        </div>
      ) : null}
    </>
  );
};

interface CreateItemFooterProps {
  isSubmitting: boolean;
  onCancel: () => void;
  saveDisabled: boolean;
}

const CreateItemFooter = ({
  isSubmitting,
  onCancel,
  saveDisabled,
}: CreateItemFooterProps) => (
  <div className='flex flex-col-reverse gap-3 border-t border-border/70 bg-muted/30 px-6 py-4 sm:flex-row sm:justify-end'>
    <Button type='button' variant='outline' onClick={onCancel} disabled={isSubmitting}>
      Cancel
    </Button>
    <Button type='submit' disabled={saveDisabled}>
      {isSubmitting ? 'Creating...' : 'Create item'}
    </Button>
  </div>
);

export const CreateItemDialog = ({
  collections,
  isPro,
  itemTypes,
  onOpenChange,
  open,
}: CreateItemDialogProps) => {
  const router = useRouter();
  const { invalidateSearchData } = useSearch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CreateItemFormErrors>({});
  const [formState, setFormState] = useState<CreateItemFormState>(INITIAL_FORM_STATE);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const typeOptions = useMemo(() => {
    const itemTypesBySlug = new Map(itemTypes.map((itemType) => [itemType.slug, itemType]));

    return ITEM_FORM_TYPES.map((itemType) => {
      const itemTypeMeta = itemTypesBySlug.get(TYPE_SLUGS[itemType]);

      return {
        value: itemType,
        label: TYPE_LABELS[itemType],
        color: itemTypeMeta?.color,
        disabled: !isPro && (itemType === 'file' || itemType === 'image'),
        icon: itemTypeMeta?.icon ?? TYPE_ICON_FALLBACKS[itemType],
      };
    });
  }, [isPro, itemTypes]);

  const resetForm = () => {
    setFormState(INITIAL_FORM_STATE);
    setFieldErrors({});
    setSubmitError(null);
    setIsSubmitting(false);
    setSelectedFile(null);
    setFileError(null);
    setUploadProgress(0);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }

    onOpenChange(nextOpen);
  };

  const handleFieldChange = <T extends CreateItemFormField>(
    field: T,
    value: CreateItemFormState[T],
  ) => {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }));
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
    setSubmitError(null);
    if (field === 'title') {
      setFileError(null);
    }
  };

  const handleTypeChange = (itemType: CreateItemType) => {
    if (!isPro && (itemType === 'file' || itemType === 'image')) {
      return;
    }

    setFormState((currentState) => ({
      ...currentState,
      itemType,
      ...(isContentItemType(itemType) ? {} : { content: '' }),
      ...(isLanguageItemType(itemType) ? {} : { language: '' }),
      ...(isUrlItemType(itemType) ? {} : { url: '' }),
    }));
    setFieldErrors({});
    setSubmitError(null);
    setSelectedFile(null);
    setFileError(null);
    setUploadProgress(0);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const requiresFileUpload = isFileItemType(formState.itemType);

    if (requiresFileUpload && !selectedFile) {
      setFileError('Select a file before creating this item.');
      toast.error('Select a file before creating this item.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});
    setFileError(null);

    let uploadedFile: UploadedFilePayload | null = null;

    if (requiresFileUpload && selectedFile && isFileUploadItemType(formState.itemType)) {
      try {
        uploadedFile = await uploadSelectedFile(selectedFile, formState.itemType, setUploadProgress);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to upload file.';

        setIsSubmitting(false);
        setFileError(message);
        toast.error(message);
        return;
      }
    }

    const result = await createItem({
      itemType: formState.itemType,
      title: formState.title,
      description: formState.description,
      tags: parseItemTagsInput(formState.tags),
      ...(isContentItemType(formState.itemType) ? { content: formState.content } : {}),
      ...(isLanguageItemType(formState.itemType) ? { language: formState.language } : {}),
      ...(uploadedFile
        ? {
            fileName: uploadedFile.fileName,
            fileSize: uploadedFile.fileSize,
            fileUrl: uploadedFile.fileUrl,
          }
        : {}),
      ...(isUrlItemType(formState.itemType) ? { url: formState.url } : {}),
      collectionIds: formState.collectionIds,
    });

    setIsSubmitting(false);
    setUploadProgress(0);

    if (!result.success || !result.data) {
      if (uploadedFile?.fileUrl) {
        void cleanupUploadedFile(uploadedFile.fileUrl);
      }

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
    invalidateSearchData();
    toast.success('Item created.');
    startTransition(() => {
      router.refresh();
    });
  };

  const requiresUrl = isUrlItemType(formState.itemType);
  const requiresFileUpload = isFileItemType(formState.itemType);
  const saveDisabled =
    isSubmitting ||
    isRefreshPending ||
    !formState.title.trim() ||
    (requiresFileUpload && !selectedFile) ||
    (requiresUrl && !formState.url.trim());

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-2xl'>
        <DialogHeader className='border-b border-border/70 px-6 py-5'>
          <DialogTitle>Create a new item</DialogTitle>
          <DialogDescription>
            Add a snippet, prompt, command, note, file, image, or link without leaving the page.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex max-h-[calc(90vh-5rem)] flex-col'>
          <div className='space-y-6 overflow-y-auto px-6 py-5'>
            <CreateItemTypePicker
              fieldErrors={fieldErrors}
              formState={formState}
              isPro={isPro}
              onTypeChange={handleTypeChange}
              typeOptions={typeOptions}
            />

            <div className='grid gap-5 sm:grid-cols-2'>
              <CreateItemMainFields
                fieldErrors={fieldErrors}
                formState={formState}
                onFieldChange={handleFieldChange}
              />

              <CreateItemDynamicFields
                fieldErrors={fieldErrors}
                fileError={fileError}
                formState={formState}
                isSubmitting={isSubmitting}
                onFieldChange={handleFieldChange}
                onFileChange={(file) => {
                  setSelectedFile(file);
                  setFileError(null);

                  if (!formState.title.trim() && file) {
                    const titleWithoutExtension = file.name.replace(/\.[^.]+$/, '');
                    handleFieldChange('title', titleWithoutExtension || file.name);
                  }
                }}
                selectedFile={selectedFile}
                uploadProgress={uploadProgress}
              />

              <CollectionPicker
                collections={collections}
                errors={fieldErrors.collectionIds}
                id='create-item-collections'
                onChange={(collectionIds) => handleFieldChange('collectionIds', collectionIds)}
                selectedCollectionIds={formState.collectionIds}
              />

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

          <CreateItemFooter
            isSubmitting={isSubmitting}
            onCancel={() => handleOpenChange(false)}
            saveDisabled={saveDisabled}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};
