import { useState } from 'react';
import { useNovelStore } from '@/stores';
import type { Volume, Chapter } from '@/models';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
    reorderVolumes,
    reorderChapters,
  } = useNovelStore();

  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<{ type: 'volume' | 'chapter'; id: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = (event: DragEndEvent, volume?: Volume) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    if (!volume) {
      const oldIndex = currentNovel?.volumes?.findIndex((v) => v.id === active.id) ?? -1;
      const newIndex = currentNovel?.volumes?.findIndex((v) => v.id === over.id) ?? -1;
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(currentNovel?.volumes || [], oldIndex, newIndex);
      reorderVolumes(currentNovel!.id, newOrder.map((v) => v.id));
    } else {
      const chapters = volume.chapters || [];
      const oldIndex = chapters.findIndex((c) => c.id === active.id);
      const newIndex = chapters.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(chapters, oldIndex, newIndex);
      reorderChapters(volume.id, newOrder.map((c) => c.id));
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => handleDragEnd(e)}
          >
            <SortableContext
              items={currentNovel.volumes?.map((v) => v.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {currentNovel.volumes?.map((volume) => (
                  <VolumeItem
                    key={volume.id}
                    volume={volume}
                    isExpanded={expandedVolumes.has(volume.id)}
                    isSelected={currentVolume?.id === volume.id}
                    currentChapterId={currentChapter?.id}
                    editingId={editingId}
                    editValue={editValue}
                    onToggle={() => toggleVolume(volume.id)}
                    onSelect={() => handleVolumeClick(volume)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleDoubleClick('volume', volume);
                    }}
                    onEditChange={setEditValue}
                    onEditSubmit={handleEditSubmit}
                    onDelete={(e) => handleDelete('volume', volume.id, e)}
                    onAddChapter={() => onAddChapter(volume.id)}
                    onChapterSelect={handleChapterClick}
                    onChapterDoubleClick={(chapter) => handleDoubleClick('chapter', chapter)}
                    onChapterDelete={(e, chapterId) => handleDelete('chapter', chapterId, e)}
                    onChapterDragEnd={(e) => handleDragEnd(e, volume)}
                    sensors={sensors}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </aside>
  );
}

interface VolumeItemProps {
  volume: Volume;
  isExpanded: boolean;
  isSelected: boolean;
  currentChapterId?: string;
  editingId: { type: 'volume' | 'chapter'; id: string } | null;
  editValue: string;
  onToggle: () => void;
  onSelect: () => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onEditChange: (value: string) => void;
  onEditSubmit: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onAddChapter: () => void;
  onChapterSelect: (chapter: Chapter) => void;
  onChapterDoubleClick: (chapter: Chapter) => void;
  onChapterDelete: (e: React.MouseEvent, chapterId: string) => void;
  onChapterDragEnd: (e: DragEndEvent, volume: Volume) => void;
  sensors: ReturnType<typeof useSensors>;
}

function VolumeItem({
  volume,
  isExpanded,
  isSelected,
  currentChapterId,
  editingId,
  editValue,
  onToggle,
  onSelect,
  onDoubleClick,
  onEditChange,
  onEditSubmit,
  onDelete,
  onAddChapter,
  onChapterSelect,
  onChapterDoubleClick,
  onChapterDelete,
  onChapterDragEnd,
  sensors,
}: VolumeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: volume.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer group
          ${isSelected 
            ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        onClick={onSelect}
      >
        <button
          {...attributes}
          {...listeners}
          className="p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="p-1"
        >
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
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
            onChange={(e) => onEditChange(e.target.value)}
            onBlur={onEditSubmit}
            onKeyDown={(e) => e.key === 'Enter' && onEditSubmit()}
            className="flex-1 px-1 py-0.5 text-sm bg-white dark:bg-gray-700 border border-indigo-500 rounded"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="flex-1 text-sm font-medium truncate"
            onDoubleClick={onDoubleClick}
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
            onAddChapter();
          }}
          className="p-1 opacity-0 group-hover:opacity-100 hover:text-indigo-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        
        <button
          onClick={onDelete}
          className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {isExpanded && volume.chapters && volume.chapters.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => onChapterDragEnd(e, volume)}>
          <SortableContext
            items={volume.chapters.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="ml-6 mt-1 space-y-1">
              {volume.chapters.map((chapter) => (
                <ChapterItem
                  key={chapter.id}
                  chapter={chapter}
                  isSelected={currentChapterId === chapter.id}
                  isEditing={editingId?.type === 'chapter' && editingId?.id === chapter.id}
                  editValue={editValue}
                  onSelect={() => onChapterSelect(chapter)}
                  onDoubleClick={() => onChapterDoubleClick(chapter)}
                  onEditChange={onEditChange}
                  onEditSubmit={onEditSubmit}
                  onDelete={(e) => onChapterDelete(e, chapter.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

interface ChapterItemProps {
  chapter: Chapter;
  isSelected: boolean;
  isEditing: boolean;
  editValue: string;
  onSelect: () => void;
  onDoubleClick: () => void;
  onEditChange: (value: string) => void;
  onEditSubmit: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

function ChapterItem({
  chapter,
  isSelected,
  isEditing,
  editValue,
  onSelect,
  onDoubleClick,
  onEditChange,
  onEditSubmit,
  onDelete,
}: ChapterItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group
        ${isSelected 
          ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
      onClick={onSelect}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>
      
      {isEditing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onEditSubmit}
          onKeyDown={(e) => e.key === 'Enter' && onEditSubmit()}
          className="flex-1 px-1 py-0.5 text-sm bg-white dark:bg-gray-700 border border-indigo-500 rounded"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="flex-1 text-sm truncate pl-4"
          onDoubleClick={onDoubleClick}
        >
          📄 {chapter.title}
        </span>
      )}
      
      <button
        onClick={onDelete}
        className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-600"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
