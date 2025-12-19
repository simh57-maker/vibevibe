/**
 * API Route: /api/insight
 * 인사이트 생성 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server';
import { groq, MODEL, INSIGHT_SYSTEM_PROMPT } from '@/lib/groq-client';
import { InsightRequest, InsightResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: InsightRequest = await request.json();
    const { brandName, images } = body;

    if (!brandName || !images || !Array.isArray(images)) {
      return NextResponse.json(
        { error: 'Brand name and images are required' },
        { status: 400 }
      );
    }

    // 이미지 설명 텍스트 생성
    const imageDescriptions = images
      .map((img, idx) => `${idx + 1}. ${img}`)
      .join('\n');

    // Groq API 호출
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: INSIGHT_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `브랜드명: ${brandName}

광고 이미지 설명:
${imageDescriptions}

위 광고 데이터를 바탕으로 3가지 관점의 인사이트를 JSON 형식으로 작성해줘.`,
        },
      ],
      model: MODEL,
      temperature: 0.8,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('No response from AI');
    }

    // JSON 파싱
    const data: InsightResponse = JSON.parse(responseText);

    // 유효성 검증
    if (!data.insights || typeof data.insights !== 'object') {
      throw new Error('Invalid response format');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Insight API Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate insights',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
