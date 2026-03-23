import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNovelStore, useUIStore, useEditorStore } from '@/stores';
import { Sidebar } from '@/components/layout/Sidebar';
import { EditorPane } from '@/components/layout/EditorPane';
import { StatusBar } from '@/components/layout/StatusBar';

export function NovelEditorPage() {
  const { novelId } = useParams<{ novelId: string }>();
  const navigate = useNavigate();
  const { 
    currentNovel, 
    loadNovel, 
    addVolume, 
    addChapter,
    isLoading 
  } = useNovelStore();
  const { isSidebarOpen } = useUIStore();
  const { isSaving } = useEditorStore();

  useEffect(() => {
    if (novelId) {
      loadNovel(novelId);
    }
  }, [novelId, loadNovel]);

  const handleBack = () => {
    navigate('/library');
  };

  const handleAddVolume = async () => {
    if (!currentNovel) return;
    const title = `新卷 ${(currentNovel.volumes?.length || 0) + 1}`;
    await addVolume(currentNovel.id, title);
  };

  const handleAddChapter = async (volumeId: string) => {
    const volume = currentNovel?.volumes?.find(v => v.id === volumeId);
    if (!volume) return;
    const title = `第 ${(volume.chapters?.length || 0) + 1} 章`;
    await addChapter(volumeId, title);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">加载中...</div>
      </div>
    );
  }

  if (!currentNovel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">作品不存在</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            返回作品库
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 flex items-center gap-4">
        <button
          onClick={handleBack}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentNovel.title}
          </h1>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {isSaving ? '保存中...' : '已保存'}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {isSidebarOpen && (
          <Sidebar 
            onAddVolume={handleAddVolume}
            onAddChapter={handleAddChapter}
          />
        )}
        <EditorPane />
      </div>

      <StatusBar />
    </div>
  );
}
