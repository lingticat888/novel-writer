import { useState, useEffect } from 'react';
import { useSidequestStore } from '@/stores';
import type { QuestStatus } from '@/models';

const STATUS_LABELS: Record<QuestStatus, string> = {
  in_progress: '进行中',
  completed: '已完成',
  abandoned: '已放弃',
};

const STATUS_COLORS: Record<QuestStatus, string> = {
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  abandoned: 'bg-gray-100 text-gray-600',
};

const STATUS_TABS: (QuestStatus | 'all')[] = ['all', 'in_progress', 'completed', 'abandoned'];

interface SidequestProgressPanelProps {
  novelId: string;
  onClose: () => void;
}

export function SidequestProgressPanel({ novelId, onClose }: SidequestProgressPanelProps) {
  const {
    sidequests,
    filterStatus,
    loadSidequests,
    createSidequest,
    updateProgress,
    updateStatus,
    deleteSidequest,
    setFilterStatus,
  } = useSidequestStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editingProgress, setEditingProgress] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const [progressNote, setProgressNote] = useState('');

  useEffect(() => {
    loadSidequests(novelId);
  }, [novelId, loadSidequests]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createSidequest({
      novelId,
      title: newTitle.trim(),
      description: newDescription.trim(),
    });
    setNewTitle('');
    setNewDescription('');
    setIsCreating(false);
  };

  const handleUpdateProgress = async (id: string) => {
    await updateProgress(id, { progress: progressValue, note: progressNote });
    setEditingProgress(null);
    setProgressValue(0);
    setProgressNote('');
  };

  const filteredSidequests = filterStatus === 'all'
    ? sidequests
    : sidequests.filter((s) => s.status === filterStatus);

  const inProgressCount = sidequests.filter((s) => s.status === 'in_progress').length;
  const completedCount = sidequests.filter((s) => s.status === 'completed').length;
  const abandonedCount = sidequests.filter((s) => s.status === 'abandoned').length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[80vh] mx-4 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              支线进度
            </h2>
            <div className="flex gap-2 text-sm">
              <span className="text-blue-600">进行中: {inProgressCount}</span>
              <span className="text-green-600">已完成: {completedCount}</span>
              <span className="text-gray-400">已放弃: {abandonedCount}</span>
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
          {filteredSidequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {isCreating ? '输入支线信息开始创建' : '暂无支线，点击下方按钮创建'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSidequests.map((sidequest) => (
                <div
                  key={sidequest.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[sidequest.status]}`}>
                          {STATUS_LABELS[sidequest.status]}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{sidequest.title}</h3>
                      {sidequest.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{sidequest.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {sidequest.status !== 'completed' && (
                        <button
                          onClick={() => updateStatus(sidequest.id, 'completed')}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          标记完成
                        </button>
                      )}
                      {sidequest.status !== 'abandoned' && sidequest.status !== 'completed' && (
                        <button
                          onClick={() => updateStatus(sidequest.id, 'abandoned')}
                          className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                          放弃
                        </button>
                      )}
                      <button
                        onClick={() => deleteSidequest(sidequest.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        删除
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-500 dark:text-gray-400">进度</span>
                        <span className="font-medium text-gray-900 dark:text-white">{sidequest.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            sidequest.progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(sidequest.progress, 100)}%` }}
                        />
                      </div>
                    </div>
                    {editingProgress === sidequest.id ? (
                      <div className="flex items-center gap-2 ml-4">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={progressValue}
                          onChange={(e) => setProgressValue(Number(e.target.value))}
                          className="w-16 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                        />
                        <input
                          type="text"
                          value={progressNote}
                          onChange={(e) => setProgressNote(e.target.value)}
                          placeholder="备注"
                          className="w-24 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                        />
                        <button
                          onClick={() => handleUpdateProgress(sidequest.id)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingProgress(null)}
                          className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingProgress(sidequest.id);
                          setProgressValue(sidequest.progress);
                          setProgressNote('');
                        }}
                        className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 ml-4"
                      >
                        更新进度
                      </button>
                    )}
                  </div>

                  {sidequest.progressHistory.length > 0 && (
                    <div className="mt-3 pt-3 border-t dark:border-gray-700">
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">进度历史</h4>
                      <div className="space-y-1">
                        {sidequest.progressHistory.slice(-3).reverse().map((change, i) => (
                          <div key={i} className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(change.changedAt).toLocaleDateString()}：{change.oldProgress}% → {change.newProgress}%
                            {change.note && <span className="ml-2 text-gray-400">({change.note})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t dark:border-gray-700">
          {isCreating ? (
            <div className="space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="支线标题"
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                autoFocus
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="支线描述（可选）"
                rows={2}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
              + 添加新支线
            </button>
          )}
        </div>
      </div>
    </div>
  );
}