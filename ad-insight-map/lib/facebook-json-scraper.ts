/**
 * Facebook JSON Scraper Service
 * JSON 파일에서 실제 Facebook 광고 URL을 로드하여 제공
 */

import { AdImageData } from './types';
import fs from 'fs';
import path from 'path';

interface FacebookAdEntry {
  ad_library_url: string;
}

export class FacebookJsonScraperService {
  private adsCache: FacebookAdEntry[] | null = null;

  /**
   * JSON 파일에서 광고 데이터 로드
   */
  private async loadAds(): Promise<FacebookAdEntry[]> {
    if (this.adsCache) {
      return this.adsCache;
    }

    try {
      // 서버 사이드에서 파일 시스템 경로 사용
      const filePath = path.join(process.cwd(), 'public', 'data', 'facebook-ads.json');
      const fileContents = fs.readFileSync(filePath, 'utf8');
      this.adsCache = JSON.parse(fileContents);
      console.log(`✅ Loaded ${this.adsCache?.length || 0} Facebook ads from JSON`);
      return this.adsCache!;
    } catch (error) {
      console.error('❌ Failed to load Facebook ads JSON:', error);
      return [];
    }
  }

  /**
   * 랜덤하게 N개의 광고 선택
   */
  async fetchAdImages(brandName: string, count: number = 10): Promise<AdImageData[]> {
    const allAds = await this.loadAds();

    if (allAds.length === 0) {
      console.warn('⚠️ No ads available in JSON file');
      return [];
    }

    // 랜덤하게 섞기
    const shuffled = [...allAds].sort(() => Math.random() - 0.5);

    // 요청한 개수만큼 선택
    const selected = shuffled.slice(0, Math.min(count, allAds.length));

    console.log(`✅ Selected ${selected.length} Facebook ads from JSON for ${brandName}`);

    return selected.map((ad) => ({
      url: ad.ad_library_url,
      description: `Facebook Ad - ${brandName}`,
      platform: 'facebook' as const,
    }));
  }
}
