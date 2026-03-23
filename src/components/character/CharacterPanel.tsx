import { useState, useEffect } from 'react';
import { useCharacterStore } from '@/stores';
import type { Character } from '@/models';

interface CharacterPanelProps {
  novelId: string;
  onClose: () => void;
}

export function CharacterPanel({ novelId, onClose }: CharacterPanelProps) {
  const {
    characters,
    selectedCharacterId,
    loadCharacters,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    selectCharacter,
  } = useCharacterStore();

  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    age: '',
    appearance: '',
    personality: '',
    background: '',
  });

  useEffect(() => {
    loadCharacters(novelId);
  }, [novelId, loadCharacters]);

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);

  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    await createCharacter({
      novelId,
      name: formData.name.trim(),
      gender: formData.gender.trim() || undefined,
      age: formData.age.trim() || undefined,
      appearance: formData.appearance.trim() || undefined,
      personality: formData.personality.trim() || undefined,
      background: formData.background.trim() || undefined,
    });
    resetForm();
    setIsCreating(false);
  };

  const handleUpdate = async () => {
    if (!selectedCharacterId || !formData.name.trim()) return;
    await updateCharacter(selectedCharacterId, {
      name: formData.name.trim(),
      gender: formData.gender.trim() || undefined,
      age: formData.age.trim() || undefined,
      appearance: formData.appearance.trim() || undefined,
      personality: formData.personality.trim() || undefined,
      background: formData.background.trim() || undefined,
    });
    resetForm();
    setIsEditing(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      gender: '',
      age: '',
      appearance: '',
      personality: '',
      background: '',
    });
  };

  const startEditing = (character: Character) => {
    setFormData({
      name: character.name,
      gender: character.gender || '',
      age: character.age || '',
      appearance: character.appearance || '',
      personality: character.personality || '',
      background: character.background || '',
    });
    setIsEditing(true);
    selectCharacter(character.id);
  };

  const startCreating = () => {
    resetForm();
    setIsCreating(true);
    setIsEditing(false);
  };

  const cancelForm = () => {
    resetForm();
    setIsCreating(false);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[85vh] mx-4 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            角色管理
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
          <div className="w-64 border-r dark:border-gray-700 overflow-y-auto">
            <div className="p-3 border-b dark:border-gray-700">
              <button
                onClick={startCreating}
                className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-500 hover:border-indigo-500 hover:text-indigo-500 text-sm"
              >
                + 添加角色
              </button>
            </div>

            {characters.length === 0 && !isCreating ? (
              <div className="p-4 text-sm text-gray-500 text-center">
                暂无角色
              </div>
            ) : (
              characters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => {
                    selectCharacter(character.id);
                    setIsCreating(false);
                    setIsEditing(false);
                  }}
                  className={`w-full text-left px-4 py-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedCharacterId === character.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30'
                      : ''
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {character.name}
                  </div>
                  {character.gender && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {character.gender} {character.age && `· ${character.age}`}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {isCreating || isEditing ? (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {isCreating ? '创建新角色' : '编辑角色'}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      姓名 *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="角色姓名"
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      性别
                    </label>
                    <input
                      type="text"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      placeholder="如：男、女"
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      年龄
                    </label>
                    <input
                      type="text"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="如：25岁"
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    外貌
                  </label>
                  <textarea
                    value={formData.appearance}
                    onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
                    placeholder="描述角色的外貌特征..."
                    rows={2}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    性格
                  </label>
                  <textarea
                    value={formData.personality}
                    onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                    placeholder="描述角色的性格特点..."
                    rows={2}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    背景
                  </label>
                  <textarea
                    value={formData.background}
                    onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                    placeholder="描述角色的背景故事..."
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={cancelForm}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  >
                    取消
                  </button>
                  <button
                    onClick={isCreating ? handleCreate : handleUpdate}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    {isCreating ? '创建' : '保存'}
                  </button>
                </div>
              </div>
            ) : selectedCharacter ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedCharacter.name}
                    </h3>
                    <div className="text-gray-500 mt-1">
                      {selectedCharacter.gender && <span>{selectedCharacter.gender}</span>}
                      {selectedCharacter.age && <span> · {selectedCharacter.age}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditing(selectedCharacter)}
                      className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('确定要删除这个角色吗？')) {
                          deleteCharacter(selectedCharacter.id);
                        }
                      }}
                      className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50"
                    >
                      删除
                    </button>
                  </div>
                </div>

                {selectedCharacter.appearance && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">外貌</h4>
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {selectedCharacter.appearance}
                    </p>
                  </div>
                )}

                {selectedCharacter.personality && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">性格</h4>
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {selectedCharacter.personality}
                    </p>
                  </div>
                )}

                {selectedCharacter.background && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">背景</h4>
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {selectedCharacter.background}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                选择一个角色查看详情<br />
                或点击「添加角色」创建新角色
              </div>
            )}
          </div>
        </div>

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