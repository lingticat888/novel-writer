import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useEmotionalArcStore, useNovelStore } from '@/stores';
import type { EmotionalType } from '@/models';
import { POSITIVE_EMOTIONS, NEGATIVE_EMOTIONS } from '@/models';

const EMOTION_COLORS: Record<EmotionalType, string> = {
  thrill: '#22c55e',
  anticipation: '#84cc16',
  adoration: '#f472b6',
  couple_vibe: '#ec4899',
  relief: '#10b981',
  sweetness: '#f9a8d4',
  touching: '#fb7185',
  achievement: '#eab308',
  relaxation: '#a3e635',
  anger: '#ef4444',
  suppressed: '#f97316',
  depression: '#6366f1',
  hatred: '#dc2626',
  anxiety: '#f59e0b',
  nervousness: '#f43f5e',
  worry: '#8b5cf6',
  suffering: '#a1a1aa',
  awkwardness: '#71717a',
};

const EMOTION_LABELS: Record<EmotionalType, string> = {
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

interface EmotionalArcChartPanelProps {
  novelId: string;
  onClose: () => void;
}

export function EmotionalArcChartPanel({ novelId, onClose }: EmotionalArcChartPanelProps) {
  const {
    arcs,
    selectedArcId,
    loadArcs,
    createArc,
    addPoint,
    updatePoint,
    deletePoint,
    deleteArc,
    selectArc,
  } = useEmotionalArcStore();

  const { currentNovel } = useNovelStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newArcName, setNewArcName] = useState('');
  const [targetType, setTargetType] = useState<'novel' | 'character'>('novel');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [addingToChapterId, setAddingToChapterId] = useState<string | null>(null);
  const [editingPointId, setEditingPointId] = useState<string | null>(null);
  const [newEmotion, setNewEmotion] = useState<EmotionalType>('thrill');
  const [newIntensity, setNewIntensity] = useState(50);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    loadArcs(novelId);
  }, [novelId, loadArcs]);

  const selectedArc = arcs.find((a) => a.id === selectedArcId);

  const allChapters = currentNovel?.volumes?.flatMap((v) =>
    v.chapters?.map((c) => ({ ...c, volumeTitle: v.title })) || []
  ) || [];

  const handleCreate = async () => {
    if (!newArcName.trim()) return;
    await createArc({
      novelId,
      name: newArcName.trim(),
      targetType,
      targetId: targetType === 'character' ? selectedCharacterId : undefined,
    });
    setIsCreating(false);
    setNewArcName('');
  };

  const handleAddPoint = async () => {
    if (!selectedArcId || !addingToChapterId) return;
    await addPoint(selectedArcId, {
      chapterId: addingToChapterId,
      emotion: newEmotion,
      intensity: newIntensity,
      note: newNote,
    });
    setAddingToChapterId(null);
    setNewEmotion('thrill');
    setNewIntensity(50);
    setNewNote('');
  };

  const handleUpdatePoint = async () => {
    if (!selectedArcId || !editingPointId) return;
    await updatePoint(selectedArcId, editingPointId, {
      emotion: newEmotion,
      intensity: newIntensity,
      note: newNote,
    });
    setEditingPointId(null);
    setNewEmotion('thrill');
    setNewIntensity(50);
    setNewNote('');
  };

  const startEditingPoint = (pointId: string, emotion: EmotionalType, intensity: number, note: string) => {
    setEditingPointId(pointId);
    setAddingToChapterId(null);
    setNewEmotion(emotion);
    setNewIntensity(intensity);
    setNewNote(note);
  };

  const cancelEditing = () => {
    setEditingPointId(null);
    setAddingToChapterId(null);
    setNewEmotion('thrill');
    setNewIntensity(50);
    setNewNote('');
  };

  const getChartData = () => {
    if (!selectedArc) return [];
    const sortedPoints = [...selectedArc.points].sort(
      (a, b) => allChapters.findIndex((c) => c.id === a.chapterId) - allChapters.findIndex((c) => c.id === b.chapterId)
    );
    const data = sortedPoints.map((point) => {
      const chapter = allChapters.find((c) => c.id === point.chapterId);
      const isNegative = NEGATIVE_EMOTIONS.includes(point.emotion);
      const emotionLabel = EMOTION_LABELS[point.emotion];
      const intensityValue = isNegative ? -point.intensity : point.intensity;
      return {
        name: chapter?.title || point.chapterId.slice(0, 8),
        emotion: emotionLabel,
        intensity: intensityValue,
        rawIntensity: point.intensity,
        color: EMOTION_COLORS[point.emotion],
        note: point.note || '',
        isNegative,
        chapterId: point.chapterId,
      };
    });
    console.log('chartData:', data);
    return data;
  };

  const chartData = getChartData();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] mx-4 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            情感弧度图表
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
            <div className="p-3 border-b dark:border-gray-700">
              <button
                onClick={() => setIsCreating(true)}
                className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-500 hover:border-indigo-500 hover:text-indigo-500 text-sm"
              >
                + 新建弧线
              </button>
            </div>

            {isCreating && (
              <div className="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newArcName}
                    onChange={(e) => setNewArcName(e.target.value)}
                    placeholder="弧线名称（如：主角情感线）"
                    className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    autoFocus
                  />
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as 'novel' | 'character')}
                    className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="novel">整部小说</option>
                    <option value="character">特定角色</option>
                  </select>
                  {targetType === 'character' && (
                    <select
                      value={selectedCharacterId}
                      onChange={(e) => setSelectedCharacterId(e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="">选择角色</option>
                      {currentNovel?.characters?.map((char) => (
                        <option key={char.id} value={char.id}>{char.name}</option>
                      ))}
                    </select>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setNewArcName('');
                      }}
                      className="flex-1 px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={!newArcName.trim()}
                      className="flex-1 px-2 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                      创建
                    </button>
                  </div>
                </div>
              </div>
            )}

            {arcs.length === 0 && !isCreating ? (
              <div className="p-4 text-sm text-gray-500 text-center">暂无情感弧线</div>
            ) : (
              arcs.map((arc) => (
                <button
                  key={arc.id}
                  onClick={() => selectArc(arc.id)}
                  className={`w-full text-left px-4 py-2 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedArcId === arc.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium truncate">
                    {arc.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {arc.points.length} 个数据点
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto max-h-64">
            {selectedArc ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {selectedArc.name}
                  </h3>
                  <button
                    onClick={() => deleteArc(selectedArc.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    删除此弧线
                  </button>
                </div>

                {chartData.length > 0 ? (
                  <>
                    <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                      {chartData.map((d, i) => (
                        <div key={i}>{i}: {d.name} | {d.emotion} | {d.intensity} | {d.rawIntensity}</div>
                      ))}
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart key={selectedArcId} data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                        <YAxis domain={[-100, 100]} ticks={[-100, -50, 0, 50, 100]} stroke="#9ca3af" fontSize={12} />
                        <Tooltip />
                        <ReferenceLine y={0} stroke="#6b7280" strokeWidth={2} />
                        <Line
                          type="monotone"
                          dataKey="intensity"
                          stroke="#6366f1"
                          strokeWidth={2}
                          dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">暂无数据，添加情感点开始</div>
                )}

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">添加情感点</h4>
                  {addingToChapterId ? (
                    <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">正面情绪</div>
                        <div className="flex flex-wrap gap-1">
                          {POSITIVE_EMOTIONS.map((emotion) => (
                            <button
                              key={emotion}
                              onClick={() => setNewEmotion(emotion)}
                              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                                newEmotion === emotion
                                  ? 'text-white'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                              }`}
                              style={newEmotion === emotion ? { backgroundColor: EMOTION_COLORS[emotion] } : {}}
                            >
                              {EMOTION_LABELS[emotion]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">负面情绪</div>
                        <div className="flex flex-wrap gap-1">
                          {NEGATIVE_EMOTIONS.map((emotion) => (
                            <button
                              key={emotion}
                              onClick={() => setNewEmotion(emotion)}
                              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                                newEmotion === emotion
                                  ? 'text-white'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                              }`}
                              style={newEmotion === emotion ? { backgroundColor: EMOTION_COLORS[emotion] } : {}}
                            >
                              {EMOTION_LABELS[emotion]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">强度:</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={newIntensity}
                          onChange={(e) => setNewIntensity(Number(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-8">{newIntensity}</span>
                      </div>
                      <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="备注（可选）"
                        className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAddingToChapterId(null)}
                          className="flex-1 px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        >
                          取消
                        </button>
                        <button
                          onClick={handleAddPoint}
                          className="flex-1 px-2 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          添加
                        </button>
                      </div>
                    </div>
                  ) : (
                    <select
                      value=""
                      onChange={(e) => setAddingToChapterId(e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="">选择章节添加情感点</option>
                      {allChapters.map((chapter) => (
                        <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedArc.points.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">情感点列表</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedArc.points
                        .sort((a, b) => allChapters.findIndex((c) => c.id === a.chapterId) - allChapters.findIndex((c) => c.id === b.chapterId))
                        .map((point) => {
                          const chapter = allChapters.find((c) => c.id === point.chapterId);
                          return (
                            <div
                              key={point.id}
                              className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-sm"
                            >
                              {editingPointId === point.id ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-gray-500">
                                      正在编辑: {chapter?.title || '未知章节'}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1 mb-1">
                                    {[...POSITIVE_EMOTIONS, ...NEGATIVE_EMOTIONS].map((emotion) => (
                                      <button
                                        key={emotion}
                                        onClick={() => setNewEmotion(emotion)}
                                        className={`px-1.5 py-0.5 text-xs rounded-full ${
                                          newEmotion === emotion
                                            ? 'text-white'
                                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                        }`}
                                        style={newEmotion === emotion ? { backgroundColor: EMOTION_COLORS[emotion] } : {}}
                                      >
                                        {EMOTION_LABELS[emotion]}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">强度:</span>
                                    <input
                                      type="range"
                                      min="0"
                                      max="100"
                                      value={newIntensity}
                                      onChange={(e) => setNewIntensity(Number(e.target.value))}
                                      className="flex-1 h-1"
                                    />
                                    <span className="text-xs w-6">{newIntensity}</span>
                                  </div>
                                  <input
                                    type="text"
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="备注"
                                    className="w-full px-2 py-1 text-xs border rounded dark:bg-gray-700 dark:border-gray-600"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={cancelEditing}
                                      className="flex-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                    >
                                      取消
                                    </button>
                                    <button
                                      onClick={handleUpdatePoint}
                                      className="flex-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                    >
                                      保存
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: EMOTION_COLORS[point.emotion] }}
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">
                                      {chapter?.title || '未知章节'}
                                    </span>
                                    <span className="text-gray-500">-</span>
                                    <span className="text-gray-600 dark:text-gray-400">{EMOTION_LABELS[point.emotion]}</span>
                                    <span className="text-gray-400">({point.intensity}%)</span>
                                    {point.note && (
                                      <span className="text-gray-400 text-xs italic">- {point.note}</span>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => startEditingPoint(point.id, point.emotion, point.intensity, point.note || '')}
                                      className="text-blue-600 hover:text-blue-800 text-xs"
                                    >
                                      编辑
                                    </button>
                                    <button
                                      onClick={() => deletePoint(selectedArc.id, point.id)}
                                      className="text-red-600 hover:text-red-800 text-xs"
                                    >
                                      删除
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                从左侧选择一条情感弧线查看图表
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t dark:border-gray-700 flex justify-between items-center">
          <div className="flex gap-6">
            <div className="flex gap-3">
              <span className="text-xs text-green-600 font-medium">正面</span>
              {POSITIVE_EMOTIONS.map((emotion) => (
                <div key={emotion} className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: EMOTION_COLORS[emotion] }}
                  />
                  <span className="text-xs text-gray-500">{EMOTION_LABELS[emotion]}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <span className="text-xs text-red-600 font-medium">负面</span>
              {NEGATIVE_EMOTIONS.map((emotion) => (
                <div key={emotion} className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: EMOTION_COLORS[emotion] }}
                  />
                  <span className="text-xs text-gray-500">{EMOTION_LABELS[emotion]}</span>
                </div>
              ))}
            </div>
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