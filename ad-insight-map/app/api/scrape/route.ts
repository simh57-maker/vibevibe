/**
 * API Route: /api/scrape
 * 광고 이미지 스크래핑 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server';
import { scraperService } from '@/lib/scraper';

export async function POST(request: NextRequest) {
  try {
    const { brandName } = await request.json();

    if (!brandName || typeof brandName !== 'string') {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Scraping ads for:', brandName);

    // 광고 이미지 가져오기
    const images = await scraperService.fetchAdImages(brandName);

    console.log(`✅ Found ${images.length} ads for ${brandName}`);

    return NextResponse.json({
      brandName,
      images: images.map((img) => img.url),
    });
  } catch (error) {
    console.error('Scrape API Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to scrape ads',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
