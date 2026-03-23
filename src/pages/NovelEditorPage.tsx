import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNovelStore, useUIStore, useEditorStore } from '@/stores';
import { Sidebar } from '@/components/layout/Sidebar';
import { EditorPane } from '@/components/layout/EditorPane';
import { StatusBar } from '@/components/layout/StatusBar';
import { WorldStatePanel } from '@/components/world/WorldStatePanel';
import { ResourceLedgerPanel } from '@/components/resource/ResourceLedgerPanel';
import { PlotTrackerPanel } from '@/components/plot/PlotTrackerPanel';
import { ChapterSummaryPanel } from '@/components/chapter/ChapterSummaryPanel';
import { SidequestProgressPanel } from '@/components/sidequest/SidequestProgressPanel';
import { EmotionalArcChartPanel } from '@/components/emotion/EmotionalArcChartPanel';
import { CharacterInteractionMatrixPanel } from '@/components/interaction/CharacterInteractionMatrixPanel';
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
    isResourceLedgerPanelOpen,
    isPlotTrackerPanelOpen,
    isChapterSummaryPanelOpen,
    isSidequestProgressPanelOpen,
    isEmotionalArcChartPanelOpen,
    isCharacterInteractionMatrixPanelOpen,
    openExportModal, 
    closeExportModal,
    openWorldStatePanel,
    closeWorldStatePanel,
    openResourceLedgerPanel,
    closeResourceLedgerPanel,
    openPlotTrackerPanel,
    closePlotTrackerPanel,
    openChapterSummaryPanel,
    closeChapterSummaryPanel,
    openSidequestProgressPanel,
    closeSidequestProgressPanel,
    openEmotionalArcChartPanel,
    closeEmotionalArcChartPanel,
    openCharacterInteractionMatrixPanel,
    closeCharacterInteractionMatrixPanel,
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
      <header className="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 flex items-center gap-2 flex-wrap">
        <button
          onClick={handleBack}
          className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white px-2">
          {currentNovel.title}
        </h1>
        
        <div className="flex-1" />
        
        <button onClick={openPlotTrackerPanel} className="px-3 py-1.5 text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-md hover:bg-amber-200 dark:hover:bg-amber-900/50">
          🎭 伏笔
        </button>
        
        <button onClick={openResourceLedgerPanel} className="px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50">
          💰 资源
        </button>
        
        <button onClick={openWorldStatePanel} className="px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/50">
          🌍 世界
        </button>
        
        <button onClick={openChapterSummaryPanel} className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50">
          📋 摘要
        </button>
        
        <button onClick={openSidequestProgressPanel} className="px-3 py-1.5 text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-md hover:bg-orange-200 dark:hover:bg-orange-900/50">
          🗺️ 支线
        </button>
        
        <button onClick={openEmotionalArcChartPanel} className="px-3 py-1.5 text-sm bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-md hover:bg-rose-200 dark:hover:bg-rose-900/50">
          📈 情感
        </button>
        
        <button onClick={openCharacterInteractionMatrixPanel} className="px-3 py-1.5 text-sm bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded-md hover:bg-cyan-200 dark:hover:bg-cyan-900/50">
          🔗 角色
        </button>
        
        <button
          onClick={openExportModal}
          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          📥 导出
        </button>
        
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {isSaving ? '保存中...' : '已保存'}
        </span>
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
        <WorldStatePanel novelId={currentNovel.id} onClose={closeWorldStatePanel} />
      )}

      {isResourceLedgerPanelOpen && currentNovel && (
        <ResourceLedgerPanel novelId={currentNovel.id} onClose={closeResourceLedgerPanel} />
      )}

      {isPlotTrackerPanelOpen && currentNovel && (
        <PlotTrackerPanel novelId={currentNovel.id} onClose={closePlotTrackerPanel} />
      )}

      {isChapterSummaryPanelOpen && currentNovel && (
        <ChapterSummaryPanel novelId={currentNovel.id} onClose={closeChapterSummaryPanel} />
      )}

      {isSidequestProgressPanelOpen && currentNovel && (
        <SidequestProgressPanel novelId={currentNovel.id} onClose={closeSidequestProgressPanel} />
      )}

      {isEmotionalArcChartPanelOpen && currentNovel && (
        <EmotionalArcChartPanel novelId={currentNovel.id} onClose={closeEmotionalArcChartPanel} />
      )}

      {isCharacterInteractionMatrixPanelOpen && currentNovel && (
        <CharacterInteractionMatrixPanel novelId={currentNovel.id} onClose={closeCharacterInteractionMatrixPanel} />
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">导出作品</h2>
        
        <div className="mb-4 space-y-2">
          <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
            <input
              type="radio"
              name="format"
              value="markdown"
              checked={format === 'markdown'}
              onChange={() => setFormat('markdown')}
              className="text-indigo-600"
            />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Markdown (.md)</div>
              <div className="text-sm text-gray-500">适合阅读和发布</div>
            </div>
          </label>
          <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
            <input
              type="radio"
              name="format"
              value="json"
              checked={format === 'json'}
              onChange={() => setFormat('json')}
              className="text-indigo-600"
            />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">JSON (.json)</div>
              <div className="text-sm text-gray-500">备份和迁移数据</div>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            取消
          </button>
          <button
            onClick={() => onExport(format)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            导出
          </button>
        </div>
      </div>
    </div>
  );
}
