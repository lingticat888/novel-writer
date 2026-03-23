import { useState } from 'react';
import { useNovelStore } from '@/stores';
import type { Volume, Chapter } from '@/models';

interface SidebarProps {
  onAddVolume: () => void;
  onAddChapter: (volumeId: string) => void;
}

export function Sidebar({ onAddVolume, onAddChapter }: SidebarProps) {
  const { 
    currentNovel, 
    currentVolume, 
    currentChapter,
    selectVolume,
    selectChapter,
    updateVolume,
    updateChapter,
    deleteVolume,
    deleteChapter,
  } = useNovelStore();

  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<{ type: 'volume' | 'chapter'; id: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const toggleVolume = (volumeId: string) => {
    const newExpanded = new Set(expandedVolumes);
    if (newExpanded.has(volumeId)) {
      newExpanded.delete(volumeId);
    } else {
      newExpanded.add(volumeId);
    }
    setExpandedVolumes(newExpanded);
  };

  const handleVolumeClick = (volume: Volume) => {
    selectVolume(volume);
    if (!expandedVolumes.has(volume.id)) {
      toggleVolume(volume.id);
    }
  };

  const handleChapterClick = (chapter: Chapter) => {
    selectChapter(chapter);
    selectVolume(currentVolume);
  };

  const handleDoubleClick = (type: 'volume' | 'chapter', item: Volume | Chapter) => {
    setEditingId({ type, id: item.id });
    setEditValue(item.title);
  };

  const handleEditSubmit = async () => {
    if (!editingId || !editValue.trim()) {
      setEditingId(null);
      return;
    }

    if (editingId.type === 'volume') {
      await updateVolume(editingId.id, { title: editValue.trim() });
    } else {
      await updateChapter(editingId.id, { title: editValue.trim() });
    }
    setEditingId(null);
  };

  const handleDelete = async (type: 'volume' | 'chapter', id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`确定要删除这个${type === 'volume' ? '卷' : '章节'}吗？`)) {
      if (type === 'volume') {
        await deleteVolume(id);
      } else {
        await deleteChapter(id);
      }
    }
  };

  if (!currentNovel) return null;

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onAddVolume}
          className="w-full px-3 py-2 text-sm bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 
                     rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/40 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加卷
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {currentNovel.volumes?.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
            点击上方按钮添加第一卷
          </p>
        ) : (
          <div className="space-y-1">
            {currentNovel.volumes.map((volume) => (
              <div key={volume.id}>
                <div
                  className={`flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer group
                    ${currentVolume?.id === volume.id 
                      ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  onClick={() => handleVolumeClick(volume)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVolume(volume.id);
                    }}
                    className="p-1"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${expandedVolumes.has(volume.id) ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {editingId?.type === 'volume' && editingId.id === volume.id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleEditSubmit}
                      onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
                      className="flex-1 px-1 py-0.5 text-sm bg-white dark:bg-gray-700 border border-indigo-500 rounded"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="flex-1 text-sm font-medium truncate"
                      onDoubleClick={() => handleDoubleClick('volume', volume)}
                    >
                      📁 {volume.title}
                    </span>
                  )}
                  
                  <span className="text-xs text-gray-400">
                    {volume.chapters?.length || 0}
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddChapter(volume.id);
                    }}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:text-indigo-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={(e) => handleDelete('volume', volume.id, e)}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {expandedVolumes.has(volume.id) && volume.chapters && (
                  <div className="ml-6 mt-1 space-y-1">
                    {volume.chapters.map((chapter) => (
                      <div
                        key={chapter.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group
                          ${currentChapter?.id === chapter.id 
                            ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        onClick={() => handleChapterClick(chapter)}
                      >
                        {editingId?.type === 'chapter' && editingId.id === chapter.id ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleEditSubmit}
                            onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
                            className="flex-1 px-1 py-0.5 text-sm bg-white dark:bg-gray-700 border border-indigo-500 rounded"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span
                            className="flex-1 text-sm truncate pl-4"
                            onDoubleClick={() => handleDoubleClick('chapter', chapter)}
                          >
                            📄 {chapter.title}
                          </span>
                        )}
                        
                        <button
                          onClick={(e) => handleDelete('chapter', chapter.id, e)}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-600"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
