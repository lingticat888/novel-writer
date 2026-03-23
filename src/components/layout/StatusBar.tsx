import { useNovelStore, useEditorStore } from '@/stores';
import { formatRelativeTime } from '@/utils';

export function StatusBar() {
  const { currentChapter } = useNovelStore();
  const { isDirty, lastSavedAt, isSaving } = useEditorStore();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-4">
          {currentChapter && (
            <>
              <span>字数: {currentChapter.wordCount || 0}</span>
              <span>
                {isSaving ? (
                  '保存中...'
                ) : isDirty ? (
                  '未保存'
                ) : lastSavedAt ? (
                  `已保存 ${formatRelativeTime(lastSavedAt)}`
                ) : (
                  '已保存'
                )}
              </span>
            </>
          )}
        </div>
        <div>
          {currentChapter && (
            <span>章节: {currentChapter.title}</span>
          )}
        </div>
      </div>
    </footer>
  );
}
