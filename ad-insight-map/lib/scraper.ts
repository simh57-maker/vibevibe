/**
 * Ad Scraper Service
 *
 * 우선순위:
 * 1. Apify API (브랜드별 실시간 광고)
 * 2. Facebook JSON 파일 (100개의 실제 광고 URL)
 * 3. 메타 광고 라이브러리 API (Access Token 필요)
 * 4. Mock 데이터 (최후의 수단)
 *
 * 설정 방법:
 * - Apify API: .env.local 파일에 APIFY_API_TOKEN 추가
 * - JSON 파일: public/data/facebook-ads.json
 * - Meta API: .env.local 파일에 META_ACCESS_TOKEN 추가
 */

import { AdImageData } from './types';
import { ApifyScraperService } from './apify-scraper';
import { MetaAdsClient } from './meta-ads-client';
import { FacebookJsonScraperService } from './facebook-json-scraper';

/**
 * ScraperService 인터페이스
 */
export interface ScraperService {
  fetchAdImages(brandName: string): Promise<AdImageData[]>;
}

/**
 * Mock Scraper Implementation
 * 브랜드별로 5~10개의 가상 광고 이미지 URL 반환
 */
export class MockScraperService implements ScraperService {
  private mockImageUrls = [
    'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552581234-26160f608093?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1507537362848-9c7e70b7b5c1?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1556155092-490a1ba16284?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1553484771-371a605b060b?w=800&h=600&fit=crop',
  ];

  private platforms: Array<'meta' | 'google' | 'naver' | 'mock'> = ['meta', 'google', 'naver', 'mock'];

  async fetchAdImages(brandName: string): Promise<AdImageData[]> {
    // 실제 API 호출 시뮬레이션 (0.5~1초 딜레이)
    await this.delay(500 + Math.random() * 500);

    // 5~10개의 랜덤 이미지 반환
    const count = 5 + Math.floor(Math.random() * 6);
    const images: AdImageData[] = [];

    for (let i = 0; i < count; i++) {
      images.push({
        url: this.mockImageUrls[i % this.mockImageUrls.length],
        description: this.generateMockDescription(brandName, i),
        platform: this.platforms[Math.floor(Math.random() * this.platforms.length)],
      });
    }

    return images;
  }

  private generateMockDescription(brandName: string, index: number): string {
    const templates = [
      `${brandName}의 신제품 출시 캠페인 - 감각적인 비주얼과 강렬한 CTA`,
      `${brandName} 브랜드 이미지 광고 - 미니멀한 디자인과 고급스러운 톤`,
      `${brandName} 프로모션 배너 - 할인율 강조 및 긴급성 메시지`,
      `${brandName} 라이프스타일 광고 - 타겟층 공감 이미지`,
      `${brandName} 제품 상세 광고 - 기능 및 혜택 중심`,
      `${brandName} 시즌 마케팅 - 계절감 있는 컬러와 메시지`,
      `${brandName} 리타겟팅 광고 - 직접적인 구매 유도`,
    ];
    return templates[index % templates.length];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Real Scraper Service
 * 우선순위: Apify API → Facebook JSON → Meta API → Mock 데이터
 */
export class RealScraperService implements ScraperService {
  private apifyService?: ApifyScraperService;
  private facebookJsonService: FacebookJsonScraperService;
  private metaClient?: MetaAdsClient;
  private mockService: MockScraperService;

  constructor() {
    // 1순위: Apify API
    const apifyToken = process.env.APIFY_API_TOKEN;
    if (apifyToken) {
      try {
        this.apifyService = new ApifyScraperService(apifyToken);
        console.log('✅ Apify API 클라이언트 초기화 완료');
      } catch (error) {
        console.error('❌ Apify API 클라이언트 초기화 실패:', error);
      }
    }

    // 2순위: Facebook JSON
    this.facebookJsonService = new FacebookJsonScraperService();

    // 3순위: Meta API
    const metaToken = process.env.META_ACCESS_TOKEN;
    if (metaToken) {
      try {
        this.metaClient = new MetaAdsClient(metaToken);
        console.log('✅ Meta API 클라이언트 초기화 완료');
      } catch (error) {
        console.error('❌ Meta API 클라이언트 초기화 실패:', error);
      }
    }

    // 4순위: Mock 데이터
    this.mockService = new MockScraperService();
  }

  async fetchAdImages(brandName: string): Promise<AdImageData[]> {
    // 1. Apify API 시도 (브랜드별 실시간 광고)
    if (this.apifyService) {
      try {
        console.log('🔍 Fetching ads from Apify for:', brandName);
        const apifyAds = await this.apifyService.fetchAdImages(brandName, 10);

        if (apifyAds.length > 0) {
          console.log(`✅ Found ${apifyAds.length} ads from Apify`);
          return apifyAds;
        }
      } catch (error) {
        console.error('❌ Apify failed, trying Facebook JSON:', error);
      }
    }

    // 2. Facebook JSON 시도 (정적 데이터)
    try {
      console.log('🔍 Fetching ads from Facebook JSON for:', brandName);
      const jsonAds = await this.facebookJsonService.fetchAdImages(brandName);

      if (jsonAds.length > 0) {
        console.log(`✅ Found ${jsonAds.length} ads from JSON file`);
        return jsonAds;
      }
    } catch (error) {
      console.error('❌ Facebook JSON failed, trying Meta API:', error);
    }

    // 3. Meta API 시도
    if (this.metaClient) {
      try {
        console.log('🔍 Meta Ad Library에서 광고 검색:', brandName);
        const metaAds = await this.metaClient.searchAds(brandName);

        if (metaAds.length > 0) {
          console.log(`✅ ${metaAds.length}개의 광고를 찾았습니다.`);
          return metaAds;
        }
      } catch (error) {
        console.error('❌ Meta API 호출 실패, Mock 데이터로 폴백:', error);
      }
    }

    // 4. Mock 데이터 폴백
    console.log('📦 Mock 데이터 사용:', brandName);
    return await this.mockService.fetchAdImages(brandName);
  }
}

// 싱글톤 인스턴스 export (RealScraperService 사용)
export const scraperService: ScraperService = new RealScraperService();
