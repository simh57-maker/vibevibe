/**
 * AdInsightMap Type Definitions
 */

import { Node, Edge } from 'reactflow';

// Insight 데이터 타입 (3가지 관점)
export type InsightType = {
  brand: string;      // 브랜드 관점
  visual: string;     // 비주얼 & 이미지 전략 관점
  sales: string;      // 퍼포먼스 DA 세일즈 관점
};

// 노드 데이터 타입
export type NodeData = {
  label: string;                // 기업명
  type: 'root' | 'competitor';  // 자사 vs 경쟁사
  images: string[];             // 광고 이미지 URL 목록
  insights?: InsightType;       // AI 분석 결과 (선택적)
  isAnalyzing?: boolean;        // 분석 중 상태
};

// 커스텀 노드 타입
export type CompanyNode = Node<NodeData>;

// 레이어(세션) 타입
export type Layer = {
  id: string;
  name: string;
  companyName: string;
  createdAt: number;
  nodes: CompanyNode[];
  edges: Edge[];
};

// 경쟁사 분석 응답 타입
export type CompetitorResponse = {
  competitors: Array<{
    name: string;
    reason: string;
  }>;
};

// 인사이트 분석 요청 타입
export type InsightRequest = {
  brandName: string;
  images: string[];
};

// 인사이트 분석 응답 타입
export type InsightResponse = {
  insights: InsightType;
};

// 광고 이미지 데이터
export type AdImageData = {
  url: string;
  description: string;
  platform: 'meta' | 'google' | 'naver' | 'facebook' | 'mock';
};
