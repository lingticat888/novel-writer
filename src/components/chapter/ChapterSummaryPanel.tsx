import { useState, useEffect } from 'react';
import { useChapterSummaryStore, useNovelStore } from '@/stores';
import type { EmotionalType } from '@/models';
import { POSITIVE_EMOTIONS, NEGATIVE_EMOTIONS } from '@/models';

const EMOTIONAL_LABELS: Record<EmotionalType, string> = {
  thrill: '爽',
  anticipation: '期待',
  adoration: '苏感',
  couple_vibe: 'CP感',
  relief: '解气',
  sweetness: '甜宠',
  touching: '感动',
  achievement: '成就',
  relaxation: '轻松',
  anger: '愤怒',
  suppressed: '憋屈',
  depression: '郁闷',
  hatred: '仇恨',
  anxiety: '着急',
  nervousness: '紧张',
  worry: '担忧',
  suffering: '虐',
  awkwardness: '尴尬',
};

const EMOTIONAL_COLORS: Record<EmotionalType, string> = {
  thrill: 'bg-green-100 text-green-800',
  anticipation: 'bg-lime-100 text-lime-800',
  adoration: 'bg-pink-100 text-pink-800',
  couple_vibe: 'bg-pink-200 text-pink-800',
  relief: 'bg-emerald-100 text-emerald-800',
  sweetness: 'bg-rose-100 text-rose-800',
  touching: 'bg-rose-200 text-rose-800',
  achievement: 'bg-yellow-100 text-yellow-800',
  relaxation: 'bg-green-200 text-green-800',
  anger: 'bg-red-100 text-red-800',
  suppressed: 'bg-orange-100 text-orange-800',
  depression: 'bg-violet-100 text-violet-800',
  hatred: 'bg-red-200 text-red-800',
  anxiety: 'bg-amber-100 text-amber-800',
  nervousness: 'bg-rose-300 text-rose-800',
  worry: 'bg-violet-200 text-violet-800',
  suffering: 'bg-gray-200 text-gray-800',
  awkwardness: 'bg-gray-300 text-gray-800',
};

interface ChapterSummaryPanelProps {
  novelId: string;
  onClose: () => void;
}

interface EditingSummary {
  coreEvents: string;
  appearingCharacters: string;
  plotFlags: string;
  emotionalTone: EmotionalType;
  customNotes: string;
}

export function ChapterSummaryPanel({ novelId, onClose }: ChapterSummaryPanelProps) {
  const {
    summaries,
    loadSummariesByNovelId,
    loadSummaryByChapterId,
    saveSummary,
  } = useChapterSummaryStore();

  const { currentNovel, currentChapter } = useNovelStore();

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<EditingSummary>({
    coreEvents: '',
    appearingCharacters: '',
    plotFlags: '',
    emotionalTone: 'thrill',
    customNotes: '',
  });

  useEffect(() => {
    loadSummariesByNovelId(novelId);
  }, [novelId, loadSummariesByNovelId]);

  useEffect(() => {
    if (currentChapter && !selectedChapterId) {
      setSelectedChapterId(currentChapter.id);
    }
  }, [currentChapter, selectedChapterId]);

  useEffect(() => {
    if (selectedChapterId) {
      loadSummaryByChapterId(selectedChapterId);
    }
  }, [selectedChapterId, loadSummaryByChapterId]);

  useEffect(() => {
    const summary = selectedChapterId ? summaries.get(selectedChapterId) : undefined;
    if (summary) {
      setEditData({
        coreEvents: summary.coreEvents,
        appearingCharacters: summary.appearingCharacters.join(', '),
        plotFlags: summary.plotFlags.join(', '),
        emotionalTone: summary.emotionalTone,
        customNotes: summary.customNotes,
      });
    } else if (!editing) {
      setEditData({
        coreEvents: '',
        appearingCharacters: '',
        plotFlags: '',
        emotionalTone: 'thrill',
        customNotes: '',
      });
    }
  }, [selectedChapterId, summaries, editing]);

  const handleSave = async () => {
    if (!selectedChapterId) return;
    
    const data = {
      chapterId: selectedChapterId,
      coreEvents: editData.coreEvents,
      appearingCharacters: editData.appearingCharacters.split(',').map(s => s.trim()).filter(Boolean),
      plotFlags: editData.plotFlags.split(',').map(s => s.trim()).filter(Boolean),
      emotionalTone: editData.emotionalTone,
      customNotes: editData.customNotes,
    };

    await saveSummary(selectedChapterId, data);
    setEditing(false);
  };

  const allChapters = currentNovel?.volumes?.flatMap(v => 
    v.chapters?.map(c => ({ ...c, volumeTitle: v.title })) || []
  ) || [];

  const selectedChapter = allChapters.find(c => c.id === selectedChapterId);
  const currentSummary = selectedChapterId ? summaries.get(selectedChapterId) : undefined;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-5xl max-h-[85vh] mx-4 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            章节摘要
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b dark:border-gray-700">
          <div className="w-64 border-r dark:border-gray-700 overflow-y-auto max-h-64">
            {allChapters.length === 0 ? (
              <div className="p-4 text-gray-500 text-sm">暂无章节</div>
            ) : (
              allChapters.map((chapter) => {
                const hasSummary = summaries.has(chapter.id);
                return (
                  <button
                    key={chapter.id}
                    onClick={() => {
                      setSelectedChapterId(chapter.id);
                      setEditing(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      selectedChapterId === chapter.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {hasSummary && (
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      )}
                      <span className="truncate">{chapter.title}</span>
                    </div>
                    <div className="text-xs text-gray-400 truncate mt-0.5">
                      {chapter.volumeTitle}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto max-h-64">
            {selectedChapter ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                当前章节: <span className="font-medium text-gray-900 dark:text-white">{selectedChapter.title}</span>
              </div>
            ) : (
              <div className="text-sm text-gray-500">请选择要编辑的章节</div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {selectedChapter ? (
            <div className="space-y-4">
              {editing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      核心事件
                    </label>
                    <textarea
                      value={editData.coreEvents}
                      onChange={(e) => setEditData({ ...editData, coreEvents: e.target.value })}
                      rows={3}
                      placeholder="描述本章发生的核心事件..."
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      登场人物
                    </label>
                    <input
                      type="text"
                      value={editData.appearingCharacters}
                      onChange={(e) => setEditData({ ...editData, appearingCharacters: e.target.value })}
                      placeholder="用逗号分隔多个角色"
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      伏笔标记
                    </label>
                    <input
                      type="text"
                      value={editData.plotFlags}
                      onChange={(e) => setEditData({ ...editData, plotFlags: e.target.value })}
                      placeholder="记录本章埋下的伏笔，用逗号分隔"
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      情感基调
                    </label>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-green-600 font-medium mr-2">正面情绪</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {POSITIVE_EMOTIONS.map((emotion) => (
                            <button
                              key={emotion}
                              onClick={() => setEditData({ ...editData, emotionalTone: emotion })}
                              className={`px-2 py-1 rounded-full text-xs ${
                                editData.emotionalTone === emotion
                                  ? EMOTIONAL_COLORS[emotion] + ' ring-2 ring-offset-1 ring-indigo-500'
                                  : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40'
                              }`}
                            >
                              {EMOTIONAL_LABELS[emotion]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-red-600 font-medium mr-2">负面情绪</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {NEGATIVE_EMOTIONS.map((emotion) => (
                            <button
                              key={emotion}
                              onClick={() => setEditData({ ...editData, emotionalTone: emotion })}
                              className={`px-2 py-1 rounded-full text-xs ${
                                editData.emotionalTone === emotion
                                  ? EMOTIONAL_COLORS[emotion] + ' ring-2 ring-offset-1 ring-indigo-500'
                                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
                              }`}
                            >
                              {EMOTIONAL_LABELS[emotion]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      备注
                    </label>
                    <textarea
                      value={editData.customNotes}
                      onChange={(e) => setEditData({ ...editData, customNotes: e.target.value })}
                      rows={2}
                      placeholder="其他备注信息..."
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </>
              ) : currentSummary ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">核心事件</h3>
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {currentSummary.coreEvents || '暂无'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">登场人物</h3>
                    <div className="flex flex-wrap gap-1">
                      {currentSummary.appearingCharacters.length > 0 ? (
                        currentSummary.appearingCharacters.map((char, i) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-sm">
                            {char}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">暂无</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">伏笔标记</h3>
                    <div className="flex flex-wrap gap-1">
                      {currentSummary.plotFlags.length > 0 ? (
                        currentSummary.plotFlags.map((flag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-sm">
                            {flag}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">暂无</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">情感基调</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${EMOTIONAL_COLORS[currentSummary.emotionalTone]}`}>
                      {EMOTIONAL_LABELS[currentSummary.emotionalTone]}
                    </span>
                  </div>

                  {currentSummary.customNotes && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">备注</h3>
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {currentSummary.customNotes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  该章节暂无摘要，点击下方按钮创建
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              请从左侧选择一个章节
            </div>
          )}
        </div>

        <div className="p-4 border-t dark:border-gray-700 flex justify-between">
          <div>
            {selectedChapter && (
              editing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    保存
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  {currentSummary ? '编辑摘要' : '创建摘要'}
                </button>
              )
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}