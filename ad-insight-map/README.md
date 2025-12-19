# AdInsightMap

> AI 기반 광고 전략 분석 도구 - 경쟁사의 광고 인사이트를 노드 기반 마인드맵으로 시각화

## 프로젝트 개요

AdInsightMap은 Next.js 14, TypeScript, React Flow, Groq AI를 활용한 웹 애플리케이션입니다.
사용자가 입력한 기업을 분석하고, 경쟁사를 자동으로 탐색하여 광고 전략 인사이트를 **구글 NotebookLM과 유사한 노드 기반 마인드맵 인터페이스**로 시각화합니다.

## 주요 기능

- **AI 기반 경쟁사 분석**: Groq API(Llama3-70b-8192)를 사용하여 자동으로 경쟁사 4곳 도출
- **노드 기반 시각화**: React Flow를 활용한 직관적인 마인드맵 인터페이스
- **광고 인사이트 분석**: 3가지 관점(브랜드, 비주얼, 세일즈)에서 광고 전략 분석
- **레이어 관리**: 여러 기업 분석을 세션별로 관리 가능
- **자동 레이아웃**: Dagre 알고리즘을 사용한 노드 자동 배치

## 기술 스택

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Visualization**: React Flow
- **State Management**: Zustand
- **AI Provider**: Groq API (Llama3-70b-8192)
- **Icons**: Lucide React
- **Layout**: Dagre

## 시작하기

### 1. 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 Groq API 키를 입력하세요:

```env
GROQ_API_KEY=your_groq_api_key_here
```

**Groq API 키 발급**: [https://console.groq.com/keys](https://console.groq.com/keys)

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

## 사용 방법

1. **새 분석 세션 시작**: 왼쪽 사이드바에서 "새 분석 시작" 클릭
2. **기업명 입력**: 분석할 기업 이름 입력 (예: 카카오, 네이버 등)
3. **경쟁사 자동 분석**: AI가 자동으로 경쟁사 4곳을 찾아 노드 생성
4. **인사이트 확인**: 노드 클릭 시 우측 패널에서 상세 인사이트 확인

## 프로젝트 구조

```
ad-insight-map/
├── app/
│   ├── api/
│   │   ├── analyze/         # 경쟁사 분석 API
│   │   └── insight/         # 인사이트 생성 API
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx             # 메인 페이지
├── components/
│   ├── flow/
│   │   └── CompanyNode.tsx  # 커스텀 노드 컴포넌트
│   ├── ui/                  # shadcn/ui 컴포넌트
│   ├── CompanyInput.tsx     # 입력 폼
│   ├── FlowCanvas.tsx       # React Flow 캔버스
│   ├── LeftSidebar.tsx      # 레이어 관리 사이드바
│   └── RightSidebar.tsx     # 인사이트 패널
├── lib/
│   ├── groq-client.ts       # Groq API 클라이언트
│   ├── scraper.ts           # Mock 스크래퍼 서비스
│   ├── store.ts             # Zustand 스토어
│   ├── types.ts             # TypeScript 타입 정의
│   └── utils.ts             # 유틸리티 함수
└── package.json
```

## 주요 컴포넌트 설명

### 1. React Flow Canvas (`FlowCanvas.tsx`)
- 노드 기반 마인드맵 시각화
- 자동 레이아웃 및 줌/팬 기능
- 노드 클릭 시 자동 인사이트 생성

### 2. Zustand Store (`lib/store.ts`)
- 노드, 엣지, 레이어 전역 상태 관리
- 레이어 생성/삭제/전환 기능

### 3. Groq Client (`lib/groq-client.ts`)
- Llama3-70b-8192 모델 사용
- 경쟁사 분석 및 인사이트 생성

### 4. Mock Scraper (`lib/scraper.ts`)
- 현재는 더미 이미지 반환
- 추후 Apify 등 실제 크롤러 API로 교체 가능

## API 엔드포인트

### POST `/api/analyze`
경쟁사 분석

**Request Body:**
```json
{
  "companyName": "카카오"
}
```

**Response:**
```json
{
  "competitors": [
    {
      "name": "네이버",
      "reason": "동일 산업군의 대표 기업..."
    }
  ]
}
```

### POST `/api/insight`
인사이트 생성

**Request Body:**
```json
{
  "brandName": "카카오",
  "images": ["이미지 설명1", "이미지 설명2"]
}
```

**Response:**
```json
{
  "insights": {
    "brand": "브랜드 관점 분석...",
    "visual": "비주얼 전략 분석...",
    "sales": "세일즈 관점 분석..."
  }
}
```

## 향후 개선 사항

- [ ] 실제 광고 스크래핑 API 연동 (Apify, Meta Ads API 등)
- [ ] 인사이트 내보내기 기능 (PDF, PNG)
- [ ] 노드 커스터마이징 옵션
- [ ] 다크모드 지원
- [ ] 분석 히스토리 저장 (데이터베이스 연동)

## 라이선스

MIT

## 개발자

Created with [Claude Code](https://claude.com/claude-code)
