import { useState } from 'react';
import { useWorldStateStore } from '@/stores';
import type { WorldCategory } from '@/models';

const CATEGORY_LABELS: Record<WorldCategory, string> = {
  geography: '地理',
  politics: '政治',
  magic: '魔法/科技',
  culture: '文化',
  economy: '经济',
  history: '历史',
  other: '其他',
};

const CATEGORIES: WorldCategory[] = [
  'geography', 'politics', 'magic', 'culture', 'economy', 'history', 'other'
];

interface WorldStatePanelProps {
  novelId: string;
  onClose: () => void;
}

export function WorldStatePanel({ novelId, onClose }: WorldStatePanelProps) {
  const {
    worldStates,
    selectedCategory,
    loadWorldStates,
    createWorldState,
    deleteWorldState,
    setSelectedCategory,
  } = useWorldStateStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<WorldCategory>('other');
  const [newDescription, setNewDescription] = useState('');

  useState(() => {
    loadWorldStates(novelId);
  });

  const handleCreate = async () => {
    if (!newName.trim()) return;
    
    await createWorldState({
      novelId,
      category: newCategory,
      name: newName.trim(),
      description: newDescription.trim(),
    });
    
    setNewName('');
    setNewDescription('');
    setIsCreating(false);
  };

  const filteredStates = selectedCategory === 'all'
    ? worldStates
    : worldStates.filter((ws) => ws.category === selectedCategory);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[80vh] mx-4 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            世界状态管理
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

        <div className="flex gap-2 p-4 border-b dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            全部
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredStates.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {isCreating ? '创建新的世界状态' : '暂无世界状态，点击下方按钮创建'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStates.map((ws) => (
                <div
                  key={ws.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">
                        {CATEGORY_LABELS[ws.category]}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {ws.name}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteWorldState(ws.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      删除
                    </button>
                  </div>
                  {ws.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {ws.description}
                    </p>
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
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="名称"
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="描述（可选）"
                rows={2}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <div className="flex gap-2">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as WorldCategory)}
                  className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
                <div className="flex-1" />
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
              + 添加世界状态
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
