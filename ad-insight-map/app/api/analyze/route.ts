/**
 * API Route: /api/analyze
 * 경쟁사 분석 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server';
import { groq, MODEL, COMPETITOR_SYSTEM_PROMPT } from '@/lib/groq-client';
import { CompetitorResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { companyName } = await request.json();

    if (!companyName || typeof companyName !== 'string') {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Groq API 호출
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: COMPETITOR_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `기업명: ${companyName}\n\n위 기업의 경쟁사 4곳을 분석해줘.`,
        },
      ],
      model: MODEL,
      temperature: 0.7,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('No response from AI');
    }

    // JSON 파싱
    const data: CompetitorResponse = JSON.parse(responseText);

    // 유효성 검증
    if (!data.competitors || !Array.isArray(data.competitors)) {
      throw new Error('Invalid response format');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Analyze API Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to analyze competitors',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
