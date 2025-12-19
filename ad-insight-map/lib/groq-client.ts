/**
 * Groq API Client Configuration
 * Model: Llama3-70b-8192
 */

import Groq from 'groq-sdk';

// 환경변수에서 API 키 로드
const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.warn('⚠️ GROQ_API_KEY not found in environment variables');
}

// Groq 클라이언트 인스턴스 생성
export const groq = new Groq({
  apiKey: apiKey || '',
});

// 사용할 모델 설정 (2025년 권장 모델)
// llama3-70b-8192는 2025년 5월 31일 폐기됨
export const MODEL = 'llama-3.3-70b-versatile';

/**
 * 경쟁사 분석용 시스템 프롬프트
 */
export const COMPETITOR_SYSTEM_PROMPT = `너는 한국 시장 마켓 리서치 전문가다.
사용자가 입력한 기업에 대해 다음 기준으로 경쟁사를 분석하라:

1. 동일 산업군 (Same Industry)
2. 유사한 시장 규모 및 타겟층
3. 한국 시장 내 인지도가 있는 브랜드
4. 광고 전략 비교가 의미있는 기업

정확히 4개의 경쟁사를 JSON 포맷으로 반환하라.
각 경쟁사에 대해 선정 이유를 간단히 설명하라.

응답 형식:
{
  "competitors": [
    {
      "name": "경쟁사1",
      "reason": "선정 이유"
    },
    ...
  ]
}`;

/**
 * 인사이트 분석용 시스템 프롬프트
 */
export const INSIGHT_SYSTEM_PROMPT = `너는 디지털 마케팅 및 광고 전략 전문가다.
주어진 브랜드의 광고 이미지 설명을 바탕으로 다음 3가지 관점에서 분석 리포트를 작성하라:

1. **브랜드 관점 (Brand Perspective)**
   - 브랜드 아이덴티티 일관성
   - 브랜드 포지셔닝 전략
   - 브랜드 메시지 및 톤앤매너

2. **비주얼 & 이미지 전략 관점 (Visual Strategy)**
   - 주요 컬러 및 디자인 언어
   - 비주얼 크리에이티브 트렌드
   - 타겟 오디언스별 이미지 전략

3. **퍼포먼스 DA 세일즈 관점 (Performance Sales)**
   - CTA 및 전환 유도 전략
   - 프로모션 메시징 기법
   - 구매 유도 요소 분석

각 관점당 3~5개의 핵심 문장으로 요약하라.
전문적이면서도 실무에 바로 적용 가능한 인사이트를 제공하라.

응답 형식:
{
  "insights": {
    "brand": "브랜드 관점 분석...",
    "visual": "비주얼 전략 분석...",
    "sales": "세일즈 관점 분석..."
  }
}`;
