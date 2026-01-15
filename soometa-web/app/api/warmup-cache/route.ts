// app/api/warmup-cache/route.ts
import { NextResponse } from 'next/server';
import { getAllExams, getCacheStats } from '@/lib/examDataCache';
import { getAllDocuments, getDocumentCacheStats } from '@/lib/documentDataCache';

/**
 * API route to warm up both exam and document data caches
 * Called by ExamDataPreloader on app startup
 */
export async function POST() {
  try {
    // Load both caches in parallel for maximum speed
    const [exams, documents] = await Promise.all([
      getAllExams(),
      getAllDocuments(),
    ]);

    const examStats = getCacheStats();
    const documentStats = getDocumentCacheStats();

    return NextResponse.json({
      success: true,
      message: 'All caches warmed up successfully',
      examsCount: exams.length,
      documentsCount: documents.length,
      cacheStats: {
        exams: examStats,
        documents: documentStats,
      },
    });
  } catch (error: any) {
    console.error('[WarmupAPI] Cache warmup failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check both cache statuses
 */
export async function GET() {
  const examStats = getCacheStats();
  const documentStats = getDocumentCacheStats();
  return NextResponse.json({
    success: true,
    cache: {
      exams: examStats,
      documents: documentStats,
    },
  });
}
