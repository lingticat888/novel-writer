import { useState, useEffect } from 'react';
import { useCharacterInteractionStore, useNovelStore } from '@/stores';
import { characterRepository } from '@/services/characterRepository';
import type { RelationshipType, Character } from '@/models';

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  family: '家人',
  friendship: '朋友',
  romance: '恋人',
  enmity: '敌对',
  stranger: '陌生人',
  other: '其他',
};

const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  family: 'bg-purple-500',
  friendship: 'bg-blue-500',
  romance: 'bg-pink-500',
  enmity: 'bg-red-500',
  stranger: 'bg-gray-400',
  other: 'bg-gray-300',
};

const RELATIONSHIP_BG_COLORS: Record<RelationshipType, string> = {
  family: 'bg-purple-100 dark:bg-purple-900/30',
  friendship: 'bg-blue-100 dark:bg-blue-900/30',
  romance: 'bg-pink-100 dark:bg-pink-900/30',
  enmity: 'bg-red-100 dark:bg-red-900/30',
  stranger: 'bg-gray-100 dark:bg-gray-700/50',
  other: 'bg-gray-50 dark:bg-gray-700/50',
};

interface CharacterInteractionMatrixPanelProps {
  novelId: string;
  onClose: () => void;
}

export function CharacterInteractionMatrixPanel({ novelId, onClose }: CharacterInteractionMatrixPanelProps) {
  const {
    interactions,
    selectedInteractionId,
    loadInteractions,
    createInteraction,
    updateRelationshipType,
    addEvent,
    deleteEvent,
    deleteInteraction,
    selectInteraction,
  } = useCharacterInteractionStore();

  const { currentChapter } = useNovelStore();

  const [characters, setCharacters] = useState<Character[]>([]);

  const [isCreating, setIsCreating] = useState(false);
  const [selectedCharacterAId, setSelectedCharacterAId] = useState('');
  const [selectedCharacterBId, setSelectedCharacterBId] = useState('');
  const [newRelationshipType, setNewRelationshipType] = useState<RelationshipType>('stranger');
  
  const [addingEventToId, setAddingEventToId] = useState<string | null>(null);
  const [newEventChapterId, setNewEventChapterId] = useState('');
  const [newEventType, setNewEventType] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');

  useEffect(() => {
    loadInteractions(novelId);
    characterRepository.findByNovelId(novelId).then(setCharacters);
  }, [novelId, loadInteractions]);

  const selectedInteraction = interactions.find((i) => i.id === selectedInteractionId);

  const handleCreate = async () => {
    if (!selectedCharacterAId || !selectedCharacterBId || selectedCharacterAId === selectedCharacterBId) return;
    
    await createInteraction({
      novelId,
      characterAId: selectedCharacterAId,
      characterBId: selectedCharacterBId,
      relationshipType: newRelationshipType,
    });
    
    setSelectedCharacterAId('');
    setSelectedCharacterBId('');
    setNewRelationshipType('stranger');
    setIsCreating(false);
  };

  const handleAddEvent = async () => {
    if (!selectedInteractionId || !newEventChapterId || !newEventDescription) return;
    
    await addEvent(selectedInteractionId, {
      eventType: newEventType || '交流',
      chapterId: newEventChapterId,
      description: newEventDescription,
    });
    
    setAddingEventToId(null);
    setNewEventChapterId('');
    setNewEventType('');
    setNewEventDescription('');
  };

  const getCharacterById = (id: string): Character | undefined => {
    return characters.find((c) => c.id === id);
  };

  const getInteraction = (charAId: string, charBId: string): typeof interactions[0] | undefined => {
    return interactions.find(
      (i) =>
        (i.characterAId === charAId && i.characterBId === charBId) ||
        (i.characterAId === charBId && i.characterBId === charAId)
    );
  };

  const getInteractionColor = (charAId: string, charBId: string): string => {
    const interaction = getInteraction(charAId, charBId);
    if (!interaction) return '';
    return RELATIONSHIP_COLORS[interaction.relationshipType];
  };

  const allChapters = currentNovel?.volumes?.flatMap((v) =>
    v.chapters?.map((c) => ({ ...c, volumeTitle: v.title })) || []
  ) || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] mx-4 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            角色交互矩阵
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

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-4 overflow-auto">
            {characters.length < 2 ? (
              <div className="text-center py-12 text-gray-500">
                需要至少2个角色才能使用交互矩阵。<br />
                请先在「世界」面板中添加角色。
              </div>
            ) : (
              <>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">角色关系矩阵</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-left text-xs font-medium text-gray-500 border"></th>
                        {characters.map((char) => (
                          <th key={char.id} className="p-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300 border min-w-20">
                            <div className="truncate max-w-20">{char.name}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {characters.map((charA) => (
                        <tr key={charA.id}>
                          <td className="p-2 text-xs font-medium text-gray-700 dark:text-gray-300 border">
                            <div className="truncate max-w-20">{charA.name}</div>
                          </td>
                          {characters.map((charB) => {
                            if (charA.id === charB.id) {
                              return (
                                <td key={charB.id} className="p-1 border bg-gray-50 dark:bg-gray-800">
                                  <div className="w-8 h-8 mx-auto flex items-center justify-center text-gray-400">
                                    •
                                  </div>
                                </td>
                              );
                            }
                            
                            const interaction = getInteraction(charA.id, charB.id);
                            const isSelected = interaction?.id === selectedInteractionId;
                            
                            return (
                              <td
                                key={charB.id}
                                className={`p-1 border cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'ring-2 ring-indigo-500'
                                    : interaction
                                    ? RELATIONSHIP_BG_COLORS[interaction.relationshipType]
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                                onClick={() => interaction && selectInteraction(interaction.id)}
                              >
                                <div className="flex flex-col items-center justify-center h-full">
                                  {interaction ? (
                                    <>
                                      <div className={`w-6 h-6 rounded-full ${getInteractionColor(charA.id, charB.id)}`} />
                                      <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                                        {RELATIONSHIP_LABELS[interaction.relationshipType]}
                                      </span>
                                    </>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCharacterAId(charA.id);
                                        setSelectedCharacterBId(charB.id);
                                        setIsCreating(true);
                                      }}
                                      className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
                                    >
                                      +
                                    </button>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {(Object.keys(RELATIONSHIP_LABELS) as RelationshipType[]).map((type) => (
                    <div key={type} className="flex items-center gap-1">
                      <span className={`w-3 h-3 rounded-full ${RELATIONSHIP_COLORS[type]}`} />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{RELATIONSHIP_LABELS[type]}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="w-80 border-l dark:border-gray-700 flex flex-col overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {selectedInteraction ? '交互详情' : '请选择一对角色'}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {selectedInteraction ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {getCharacterById(selectedInteraction.characterAId)?.name}
                      </span>
                      <span className="text-gray-400">↔</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {getCharacterById(selectedInteraction.characterBId)?.name}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteInteraction(selectedInteraction.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      删除
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      关系类型
                    </label>
                    <select
                      value={selectedInteraction.relationshipType}
                      onChange={(e) => updateRelationshipType(selectedInteraction.id, e.target.value as RelationshipType)}
                      className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                    >
                      {(Object.keys(RELATIONSHIP_LABELS) as RelationshipType[]).map((type) => (
                        <option key={type} value={type}>{RELATIONSHIP_LABELS[type]}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        交互事件 ({selectedInteraction.events.length})
                      </label>
                      {addingEventToId !== selectedInteraction.id && (
                        <button
                          onClick={() => {
                            setAddingEventToId(selectedInteraction.id);
                            setNewEventChapterId(currentChapter?.id || '');
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          + 添加事件
                        </button>
                      )}
                    </div>

                    {addingEventToId === selectedInteraction.id ? (
                      <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <select
                          value={newEventChapterId}
                          onChange={(e) => setNewEventChapterId(e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                        >
                          <option value="">选择章节</option>
                          {allChapters.map((ch) => (
                            <option key={ch.id} value={ch.id}>{ch.title}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={newEventType}
                          onChange={(e) => setNewEventType(e.target.value)}
                          placeholder="事件类型（如：对话、战斗）"
                          className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                        />
                        <textarea
                          value={newEventDescription}
                          onChange={(e) => setNewEventDescription(e.target.value)}
                          placeholder="事件描述"
                          rows={2}
                          className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setAddingEventToId(null)}
                            className="flex-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleAddEvent}
                            className="flex-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                          >
                            添加
                          </button>
                        </div>
                      </div>
                    ) : selectedInteraction.events.length === 0 ? (
                      <div className="text-sm text-gray-400 text-center py-4">
                        暂无交互事件
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedInteraction.events
                          .sort((a, b) => allChapters.findIndex((c) => c.id === a.chapterId) - allChapters.findIndex((c) => c.id === b.chapterId))
                          .map((event) => {
                            const chapter = allChapters.find((c) => c.id === event.chapterId);
                            return (
                              <div
                                key={event.id}
                                className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-sm"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-500">
                                    {chapter?.title || '未知章节'}
                                    {event.eventType && ` - ${event.eventType}`}
                                  </span>
                                  <button
                                    onClick={() => deleteEvent(selectedInteraction.id, event.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    ×
                                  </button>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300">{event.description}</p>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  点击矩阵中的单元格查看或创建关系
                </div>
              )}
            </div>
          </div>
        </div>

        {isCreating && (
          <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">创建新关系</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedCharacterAId}
                onChange={(e) => setSelectedCharacterAId(e.target.value)}
                className="flex-1 min-w-24 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">选择角色 A</option>
                {characters.map((char) => (
                  <option key={char.id} value={char.id}>{char.name}</option>
                ))}
              </select>
              <span className="text-gray-400">↔</span>
              <select
                value={selectedCharacterBId}
                onChange={(e) => setSelectedCharacterBId(e.target.value)}
                className="flex-1 min-w-24 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">选择角色 B</option>
                {characters.map((char) => (
                  <option key={char.id} value={char.id}>{char.name}</option>
                ))}
              </select>
              <select
                value={newRelationshipType}
                onChange={(e) => setNewRelationshipType(e.target.value as RelationshipType)}
                className="flex-1 min-w-24 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                {(Object.keys(RELATIONSHIP_LABELS) as RelationshipType[]).map((type) => (
                  <option key={type} value={type}>{RELATIONSHIP_LABELS[type]}</option>
                ))}
              </select>
              <button
                onClick={handleCreate}
                disabled={!selectedCharacterAId || !selectedCharacterBId || selectedCharacterAId === selectedCharacterBId}
                className="px-4 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                创建
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className="p-4 border-t dark:border-gray-700 flex justify-end">
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