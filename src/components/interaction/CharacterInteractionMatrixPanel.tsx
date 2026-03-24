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

  const { currentNovel } = useNovelStore();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
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

  const getCharacterById = (id: string): Character | undefined => {
    return characters.find((c) => c.id === id);
  };

  const getInteractionsForCharacter = (charId: string) => {
    return interactions.filter(
      (i) => i.characterAId === charId || i.characterBId === charId
    );
  };

  const getRelatedCharacter = (interaction: typeof interactions[0], charId: string) => {
    const relatedId = interaction.characterAId === charId ? interaction.characterBId : interaction.characterAId;
    return getCharacterById(relatedId);
  };

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

  const allChapters = currentNovel?.volumes?.flatMap((v) =>
    v.chapters?.map((c) => ({ ...c, volumeTitle: v.title })) || []
  ) || [];

  const selectedCharacter = selectedCharacterId ? getCharacterById(selectedCharacterId) : null;
  const relatedInteractions = selectedCharacterId ? getInteractionsForCharacter(selectedCharacterId) : [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] mx-4 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            角色关系网络
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
          <div className="w-64 border-r dark:border-gray-700 flex flex-col">
            <div className="p-3 border-b dark:border-gray-700">
              <button
                onClick={() => setIsCreating(true)}
                className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-500 hover:border-indigo-500 hover:text-indigo-500 text-sm"
              >
                + 添加关系
              </button>
            </div>

            {isCreating && (
              <div className="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="space-y-2">
                  <select
                    value={selectedCharacterAId}
                    onChange={(e) => setSelectedCharacterAId(e.target.value)}
                    className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">选择角色 A</option>
                    {characters.map((char) => (
                      <option key={char.id} value={char.id}>{char.name}</option>
                    ))}
                  </select>
                  <select
                    value={selectedCharacterBId}
                    onChange={(e) => setSelectedCharacterBId(e.target.value)}
                    className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">选择角色 B</option>
                    {characters.map((char) => (
                      <option key={char.id} value={char.id}>{char.name}</option>
                    ))}
                  </select>
                  <select
                    value={newRelationshipType}
                    onChange={(e) => setNewRelationshipType(e.target.value as RelationshipType)}
                    className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                  >
                    {(Object.keys(RELATIONSHIP_LABELS) as RelationshipType[]).map((type) => (
                      <option key={type} value={type}>{RELATIONSHIP_LABELS[type]}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsCreating(false)}
                      className="flex-1 px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={!selectedCharacterAId || !selectedCharacterBId || selectedCharacterAId === selectedCharacterBId}
                      className="flex-1 px-2 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                      创建
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {characters.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">
                  暂无角色，请先添加角色
                </div>
              ) : (
                <>
                  <div className="p-2 text-xs text-gray-500 border-b dark:border-gray-700">
                    点击角色查看其关系
                  </div>
                  {characters.map((char) => {
                    const charInteractions = getInteractionsForCharacter(char.id);
                    const isSelected = selectedCharacterId === char.id;
                    return (
                      <button
                        key={char.id}
                        onClick={() => setSelectedCharacterId(char.id)}
                        className={`w-full text-left px-4 py-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-900/30'
                            : ''
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {char.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {charInteractions.length} 个关系
                        </div>
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            <div className="p-3 border-t dark:border-gray-700">
              <div className="text-xs text-gray-500 mb-2">关系类型</div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(RELATIONSHIP_LABELS) as RelationshipType[]).map((type) => (
                  <div key={type} className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${RELATIONSHIP_COLORS[type]}`} />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{RELATIONSHIP_LABELS[type]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4">
              {!selectedCharacter ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p>从左侧选择角色查看其关系网络</p>
                  </div>
                </div>
              ) : relatedInteractions.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <p className="mb-2">{selectedCharacter.name} 暂无关系</p>
                    <button
                      onClick={() => {
                        setSelectedCharacterAId(selectedCharacter.id);
                        setIsCreating(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      添加第一个关系
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {selectedCharacter.name} 的关系网络
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {relatedInteractions.map((interaction) => {
                      const relatedChar = getRelatedCharacter(interaction, selectedCharacter.id);
                      const isSelected = interaction.id === selectedInteractionId;
                      return (
                        <div
                          key={interaction.id}
                          onClick={() => selectInteraction(interaction.id)}
                          className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all ${
                            isSelected
                              ? 'ring-2 ring-indigo-500'
                              : 'hover:shadow-md'
                          } ${RELATIONSHIP_BG_COLORS[interaction.relationshipType]}`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-full ${RELATIONSHIP_COLORS[interaction.relationshipType]} flex items-center justify-center text-white font-bold`}>
                              {relatedChar?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {relatedChar?.name || '未知角色'}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {RELATIONSHIP_LABELS[interaction.relationshipType]}
                              </div>
                            </div>
                          </div>
                          {interaction.events && interaction.events.length > 0 && (
                            <div className="text-xs text-gray-500">
                              {interaction.events.length} 个互动事件
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {selectedInteraction && (
              <div className="border-t dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    关系详情
                  </h4>
                  <button
                    onClick={() => deleteInteraction(selectedInteraction.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    删除关系
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">角色 A</div>
                    <div className="font-medium">{getCharacterById(selectedInteraction.characterAId)?.name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">角色 B</div>
                    <div className="font-medium">{getCharacterById(selectedInteraction.characterBId)?.name || '-'}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-1">关系类型</div>
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

                <div className="border-t dark:border-gray-700 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">互动事件</div>
                    <button
                      onClick={() => setAddingEventToId(selectedInteraction.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      + 添加事件
                    </button>
                  </div>

                  {addingEventToId === selectedInteraction.id && (
                    <div className="space-y-2 mb-3 p-3 bg-white dark:bg-gray-800 rounded border dark:border-gray-700">
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
                        value={newEventDescription}
                        onChange={(e) => setNewEventDescription(e.target.value)}
                        placeholder="事件描述"
                        className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAddingEventToId(null)}
                          className="flex-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                        >
                          取消
                        </button>
                        <button
                          onClick={handleAddEvent}
                          disabled={!newEventChapterId || !newEventDescription}
                          className="flex-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                        >
                          添加
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedInteraction.events && selectedInteraction.events.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedInteraction.events.map((event) => {
                        const chapter = allChapters.find((c) => c.id === event.chapterId);
                        return (
                          <div key={event.id} className="text-sm p-2 bg-white dark:bg-gray-800 rounded border dark:border-gray-700">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {event.eventType}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {chapter?.title || '未知章节'}
                                </div>
                              </div>
                              <button
                                onClick={() => deleteEvent(selectedInteraction.id, event.id)}
                                className="text-gray-400 hover:text-red-600"
                              >
                                ×
                              </button>
                            </div>
                            {event.description && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {event.description}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 text-center py-2">
                      暂无互动事件
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const RELATIONSHIP_BG_COLORS: Record<RelationshipType, string> = {
  family: 'bg-purple-100 dark:bg-purple-900/30',
  friendship: 'bg-blue-100 dark:bg-blue-900/30',
  romance: 'bg-pink-100 dark:bg-pink-900/30',
  enmity: 'bg-red-100 dark:bg-red-900/30',
  stranger: 'bg-gray-100 dark:bg-gray-700/50',
  other: 'bg-gray-50 dark:bg-gray-700/50',
};
