'use client';

/**
 * Custom Company Node Component
 * 자사 및 경쟁사 노드 컴포넌트
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Building2, Loader2 } from 'lucide-react';
import { NodeData } from '@/lib/types';
import { cn } from '@/lib/utils';

function CompanyNodeComponent({ data, selected }: NodeProps<NodeData>) {
  const isRoot = data.type === 'root';

  return (
    <div
      className={cn(
        'px-6 py-4 rounded-xl border-2 bg-white shadow-lg transition-all duration-200',
        'min-w-[280px] max-w-[320px]',
        selected
          ? 'border-blue-500 shadow-xl ring-4 ring-blue-100'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-xl',
        isRoot && 'bg-gradient-to-br from-blue-50 to-white border-blue-300'
      )}
    >
      {/* Source Handle (위쪽) */}
      {isRoot && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
        />
      )}

      {/* Target Handle (아래쪽) */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            'p-2 rounded-lg',
            isRoot ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
          )}
        >
          <Building2 className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-medium text-gray-500 uppercase">
            {isRoot ? '자사' : '경쟁사'}
          </div>
          <div className="text-lg font-bold text-gray-900 truncate">
            {data.label}
          </div>
        </div>
      </div>

      {/* Images Preview */}
      {data.images && data.images.length > 0 && (
        <div className="mb-3">
          <div className="grid grid-cols-3 gap-1.5">
            {data.images.slice(0, 6).map((img, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-md bg-gray-100 overflow-hidden"
              >
                <img
                  src={img}
                  alt={`Ad ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            {data.images.length}개의 광고 이미지
          </div>
        </div>
      )}

      {/* Analysis Status */}
      {data.isAnalyzing && (
        <div className="flex items-center gap-2 text-sm text-blue-600 mt-3 p-2 bg-blue-50 rounded-md">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>인사이트 분석 중...</span>
        </div>
      )}

      {/* Insights Indicator */}
      {data.insights && !data.isAnalyzing && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
          <div className="text-xs font-medium text-green-700">
            인사이트 분석 완료
          </div>
          <div className="text-xs text-green-600 mt-1">
            클릭하여 상세 보기
          </div>
        </div>
      )}
    </div>
  );
}

export const CompanyNode = memo(CompanyNodeComponent);
