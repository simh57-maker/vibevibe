'use client';

/**
 * Left Sidebar Component
 * 레이어(세션) 목록 관리
 */

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Layers, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LeftSidebar() {
  const [isAddingLayer, setIsAddingLayer] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');

  const {
    layers,
    currentLayerId,
    createLayer,
    deleteLayer,
    switchLayer,
  } = useStore();

  const handleCreateLayer = () => {
    if (!newCompanyName.trim()) return;

    createLayer(newCompanyName.trim());
    setNewCompanyName('');
    setIsAddingLayer(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateLayer();
    } else if (e.key === 'Escape') {
      setIsAddingLayer(false);
      setNewCompanyName('');
    }
  };

  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Layers className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">분석 세션</h2>
            <p className="text-xs text-gray-500">기업별 광고 인사이트</p>
          </div>
        </div>

        {/* Add New Layer Button */}
        {!isAddingLayer ? (
          <Button
            onClick={() => setIsAddingLayer(true)}
            className="w-full"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            새 분석 시작
          </Button>
        ) : (
          <div className="space-y-2">
            <Input
              placeholder="기업명 입력 (예: 카카오)"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              onKeyDown={handleKeyPress}
              autoFocus
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleCreateLayer}
                size="sm"
                className="flex-1"
                disabled={!newCompanyName.trim()}
              >
                생성
              </Button>
              <Button
                onClick={() => {
                  setIsAddingLayer(false);
                  setNewCompanyName('');
                }}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                취소
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {layers.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              분석할 기업을 추가해보세요
            </p>
          </div>
        ) : (
          layers.map((layer) => (
            <Card
              key={layer.id}
              className={cn(
                'p-4 cursor-pointer transition-all duration-200 hover:shadow-md',
                currentLayerId === layer.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              )}
              onClick={() => switchLayer(layer.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">
                    {layer.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {layer.companyName}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">
                      {layer.nodes.length} 노드
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(layer.createdAt).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('이 세션을 삭제하시겠습니까?')) {
                      deleteLayer(layer.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          AdInsightMap v1.0
        </p>
      </div>
    </div>
  );
}
