'use client';

/**
 * Right Sidebar Component
 * 선택된 노드의 인사이트 패널
 */

import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, TrendingUp, Eye, DollarSign, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RightSidebar() {
  const { nodes, selectedNodeId, setSelectedNodeId } = useStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode || !selectedNodeId) {
    return null;
  }

  const { data } = selectedNode;

  return (
    <div className="w-96 h-full bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{data.label}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {data.type === 'root' ? '자사 분석' : '경쟁사 분석'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedNodeId(null)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Images Grid */}
        {data.images && data.images.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                광고 이미지 ({data.images.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {data.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-md bg-gray-100 overflow-hidden hover:ring-2 hover:ring-blue-400 transition-all"
                  >
                    <img
                      src={img}
                      alt={`Ad ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Insights */}
        {data.insights ? (
          <>
            {/* Brand Perspective */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  브랜드 관점
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {data.insights.brand}
                </p>
              </CardContent>
            </Card>

            {/* Visual Strategy */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  비주얼 & 이미지 전략
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {data.insights.visual}
                </p>
              </CardContent>
            </Card>

            {/* Performance Sales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  퍼포먼스 DA 세일즈
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {data.insights.sales}
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="inline-flex p-4 bg-gray-200 rounded-full mb-3">
                  <TrendingUp className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">
                  {data.isAnalyzing
                    ? '인사이트를 분석하고 있습니다...'
                    : '이 노드에 대한 인사이트가 아직 생성되지 않았습니다.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
