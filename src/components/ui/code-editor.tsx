'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Check, Copy } from 'lucide-react';
import type { OnMount } from '@monaco-editor/react';
import type * as MonacoNamespace from 'monaco-editor';
import { toast } from 'sonner';

import { getCodeEditorLanguage } from '@/lib/code-editor';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';

const MonacoEditor = dynamic(
  async () => {
    const mod = await import('@monaco-editor/react');
    return mod.default;
  },
  {
    ssr: false,
    loading: () => (
      <div className='flex h-40 animate-pulse items-center justify-center rounded-b-[1.5rem] bg-[#0f1726] text-sm text-slate-400'>
        Loading editor...
      </div>
    ),
  },
);

const CODE_EDITOR_THEME = 'devstash-dark';
const DEFAULT_MAX_HEIGHT = 400;
const DEFAULT_MIN_HEIGHT = 144;
const HEADER_HEIGHT = 53;
const MIN_EDITOR_BODY_HEIGHT = 80;

interface CodeEditorProps {
  className?: string;
  id?: string;
  itemType: string;
  language?: string | null;
  maxHeight?: number;
  minHeight?: number;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  value: string;
}

const clampHeight = (height: number, minHeight: number, maxHeight: number) =>
  Math.min(Math.max(height, minHeight), maxHeight);

const defineEditorTheme = (monaco: typeof MonacoNamespace) => {
  monaco.editor.defineTheme(CODE_EDITOR_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '64748b' },
      { token: 'keyword', foreground: 'f59e0b' },
      { token: 'number', foreground: '38bdf8' },
      { token: 'string', foreground: '34d399' },
    ],
    colors: {
      'editor.background': '#0f1726',
      'editor.foreground': '#e2e8f0',
      'editor.lineHighlightBackground': '#162033',
      'editor.selectionBackground': '#1d4ed833',
      'editorLineNumber.foreground': '#475569',
      'editorLineNumber.activeForeground': '#94a3b8',
      'editorIndentGuide.background1': '#1e293b',
      'editorIndentGuide.activeBackground1': '#334155',
      'scrollbarSlider.background': '#33415599',
      'scrollbarSlider.hoverBackground': '#475569bb',
      'scrollbarSlider.activeBackground': '#64748bcc',
    },
  });
};

export const CodeEditor = ({
  className,
  id,
  itemType,
  language,
  maxHeight = DEFAULT_MAX_HEIGHT,
  minHeight = DEFAULT_MIN_HEIGHT,
  onChange,
  readOnly = false,
  value,
}: CodeEditorProps) => {
  const [copied, setCopied] = useState(false);
  const editorBodyMinHeight = Math.max(
    Math.min(minHeight - HEADER_HEIGHT, maxHeight - HEADER_HEIGHT),
    MIN_EDITOR_BODY_HEIGHT,
  );
  const editorBodyMaxHeight = Math.max(maxHeight - HEADER_HEIGHT, MIN_EDITOR_BODY_HEIGHT);
  const [editorHeight, setEditorHeight] = useState(editorBodyMinHeight);
  const editorRef = useRef<MonacoNamespace.editor.IStandaloneCodeEditor | null>(null);
  const sizeListenerRef = useRef<MonacoNamespace.IDisposable | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);

  const { editorLanguage, label } = getCodeEditorLanguage(language, itemType);

  useEffect(() => {
    return () => {
      sizeListenerRef.current?.dispose();

      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    editorRef.current?.layout();
  }, [editorHeight]);

  const syncEditorHeight = () => {
    if (!editorRef.current) {
      return;
    }

    const nextHeight = clampHeight(
      Math.ceil(editorRef.current.getContentHeight()) + 4,
      editorBodyMinHeight,
      editorBodyMaxHeight,
    );

    setEditorHeight((currentHeight) =>
      currentHeight === nextHeight ? currentHeight : nextHeight,
    );
  };

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    syncEditorHeight();

    sizeListenerRef.current?.dispose();
    sizeListenerRef.current = editor.onDidContentSizeChange(() => {
      syncEditorHeight();
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Content copied.');

      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch (error) {
      console.error('Failed to copy code editor content.', error);
      toast.error('Unable to copy content.');
    }
  };

  return (
    <div
      className={cn(
        'code-editor-shell overflow-hidden rounded-[1.6rem] border border-slate-800/90 bg-[#0b1220] shadow-[0_18px_45px_-28px_rgba(15,23,38,0.95)]',
        className,
      )}
    >
      <div className='flex min-h-[53px] items-center justify-between border-b border-slate-800/90 bg-[#0e1628] px-4 py-3'>
        <div className='flex min-w-0 items-center gap-3'>
          <div className='flex items-center gap-1.5'>
            <span className='size-3 rounded-full bg-rose-500' />
            <span className='size-3 rounded-full bg-amber-400' />
            <span className='size-3 rounded-full bg-emerald-500' />
          </div>
          <span className='truncate rounded-full border border-slate-700/80 bg-slate-900/70 px-2.5 py-1 text-[11px] font-medium tracking-[0.18em] text-slate-300 uppercase'>
            {label}
          </span>
        </div>

        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='h-8 rounded-lg border border-slate-700/80 bg-slate-900/60 px-2.5 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
          onClick={() => {
            void handleCopy();
          }}
          disabled={!value.trim()}
          aria-label='Copy editor content'
        >
          {copied ? <Check className='size-4' /> : <Copy className='size-4' />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      <MonacoEditor
        beforeMount={defineEditorTheme}
        height={`${editorHeight}px`}
        language={editorLanguage}
        loading={null}
        onChange={(nextValue) => {
          onChange?.(nextValue ?? '');
        }}
        onMount={handleMount}
        options={{
          automaticLayout: true,
          contextmenu: !readOnly,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          domReadOnly: readOnly,
          fixedOverflowWidgets: true,
          folding: false,
          glyphMargin: false,
          lineDecorationsWidth: 10,
          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          minimap: { enabled: false },
          overviewRulerBorder: false,
          overviewRulerLanes: 0,
          padding: { top: 16, bottom: 16 },
          readOnly,
          renderLineHighlight: 'all',
          renderValidationDecorations: 'off',
          scrollBeyondLastLine: false,
          scrollbar: {
            alwaysConsumeMouseWheel: false,
            horizontalScrollbarSize: 10,
            useShadows: false,
            verticalScrollbarSize: 10,
          },
          smoothScrolling: true,
          stickyScroll: { enabled: false },
          wordWrap: 'on',
        }}
        theme={CODE_EDITOR_THEME}
        value={value}
        width='100%'
        wrapperProps={{
          id,
        }}
      />
    </div>
  );
};
