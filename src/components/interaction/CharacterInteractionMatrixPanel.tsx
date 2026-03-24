import { useState, useEffect, useCallback } from 'react';
import { useCharacterInteractionStore, useNovelStore } from '@/stores';
import { characterRepository } from '@/services/characterRepository';
import type { RelationshipType, Character, CharacterInteraction } from '@/models';
import ForceGraph2D from 'react-force-graph-2d';

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  family: '家人',
  friendship: '朋友',
  romance: '恋人',
  enmity: '敌对',
  stranger: '陌生人',
  other: '其他',
};

const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  family: '#9333ea',
  friendship: '#3b82f6',
  romance: '#ec4899',
  enmity: '#ef4444',
  stranger: '#6b7280',
  other: '#9ca3af',
};

const RELATIONSHIP_TABS: (RelationshipType | 'all')[] = [
  'all', 'family', 'friendship', 'romance', 'enmity', 'stranger', 'other'
];

interface CharacterInteractionMatrixPanelProps {
  novelId: string;
  onClose: () => void;
}

export function CharacterInteractionMatrixPanel({ novelId, onClose }: CharacterInteractionMatrixPanelProps) {
  const {
    interactions,
    loadInteractions,
    createInteraction,
    updateRelationshipType,
    addEvent,
    deleteEvent,
    deleteInteraction,
  } = useCharacterInteractionStore();

  const { currentNovel } = useNovelStore();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [filterType, setFilterType] = useState<RelationshipType | 'all'>('all');
  const [expandedInteractionId, setExpandedInteractionId] = useState<string | null>(null);
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

  const allChapters = currentNovel?.volumes?.flatMap((v) =>
    v.chapters?.map((c) => ({ ...c, volumeTitle: v.title })) || []
  ) || [];

  const getCharacterById = useCallback((id: string): Character | undefined => {
    return characters.find((c) => c.id === id);
  }, [characters]);

  const filteredInteractions = filterType === 'all'
    ? interactions
    : interactions.filter((i) => i.relationshipType === filterType);

  const relationshipCounts = {
    all: interactions.length,
    family: interactions.filter((i) => i.relationshipType === 'family').length,
    friendship: interactions.filter((i) => i.relationshipType === 'friendship').length,
    romance: interactions.filter((i) => i.relationshipType === 'romance').length,
    enmity: interactions.filter((i) => i.relationshipType === 'enmity').length,
    stranger: interactions.filter((i) => i.relationshipType === 'stranger').length,
    other: interactions.filter((i) => i.relationshipType === 'other').length,
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
    if (!addingEventToId || !newEventChapterId || !newEventDescription) return;
    await addEvent(addingEventToId, {
      eventType: newEventType || '交流',
      chapterId: newEventChapterId,
      description: newEventDescription,
    });
    setAddingEventToId(null);
    setNewEventChapterId('');
    setNewEventType('');
    setNewEventDescription('');
  };

  const handleDeleteInteraction = async (interactionId: string) => {
    if (confirm('确定要删除这个关系吗？')) {
      deleteInteraction(interactionId);
      if (expandedInteractionId === interactionId) {
        setExpandedInteractionId(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[80vh] mx-4 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              角色关系
            </h2>
            <div className="flex gap-3 text-sm">
              {(['family', 'friendship', 'romance', 'enmity'] as RelationshipType[]).map((type) => (
                <span key={type} style={{ color: RELATIONSHIP_COLORS[type] }}>
                  {RELATIONSHIP_LABELS[type]}: {relationshipCounts[type]}
                </span>
              ))}
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

        <div className="flex items-center gap-2 p-4 border-b dark:border-gray-700">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              列表
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1.5 rounded-md text-sm ${
                viewMode === 'graph'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              图谱
            </button>
          </div>
          <div className="flex-1" />
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 overflow-x-auto">
            {RELATIONSHIP_TABS.map((status) => (
              <button
                key={status}
                onClick={() => setFilterType(status)}
                className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${
                  filterType === status
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {status === 'all' ? '全部' : RELATIONSHIP_LABELS[status]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {viewMode === 'list' ? (
            filteredInteractions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {isCreating ? '选择角色创建关系' : '暂无关系，点击下方按钮创建'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInteractions.map((interaction) => {
                  const charA = getCharacterById(interaction.characterAId);
                  const charB = getCharacterById(interaction.characterBId);
                  const isExpanded = expandedInteractionId === interaction.id;
                  const latestEvent = interaction.events && interaction.events.length > 0
                    ? interaction.events[interaction.events.length - 1]
                    : null;
                  const latestChapter = latestEvent
                    ? allChapters.find((c) => c.id === latestEvent.chapterId)
                    : null;

                  return (
                    <div
                      key={interaction.id}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden"
                    >
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setExpandedInteractionId(isExpanded ? null : interaction.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: RELATIONSHIP_COLORS[interaction.relationshipType] }}
                            />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {charA?.name || '未知'} ↔ {charB?.name || '未知'}
                            </span>
                            <span
                              className="px-2 py-0.5 text-xs rounded-full"
                              style={{
                                backgroundColor: `${RELATIONSHIP_COLORS[interaction.relationshipType]}20`,
                                color: RELATIONSHIP_COLORS[interaction.relationshipType]
                              }}
                            >
                              {RELATIONSHIP_LABELS[interaction.relationshipType]}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {latestChapter && (
                              <span className="text-xs text-gray-500">
                                最近: {latestChapter.title}
                              </span>
                            )}
                            <span className="text-gray-400">
                              {interaction.events?.length || 0} 事件
                            </span>
                            <svg
                              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t dark:border-gray-700 p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">角色 A</div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {charA?.name || '-'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">角色 B</div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {charB?.name || '-'}
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500 mb-1">关系类型</div>
                            <select
                              value={interaction.relationshipType}
                              onChange={(e) => updateRelationshipType(interaction.id, e.target.value as RelationshipType)}
                              className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                              {(Object.keys(RELATIONSHIP_LABELS) as RelationshipType[]).map((type) => (
                                <option key={type} value={type}>{RELATIONSHIP_LABELS[type]}</option>
                              ))}
                            </select>
                          </div>

                          <div className="border-t dark:border-gray-700 pt-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                互动事件 ({interaction.events?.length || 0})
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAddingEventToId(interaction.id);
                                }}
                                className="text-xs text-indigo-600 hover:text-indigo-800"
                              >
                                + 添加事件
                              </button>
                            </div>

                            {addingEventToId === interaction.id && (
                              <div className="space-y-2 mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded border dark:border-gray-600">
                                <select
                                  value={newEventChapterId}
                                  onChange={(e) => setNewEventChapterId(e.target.value)}
                                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                                  placeholder="事件类型 (如: 初次见面)"
                                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                                <input
                                  type="text"
                                  value={newEventDescription}
                                  onChange={(e) => setNewEventDescription(e.target.value)}
                                  placeholder="事件描述"
                                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAddingEventToId(null);
                                    }}
                                    className="flex-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                  >
                                    取消
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddEvent();
                                    }}
                                    disabled={!newEventChapterId || !newEventDescription}
                                    className="flex-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                                  >
                                    添加
                                  </button>
                                </div>
                              </div>
                            )}

                            {interaction.events && interaction.events.length > 0 ? (
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {interaction.events.map((event) => {
                                  const chapter = allChapters.find((c) => c.id === event.chapterId);
                                  return (
                                    <div
                                      key={event.id}
                                      className="flex items-start justify-between p-2 bg-white dark:bg-gray-800 rounded border dark:border-gray-600"
                                    >
                                      <div>
                                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                                          {event.eventType}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {chapter?.title || '未知章节'}
                                        </div>
                                        {event.description && (
                                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {event.description}
                                          </div>
                                        )}
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteEvent(interaction.id, event.id);
                                        }}
                                        className="text-gray-400 hover:text-red-600"
                                      >
                                        ×
                                      </button>
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

                          <div className="border-t dark:border-gray-700 pt-4 flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteInteraction(interaction.id);
                              }}
                              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            >
                              删除关系
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <CharacterRelationshipGraph
              interactions={filteredInteractions}
              characters={characters}
              onSelectInteraction={(id) => setExpandedInteractionId(id)}
            />
          )}
        </div>

        <div className="p-4 border-t dark:border-gray-700">
          {isCreating ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={selectedCharacterAId}
                  onChange={(e) => setSelectedCharacterAId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">选择角色 A</option>
                  {characters.map((char) => (
                    <option key={char.id} value={char.id}>{char.name}</option>
                  ))}
                </select>
                <select
                  value={selectedCharacterBId}
                  onChange={(e) => setSelectedCharacterBId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">选择角色 B</option>
                  {characters.map((char) => (
                    <option key={char.id} value={char.id}>{char.name}</option>
                  ))}
                </select>
              </div>
              <select
                value={newRelationshipType}
                onChange={(e) => setNewRelationshipType(e.target.value as RelationshipType)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {(Object.keys(RELATIONSHIP_LABELS) as RelationshipType[]).map((type) => (
                  <option key={type} value={type}>{RELATIONSHIP_LABELS[type]}</option>
                ))}
              </select>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!selectedCharacterAId || !selectedCharacterBId || selectedCharacterAId === selectedCharacterBId}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
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
              + 添加关系
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface CharacterRelationshipGraphProps {
  interactions: CharacterInteraction[];
  characters: Character[];
  onSelectInteraction: (id: string) => void;
}

function CharacterRelationshipGraph({ interactions, characters, onSelectInteraction }: CharacterRelationshipGraphProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  const getInteractionsForCharacter = (charId: string) => {
    return interactions.filter(
      (i) => i.characterAId === charId || i.characterBId === charId
    );
  };

  const getRelatedCharacterIds = (charId: string): string[] => {
    const related = new Set<string>();
    related.add(charId);
    interactions.forEach((i) => {
      if (i.characterAId === charId) related.add(i.characterBId);
      if (i.characterBId === charId) related.add(i.characterAId);
    });
    return Array.from(related);
  };

  const relatedIds = selectedCharacterId ? getRelatedCharacterIds(selectedCharacterId) : [];

  const graphData = {
    nodes: characters
      .filter((char) => !selectedCharacterId || relatedIds.includes(char.id))
      .map((char) => ({
        id: char.id,
        name: char.name,
        color: selectedCharacterId === char.id ? '#6366f1' : '#9333ea',
        val: 1 + getInteractionsForCharacter(char.id).length * 0.5,
      })),
    links: interactions
      .filter((i) => !selectedCharacterId || (i.characterAId === selectedCharacterId || i.characterBId === selectedCharacterId))
      .map((i) => ({
        source: i.characterAId,
        target: i.characterBId,
        color: RELATIONSHIP_COLORS[i.relationshipType],
        relationshipType: i.relationshipType,
        interactionId: i.id,
      })),
  };

  if (characters.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p>暂无角色数据</p>
        </div>
      </div>
    );
  }

  if (interactions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <p>暂无关系</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[400px]">
      <div className="w-full h-full bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
        <ForceGraph2D
          graphData={graphData}
          nodeLabel="name"
          nodeVal={(node: any) => node.val}
          nodeColor={(node: any) => node.color}
          linkColor={(link: any) => link.color}
          linkWidth={2}
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={0.8}
          onNodeClick={(node: any) => {
            setSelectedCharacterId(selectedCharacterId === node.id ? null : node.id);
          }}
          onLinkClick={(link: any) => {
            onSelectInteraction(link.interactionId);
          }}
          nodeCanvasObjectMode={() => 'after'}
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const label = node.name;
            const fontSize = 12 / globalScale;
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = node.color;
            ctx.fillText(label, node.x || 0, (node.y || 0) + 8);
          }}
          linkCanvasObjectMode={() => 'after'}
          linkCanvasObject={(link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const label = RELATIONSHIP_LABELS[link.relationshipType as RelationshipType];
            const fontSize = 10 / globalScale;
            
            const sourceNode = link.source as { x?: number; y?: number };
            const targetNode = link.target as { x?: number; y?: number };
            
            if (sourceNode.x === undefined || targetNode.x === undefined || sourceNode.y === undefined || targetNode.y === undefined) return;
            
            const midX = (sourceNode.x + targetNode.x) / 2;
            const midY = (sourceNode.y + targetNode.y) / 2;
            
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const textWidth = ctx.measureText(label).width;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(midX - textWidth / 2 - 2, midY - fontSize / 2 - 2, textWidth + 4, fontSize + 4);
            ctx.strokeStyle = link.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(midX - textWidth / 2 - 2, midY - fontSize / 2 - 2, textWidth + 4, fontSize + 4);
            ctx.fillStyle = link.color;
            ctx.fillText(label, midX, midY);
          }}
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />
      </div>
      <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
        <div className="text-xs text-gray-500 mb-2">关系类型</div>
        <div className="space-y-1">
          {(Object.keys(RELATIONSHIP_LABELS) as RelationshipType[]).map((type) => (
            <div key={type} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RELATIONSHIP_COLORS[type] }} />
              <span className="text-xs text-gray-600 dark:text-gray-400">{RELATIONSHIP_LABELS[type]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
        <div className="text-xs text-gray-500 mb-2">操作提示</div>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div>点击节点筛选关系</div>
          <div>点击连线查看详情</div>
          <div>拖拽节点调整布局</div>
        </div>
      </div>
    </div>
  );
}
