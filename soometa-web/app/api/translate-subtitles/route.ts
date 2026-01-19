import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subtitles, to_lang, from_lang } = body;

    if (!subtitles || !Array.isArray(subtitles)) {
      return NextResponse.json(
        { error: 'subtitles array is required' },
        { status: 400 }
      );
    }

    if (!to_lang) {
      return NextResponse.json(
        { error: 'to_lang parameter is required' },
        { status: 400 }
      );
    }

    // Call the translation API
    const apiUrl = 'http://20.196.152.29:8888/translate-subtitles';
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subtitles,
        to_lang,
        from_lang: from_lang || '',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Translation API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to translate subtitles' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error translating subtitles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
