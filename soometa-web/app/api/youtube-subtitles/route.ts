import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get('video_id');
    const lang = searchParams.get('lang') || 'ko';

    if (!videoId) {
      return NextResponse.json(
        { error: 'video_id parameter is required' },
        { status: 400 }
      );
    }

    const apiUrl = `http://20.196.152.29:8888/subtitles?video_id=${videoId}&lang=${lang}`;

    // Call the external subtitle API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch subtitles from external API' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching subtitles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
