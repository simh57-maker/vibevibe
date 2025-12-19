'use client';

/**
 * Company Input Component
 * 자사 이름 입력 및 경쟁사 분석 시작
 */

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { generateId, getLayoutedElements } from '@/lib/utils';
import { CompanyNode, NodeData } from '@/lib/types';
import { Edge } from 'reactflow';

export function CompanyInput() {
  const [companyName, setCompanyName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const store = useStore();
  const { setNodes, setEdges, saveCurrentLayer, createLayer } = store;

  const handleAnalyze = async () => {
    if (!companyName.trim()) {
      setError('기업명을 입력해주세요');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      // 레이어가 없으면 자동으로 생성
      let layerId = useStore.getState().currentLayerId;
      if (!layerId) {
        console.log('🆕 Creating new layer for:', companyName.trim());
        createLayer(companyName.trim());
        // 레이어 생성 직후 최신 상태 가져오기
        layerId = useStore.getState().currentLayerId;
      }

      console.log('🚀 Starting analysis for:', companyName.trim());
      console.log('📋 Current layer ID:', layerId);

      // 1. 경쟁사 분석 API 호출
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: companyName.trim() }),
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.details || '경쟁사 분석에 실패했습니다');
      }

      const analyzeData = await analyzeResponse.json();
      console.log('✅ Analysis result:', analyzeData);
      const competitors = analyzeData.competitors;

      if (!competitors || competitors.length === 0) {
        throw new Error('경쟁사를 찾을 수 없습니다');
      }

      // 2. 자사 노드 생성 (중앙)
      const rootNodeId = generateId();

      // 자사 광고 이미지 가져오기 (서버 API 통해)
      const rootImagesResponse = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName: companyName.trim() }),
      });

      if (!rootImagesResponse.ok) {
        console.warn('⚠️ Failed to fetch root company images, using empty array');
      }

      const rootImagesData = rootImagesResponse.ok
        ? await rootImagesResponse.json()
        : { images: [] };

      const rootNode: CompanyNode = {
        id: rootNodeId,
        type: 'company',
        position: { x: 0, y: 0 }, // 임시 위치 (dagre로 재계산)
        data: {
          label: companyName.trim(),
          type: 'root',
          images: rootImagesData.images || [],
        },
      };

      // 3. 경쟁사 노드 생성
      const competitorNodes: CompanyNode[] = [];
      const newEdges: Edge[] = [];

      for (let i = 0; i < competitors.length; i++) {
        const competitor = competitors[i];
        const competitorId = generateId();

        // 경쟁사 광고 이미지 수집 (서버 API 통해)
        const competitorImagesResponse = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandName: competitor.name }),
        });

        const competitorImagesData = competitorImagesResponse.ok
          ? await competitorImagesResponse.json()
          : { images: [] };

        const competitorNode: CompanyNode = {
          id: competitorId,
          type: 'company',
          position: { x: 0, y: 0 }, // 임시 위치
          data: {
            label: competitor.name,
            type: 'competitor',
            images: competitorImagesData.images || [],
          },
        };

        competitorNodes.push(competitorNode);

        // 자사 -> 경쟁사 엣지
        newEdges.push({
          id: `edge_${rootNodeId}_${competitorId}`,
          source: rootNodeId,
          target: competitorId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        });
      }

      // 4. 모든 노드 결합 및 레이아웃 계산
      const allNodes = [rootNode, ...competitorNodes];
      console.log('📊 Total nodes created:', allNodes.length);
      console.log('📊 Total edges created:', newEdges.length);

      const layoutedNodes = getLayoutedElements(allNodes, newEdges, 'TB');
      console.log('✨ Layout calculated:', layoutedNodes.length, 'nodes');

      // 5. 스토어에 추가
      setNodes(layoutedNodes);
      setEdges(newEdges);
      saveCurrentLayer();

      console.log('✅ Analysis complete! Nodes added to canvas');
      setCompanyName('');
    } catch (err) {
      console.error('❌ Analysis error:', err);
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAnalyzing) {
      handleAnalyze();
    }
  };

  return (
    <Card className="absolute top-6 left-1/2 -translate-x-1/2 z-10 shadow-xl border-2 border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="p-6 w-[480px]">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">AdInsightMap</h3>
            <p className="text-xs text-gray-500">AI 기반 광고 전략 분석 도구</p>
          </div>
        </div>

        <div className="space-y-3">
          <Input
            placeholder="분석할 기업명을 입력하세요 (예: 카카오)"
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyPress}
            disabled={isAnalyzing}
            className="text-base"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !companyName.trim()}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                경쟁사 분석 중...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                경쟁사 분석 시작
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            입력한 기업의 경쟁사 4곳을 AI가 자동으로 분석합니다
          </p>
        </div>
      </div>
    </Card>
  );
}
