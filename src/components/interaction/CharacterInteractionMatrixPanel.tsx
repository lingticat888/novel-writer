import { useState, useEffect, useRef, useCallback } from 'react';
import { useCharacterInteractionStore, useNovelStore } from '@/stores';
import { characterRepository } from '@/services/characterRepository';
import type { RelationshipType, Character } from '@/models';
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

interface GraphNode {
  id: string;
  name: string;
  color: string;
  val: number;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  color: string;
  relationshipType: RelationshipType;
  interactionId: string;
}

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
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  
  const [addingEventToId, setAddingEventToId] = useState<string | null>(null);
  const [newEventChapterId, setNewEventChapterId] = useState('');
  const [newEventType, setNewEventType] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');

  const graphRef = useRef<{ centerAt: (x: number, y: number, ms: number) => void; zoom: (k: number, ms: number) => void } | undefined>(undefined);

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

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedCharacterId(node.id);
    selectInteraction(null);
  }, [selectInteraction]);

  const handleLinkClick = useCallback((link: GraphLink) => {
    selectInteraction(link.interactionId);
    setSelectedCharacterId(null);
  }, [selectInteraction]);

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
          <div className="w-96 flex-shrink-0 border-r dark:border-gray-700 flex flex-col overflow-hidden">
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
                    点击节点查看关系网络
                  </div>
                  {characters.map((char) => {
                    const charInteractions = getInteractionsForCharacter(char.id);
                    const isSelected = selectedCharacterId === char.id;
                    return (
                      <button
                        key={char.id}
                        onClick={() => {
                          setSelectedCharacterId(char.id);
                          selectInteraction(null);
                        }}
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
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RELATIONSHIP_COLORS[type] }} />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{RELATIONSHIP_LABELS[type]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 relative bg-gray-50 dark:bg-gray-900">
            {characters.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>暂无角色数据</p>
                </div>
              </div>
            ) : interactions.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <p>暂无关系，点击左侧添加关系</p>
                </div>
              </div>
            ) : (
              <>
                <ForceGraph2D
                  ref={graphRef as any}
                  graphData={graphData}
                  nodeLabel="name"
                  nodeVal={(node: GraphNode) => node.val}
                  nodeColor={(node: GraphNode) => node.color as string}
                  linkColor={(link: any) => link.color}
                  linkWidth={(link: any) => selectedInteractionId === link.interactionId ? 4 : 2}
                  linkDirectionalArrowLength={6}
                  linkDirectionalArrowRelPos={0.8}
                  onNodeClick={(node: GraphNode) => handleNodeClick(node)}
                  onLinkClick={(link: any) => handleLinkClick(link)}
                  nodeCanvasObjectMode={() => 'after'}
                  nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                    const label = node.name;
                    const fontSize = 12 / globalScale;
                    ctx.font = `bold ${fontSize}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = node.color as string;
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
                <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
                  <div className="text-xs text-gray-500 mb-2">操作提示</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div>• 点击节点查看该角色的关系</div>
                    <div>• 点击连线查看关系详情</div>
                    <div>• 拖拽节点调整布局</div>
                    <div>• 滚轮缩放</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {selectedInteraction && !isPanelCollapsed && (
            <div className="w-80 border-l dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  关系详情
                </h4>
                <button
                  onClick={() => setIsPanelCollapsed(true)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">角色 A</div>
                    <div className="font-medium">{getCharacterById(selectedInteraction.characterAId)?.name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">角色 B</div>
                    <div className="font-medium">{getCharacterById(selectedInteraction.characterBId)?.name || '-'}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">关系类型</div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: RELATIONSHIP_COLORS[selectedInteraction.relationshipType] }}
                    />
                    <select
                      value={selectedInteraction.relationshipType}
                      onChange={(e) => updateRelationshipType(selectedInteraction.id, e.target.value as RelationshipType)}
                      className="flex-1 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                    >
                      {(Object.keys(RELATIONSHIP_LABELS) as RelationshipType[]).map((type) => (
                        <option key={type} value={type}>{RELATIONSHIP_LABELS[type]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t dark:border-gray-700 pt-4">
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
                    <div className="space-y-2 mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded border dark:border-gray-700">
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
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedInteraction.events.map((event) => {
                        const chapter = allChapters.find((c) => c.id === event.chapterId);
                        return (
                          <div key={event.id} className="text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded border dark:border-gray-700">
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

              <div className="p-4 border-t dark:border-gray-700">
                <button
                  onClick={() => {
                    if (confirm('确定要删除这个关系吗？')) {
                      deleteInteraction(selectedInteraction.id);
                    }
                  }}
                  className="w-full py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  删除关系
                </button>
              </div>
            </div>
          )}

          {isPanelCollapsed && (
            <button
              onClick={() => setIsPanelCollapsed(false)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-indigo-600 text-white px-2 py-4 rounded-l-lg shadow-lg"
            >
              显示详情
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
