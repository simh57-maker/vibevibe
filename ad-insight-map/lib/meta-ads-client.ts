/**
 * Meta Ad Library API Client
 *
 * 메타 광고 라이브러리에서 광고 데이터를 가져오는 클라이언트
 * API 문서: https://www.facebook.com/ads/library/api
 */

import { AdImageData } from './types';

export interface MetaAdSearchParams {
  search_terms: string;       // 브랜드명
  ad_reached_countries: string; // 국가 코드 (예: 'KR')
  ad_active_status: string;   // 'ALL', 'ACTIVE', 'INACTIVE'
  limit?: number;             // 결과 개수 (기본: 10)
}

export interface MetaAdResponse {
  data: Array<{
    id: string;
    ad_snapshot_url: string;
    ad_creative_link_captions?: string[];
    page_name?: string;
    ad_creative_body?: string;
  }>;
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

export class MetaAdsClient {
  private readonly baseUrl = 'https://graph.facebook.com/v18.0/ads_archive';
  private readonly accessToken: string;

  constructor(accessToken: string) {
    if (!accessToken) {
      throw new Error('Meta Access Token is required');
    }
    this.accessToken = accessToken;
  }

  /**
   * 브랜드명으로 광고 검색
   */
  async searchAds(brandName: string, limit: number = 10): Promise<AdImageData[]> {
    try {
      const params = new URLSearchParams({
        access_token: this.accessToken,
        search_terms: brandName,
        ad_reached_countries: 'KR',
        ad_active_status: 'ALL',
        limit: limit.toString(),
        fields: 'id,ad_snapshot_url,ad_creative_link_captions,page_name,ad_creative_body',
      });

      const url = `${this.baseUrl}?${params}`;
      console.log('🔍 Meta API 요청:', brandName);

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Meta API Error: ${response.status} ${JSON.stringify(errorData)}`
        );
      }

      const data: MetaAdResponse = await response.json();

      if (!data.data || data.data.length === 0) {
        console.warn(`⚠️ "${brandName}"에 대한 광고를 찾을 수 없습니다.`);
        return [];
      }

      console.log(`✅ Meta API: ${data.data.length}개의 광고 발견`);
      return this.transformToAdImageData(data);
    } catch (error) {
      console.error('❌ Meta API 호출 실패:', error);
      throw error;
    }
  }

  /**
   * Meta API 응답을 AdImageData 형식으로 변환
   */
  private transformToAdImageData(metaData: MetaAdResponse): AdImageData[] {
    return metaData.data.map((ad) => ({
      url: ad.ad_snapshot_url,
      description: this.generateDescription(ad),
      platform: 'meta' as const,
    }));
  }

  /**
   * 광고 설명 생성
   */
  private generateDescription(ad: MetaAdResponse['data'][0]): string {
    // 우선순위: ad_creative_body > ad_creative_link_captions > page_name
    if (ad.ad_creative_body) {
      // 너무 길면 자르기 (최대 100자)
      return ad.ad_creative_body.length > 100
        ? ad.ad_creative_body.substring(0, 100) + '...'
        : ad.ad_creative_body;
    }

    if (ad.ad_creative_link_captions && ad.ad_creative_link_captions.length > 0) {
      return ad.ad_creative_link_captions[0];
    }

    if (ad.page_name) {
      return `${ad.page_name}의 광고`;
    }

    return '광고 설명 없음';
  }

  /**
   * API 연결 테스트
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.searchAds('test', 1);
      return true;
    } catch (error) {
      return false;
    }
  }
}
