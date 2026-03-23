import { useState, useEffect } from 'react';
import { useResourceLedgerStore } from '@/stores';

interface ResourceLedgerPanelProps {
  novelId: string;
  onClose: () => void;
}

export function ResourceLedgerPanel({ novelId, onClose }: ResourceLedgerPanelProps) {
  const {
    resources,
    loadResources,
    createResource,
    addTransaction,
    deleteResource,
  } = useResourceLedgerStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newType, setNewType] = useState('');
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionNote, setTransactionNote] = useState('');

  useEffect(() => {
    loadResources(novelId);
  }, [novelId, loadResources]);

  const handleCreate = async () => {
    if (!newType.trim()) return;
    await createResource({ novelId, resourceType: newType.trim() });
    setNewType('');
    setIsCreating(false);
  };

  const handleAddTransaction = async () => {
    if (!selectedResource || !transactionAmount) return;
    
    await addTransaction(selectedResource, {
      resourceId: selectedResource,
      amount: parseFloat(transactionAmount),
      sourceType: 'other',
      sourceId: '',
      targetType: 'other',
      targetId: '',
      chapterId: '',
      note: transactionNote,
    });
    
    setTransactionAmount('');
    setTransactionNote('');
    loadResources(novelId);
  };

  const selected = resources.find((r) => r.id === selectedResource);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[80vh] mx-4 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            资源账本
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

        <div className="flex-1 overflow-y-auto p-4">
          {resources.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              暂无资源，点击下方按钮创建
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedResource === resource.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                  }`}
                  onClick={() => setSelectedResource(resource.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {resource.resourceType}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteResource(resource.id);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      删除
                    </button>
                  </div>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {resource.currentBalance}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    流入: {resource.totalInflow} | 流出: {resource.totalOutflow}
                  </div>
                  {resource.transactions.length > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      {resource.transactions.length} 笔交易
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {selected && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                添加交易 - {selected.resourceType}
              </h3>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(e.target.value)}
                  placeholder="数量（正数流入，负数流出）"
                  className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <input
                  type="text"
                  value={transactionNote}
                  onChange={(e) => setTransactionNote(e.target.value)}
                  placeholder="备注（可选）"
                  className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <button
                  onClick={handleAddTransaction}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  添加
                </button>
              </div>
              
              {selected.transactions.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    最近交易
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selected.transactions.slice(-5).reverse().map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className={t.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {t.amount >= 0 ? '+' : ''}{t.amount}
                        </span>
                        <span className="text-gray-500 truncate max-w-48">
                          {t.note || '无备注'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t dark:border-gray-700">
          {isCreating ? (
            <div className="flex gap-3">
              <input
                type="text"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="资源名称（如：金币、魔法石）"
                className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                autoFocus
              />
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
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-500 hover:border-indigo-500 hover:text-indigo-500"
            >
              + 添加资源类型
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
