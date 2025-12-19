/**
 * Apify Facebook Ads Library Scraper Service
 * Apify API를 통해 실시간으로 브랜드별 Facebook 광고 데이터를 스크래핑
 */

import { AdImageData } from './types';

interface ApifyRunResponse {
  data: {
    id: string;
    status: 'READY' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'ABORTED';
    defaultDatasetId: string;
  };
}

interface ApifyAdData {
  ad_snapshot_url?: string;
  page_name?: string;
  ad_creative_body?: string;
  ad_id?: string;
}

export class ApifyScraperService {
  private readonly apiToken: string;
  private readonly actorId = 'curious_coder/facebook-ads-library-scraper';
  private readonly baseUrl = 'https://api.apify.com/v2';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  /**
   * 브랜드명으로 Facebook 광고 검색
   */
  async fetchAdImages(brandName: string, count: number = 10): Promise<AdImageData[]> {
    try {
      console.log('🔍 Starting Apify scraper for:', brandName);

      // 1. Actor 실행
      const runId = await this.startActorRun(brandName, count);

      // 2. 완료 대기
      const datasetId = await this.waitForCompletion(runId);

      // 3. 결과 가져오기
      const ads = await this.fetchDatasetItems(datasetId);

      console.log(`✅ Apify returned ${ads.length} ads for ${brandName}`);
      return this.transformToAdImageData(ads, brandName);
    } catch (error) {
      console.error('❌ Apify scraper failed:', error);
      throw error;
    }
  }

  /**
   * Actor 실행 시작
   */
  private async startActorRun(brandName: string, count: number): Promise<string> {
    // Actor ID를 URL 형식으로 변환 (슬래시를 틸드로)
    const actorPath = this.actorId.replace('/', '~');
    const url = `${this.baseUrl}/acts/${actorPath}/runs?token=${this.apiToken}`;

    const input = {
      urls: [
        {
          url: `https://www.facebook.com/${encodeURIComponent(brandName)}`
        }
      ],
      'scrapePageAds.activeStatus': 'all',
      count,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apify API error: ${response.status} - ${errorText}`);
    }

    const result: ApifyRunResponse = await response.json();
    console.log('✅ Apify run started:', result.data.id);
    return result.data.id;
  }

  /**
   * Actor 실행 완료 대기 (폴링)
   */
  private async waitForCompletion(runId: string, maxWaitSeconds: number = 60): Promise<string> {
    const checkInterval = 2000; // 2초마다 확인
    const maxAttempts = maxWaitSeconds / (checkInterval / 1000);

    for (let i = 0; i < maxAttempts; i++) {
      const url = `${this.baseUrl}/actor-runs/${runId}?token=${this.apiToken}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to check run status: ${response.status}`);
      }

      const result: ApifyRunResponse = await response.json();
      const status = result.data.status;

      console.log(`⏳ Apify run status: ${status} (${i + 1}/${maxAttempts})`);

      if (status === 'SUCCEEDED') {
        return result.data.defaultDatasetId;
      }

      if (status === 'FAILED' || status === 'ABORTED') {
        throw new Error(`Apify run ${status}`);
      }

      // 2초 대기
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    throw new Error('Apify run timeout');
  }

  /**
   * Dataset에서 결과 가져오기
   */
  private async fetchDatasetItems(datasetId: string): Promise<ApifyAdData[]> {
    const url = `${this.baseUrl}/datasets/${datasetId}/items?token=${this.apiToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${response.status}`);
    }

    const items: ApifyAdData[] = await response.json();
    return items;
  }

  /**
   * Apify 데이터를 AdImageData로 변환
   */
  private transformToAdImageData(ads: ApifyAdData[], brandName: string): AdImageData[] {
    return ads
      .filter(ad => ad.ad_snapshot_url)
      .map(ad => ({
        url: ad.ad_snapshot_url!,
        description: ad.ad_creative_body || `${brandName} - ${ad.page_name || 'Facebook Ad'}`,
        platform: 'facebook' as const,
      }));
  }
}
