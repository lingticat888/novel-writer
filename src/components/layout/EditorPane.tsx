import { useEffect, useCallback, useRef, useState } from 'react';
import { useNovelStore, useEditorStore } from '@/stores';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (!text) return 0;
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
  const englishWords = text.match(/[a-zA-Z]+/g) || [];
  return chineseChars.length + englishWords.length;
}

export function EditorPane({ onSetPlot }: { onSetPlot?: (selectedText: string) => void }) {
  const { currentChapter, updateChapter } = useNovelStore();
  const { setContent, setWordCount, setSaving, setLastSavedAt, isDirty } = useEditorStore();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef<string>('');
  const [hasSelection, setHasSelection] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '开始写作...',
      }),
      Typography,
    ],
    content: currentChapter?.content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
      setWordCount(countWords(html));
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      setHasSelection(from !== to);
    },
  });

  const getSelectedText = () => {
    if (!editor) return '';
    const { from, to } = editor.state.selection;
    if (from === to) return '';
    return editor.state.doc.textBetween(from, to, ' ');
  };

  const handleSetPlot = () => {
    const text = getSelectedText();
    if (text && onSetPlot) {
      onSetPlot(text);
    }
  };

  useEffect(() => {
    if (currentChapter && editor) {
      const content = currentChapter.content || '';
      if (editor.getHTML() !== content) {
        editor.commands.setContent(content);
      }
      lastSavedContentRef.current = content;
      setContent(content);
      setWordCount(countWords(content));
    }
  }, [currentChapter?.id]);

  const handleSave = useCallback(async () => {
    if (!currentChapter) return;
    
    const content = editor?.getHTML() || '';
    if (content === lastSavedContentRef.current) return;
    
    setSaving(true);
    try {
      await updateChapter(currentChapter.id, { content });
      lastSavedContentRef.current = content;
      setLastSavedAt(new Date());
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setSaving(false);
    }
  }, [currentChapter, editor, updateChapter, setSaving, setLastSavedAt]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      handleSave();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handleSave]);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(handleSave, 30000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editor?.getHTML()]);

  if (!currentChapter) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            选择左侧目录中的一个章节开始编辑
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            或创建一个新卷和新章节
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          {currentChapter.title}
        </h2>
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className={`px-4 py-1.5 text-sm rounded-md ${
            isDirty
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          保存
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          <EditorToolbar editor={editor} onSave={handleSave} onSetPlot={handleSetPlot} hasSelection={hasSelection} />
          <EditorContent
            editor={editor}
            className="prose dark:prose-invert prose-indigo max-w-none outline-none min-h-[500px]"
          />
        </div>
      </div>
    </div>
  );
}

function EditorToolbar({ editor, onSave, onSetPlot, hasSelection }: { editor: ReturnType<typeof useEditor>; onSave: () => void; onSetPlot?: () => void; hasSelection: boolean }) {
  if (!editor) return null;

  const runCommand = (command: () => boolean) => {
    editor?.view.focus();
    command();
  };

  return (
    <div className="flex gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => runCommand(() => editor.chain().focus().toggleBold().run())}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
          editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="粗体"
      >
        <span className="font-bold text-sm">B</span>
      </button>
      <button
        onClick={() => runCommand(() => editor.chain().focus().toggleItalic().run())}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
          editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="斜体"
      >
        <span className="italic text-sm">I</span>
      </button>
      <button
        onClick={() => runCommand(() => editor.chain().focus().toggleStrike().run())}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
          editor.isActive('strike') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="删除线"
      >
        <span className="line-through text-sm">S</span>
      </button>

      <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

      <button
        onClick={() => runCommand(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
          editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="标题1"
      >
        <span className="text-sm font-bold">H1</span>
      </button>
      <button
        onClick={() => runCommand(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
          editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="标题2"
      >
        <span className="text-sm font-bold">H2</span>
      </button>
      <button
        onClick={() => runCommand(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
          editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="标题3"
      >
        <span className="text-sm font-bold">H3</span>
      </button>

      <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

      <button
        onClick={() => runCommand(() => editor.chain().focus().toggleBlockquote().run())}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
          editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="引用"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
      <button
        onClick={() => runCommand(() => editor.chain().focus().setHorizontalRule().run())}
        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        title="分隔线"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      </button>

      <div className="flex-1" />

      <button
        onClick={onSetPlot}
        disabled={!hasSelection}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
          hasSelection ? 'text-amber-600' : 'text-gray-400 cursor-not-allowed'
        }`}
        title="设为伏笔"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>

      <button
        onClick={onSave}
        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-indigo-600"
        title="保存"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
      </button>
    </div>
  );
}
