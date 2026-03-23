import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNovelStore, useUIStore, useEditorStore } from '@/stores';
import { Sidebar } from '@/components/layout/Sidebar';
import { EditorPane } from '@/components/layout/EditorPane';
import { StatusBar } from '@/components/layout/StatusBar';
import { WorldStatePanel } from '@/components/world/WorldStatePanel';
import { exportService } from '@/services';

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
  const { 
    isSidebarOpen, 
    isExportModalOpen, 
    isWorldStatePanelOpen,
    openExportModal, 
    closeExportModal,
    openWorldStatePanel,
    closeWorldStatePanel,
  } = useUIStore();
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

  const handleExport = (format: 'markdown' | 'json') => {
    if (!currentNovel) return;
    exportService.exportNovel(currentNovel, { format });
    closeExportModal();
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
        <button
          onClick={openWorldStatePanel}
          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935v5.38a2 2 0 01-1.632 1.857c-.71.343-1.504.668-2.372 1.003a23.498 23.498 0 01-4.242 1.82 3.987 3.987 0 01-2.541-.81 3.975 3.975 0 01-3.328 0 3.987 3.987 0 01-2.541.81 23.498 23.498 0 01-4.242-1.82 3.987 3.987 0 01-1.632-1.857V6a2 2 0 012-2h2c.81 0 1.576.23 2.272.628M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          世界
        </button>
        <button
          onClick={openExportModal}
          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          导出
        </button>
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

      {isExportModalOpen && (
        <ExportModal onClose={closeExportModal} onExport={handleExport} />
      )}

      {isWorldStatePanelOpen && currentNovel && (
        <WorldStatePanel
          novelId={currentNovel.id}
          onClose={closeWorldStatePanel}
        />
      )}
    </div>
  );
}

function ExportModal({ 
  onClose, 
  onExport 
}: { 
  onClose: () => void; 
  onExport: (format: 'markdown' | 'json') => void;
}) {
  const [format, setFormat] = useState<'markdown' | 'json'>('markdown');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          导出作品
        </h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            选择导出格式
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="radio"
                name="format"
                value="markdown"
                checked={format === 'markdown'}
                onChange={() => setFormat('markdown')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Markdown (.md)</div>
                <div className="text-sm text-gray-500">适合阅读和发布到博客</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="radio"
                name="format"
                value="json"
                checked={format === 'json'}
                onChange={() => setFormat('json')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">JSON (.json)</div>
                <div className="text-sm text-gray-500">适合备份和迁移数据</div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            取消
          </button>
          <button
            onClick={() => onExport(format)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
          >
            导出
          </button>
        </div>
      </div>
    </div>
  );
}
