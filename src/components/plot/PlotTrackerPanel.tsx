import { useState, useEffect } from 'react';
import { usePlotStore } from '@/stores';
import type { PlotStatus } from '@/models';

const STATUS_LABELS: Record<PlotStatus, string> = {
  buried: '未回收',
  resolved: '已回收',
  invalidated: '已失效',
};

const STATUS_TABS: (PlotStatus | 'all')[] = ['all', 'buried', 'resolved', 'invalidated'];

interface PlotTrackerPanelProps {
  novelId: string;
  onClose: () => void;
}

export function PlotTrackerPanel({ novelId, onClose }: PlotTrackerPanelProps) {
  const {
    plots,
    filterStatus,
    loadPlots,
    createPlot,
    resolvePlot,
    invalidatePlot,
    deletePlot,
    setFilterStatus,
  } = usePlotStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [resolveChapterId, setResolveChapterId] = useState('');
  const [resolveDescription, setResolveDescription] = useState('');

  useEffect(() => {
    loadPlots(novelId);
  }, [novelId, loadPlots]);

  const handleCreate = async () => {
    if (!newContent.trim()) return;
    await createPlot({
      novelId,
      content: newContent.trim(),
      buriedChapterId: '',
    });
    setNewContent('');
    setIsCreating(false);
  };

  const handleResolve = async (plotId: string) => {
    if (!resolveChapterId || !resolveDescription) return;
    await resolvePlot(plotId, resolveChapterId, resolveDescription);
    setResolveChapterId('');
    setResolveDescription('');
  };

  const filteredPlots = filterStatus === 'all'
    ? plots
    : plots.filter((p) => p.status === filterStatus);

  const buriedCount = plots.filter((p) => p.status === 'buried').length;
  const resolvedCount = plots.filter((p) => p.status === 'resolved').length;
  const invalidatedCount = plots.filter((p) => p.status === 'invalidated').length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[80vh] mx-4 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              伏笔追踪
            </h2>
            <div className="flex gap-2 text-sm">
              <span className="text-amber-600">未回收: {buriedCount}</span>
              <span className="text-green-600">已回收: {resolvedCount}</span>
              <span className="text-gray-400">已失效: {invalidatedCount}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex gap-2 p-4 border-b dark:border-gray-700 overflow-x-auto">
          {STATUS_TABS.map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                filterStatus === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {status === 'all' ? '全部' : STATUS_LABELS[status]}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredPlots.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {isCreating ? '输入伏笔内容开始创建' : '暂无伏笔，点击下方按钮创建'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPlots.map((plot) => (
                <div
                  key={plot.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    plot.status === 'buried'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : plot.status === 'resolved'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-400 bg-gray-50 dark:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          plot.status === 'buried'
                            ? 'bg-amber-200 text-amber-800'
                            : plot.status === 'resolved'
                            ? 'bg-green-200 text-green-800'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {STATUS_LABELS[plot.status]}
                        </span>
                      </div>
                      <p className="text-gray-900 dark:text-white">{plot.content}</p>
                      {plot.status === 'buried' && (
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            value={resolveChapterId}
                            onChange={(e) => setResolveChapterId(e.target.value)}
                            placeholder="回收章节ID"
                            className="flex-1 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                          />
                          <input
                            type="text"
                            value={resolveDescription}
                            onChange={(e) => setResolveDescription(e.target.value)}
                            placeholder="回收描述"
                            className="flex-1 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                          />
                          <button
                            onClick={() => handleResolve(plot.id)}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            标记回收
                          </button>
                        </div>
                      )}
                      {plot.status === 'resolved' && plot.resolveDescription && (
                        <p className="mt-2 text-sm text-green-700 dark:text-green-400">
                          回收于: {plot.resolveDescription}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {plot.status === 'buried' && (
                        <button
                          onClick={() => invalidatePlot(plot.id)}
                          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
                        >
                          标记失效
                        </button>
                      )}
                      <button
                        onClick={() => deletePlot(plot.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t dark:border-gray-700">
          {isCreating ? (
            <div className="space-y-3">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="输入伏笔内容..."
                rows={2}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  创建
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-500 hover:border-indigo-500 hover:text-indigo-500"
            >
              + 记录新伏笔
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
