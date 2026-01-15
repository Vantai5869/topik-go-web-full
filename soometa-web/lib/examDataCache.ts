// lib/examDataCache.ts
import fs from 'fs/promises';
import path from 'path';
import type { ExamData } from '../app/components/types';

const EXAMS_DATA_PATH = path.join(process.cwd(), 'data', 'data.json');

// In-memory cache để tránh đọc file 2.3MB nhiều lần
let cachedExamsData: ExamData[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour cache in production

// Track if we're currently loading (prevent multiple simultaneous loads)
let isLoading = false;
let loadPromise: Promise<ExamData[]> | null = null;

/**
 * Get all exams with in-memory caching
 * Optimized để tránh đọc file JSON 2.3MB mỗi request
 */
export async function getAllExams(): Promise<ExamData[]> {
  try {
    // Check cache first
    const now = Date.now();
    if (cachedExamsData && (now - cacheTimestamp) < CACHE_TTL) {
      return cachedExamsData;
    }

    // If already loading, wait for that promise
    if (isLoading && loadPromise) {
      return loadPromise;
    }

    // Start loading
    isLoading = true;

    loadPromise = (async () => {
      const fileContent = await fs.readFile(EXAMS_DATA_PATH, 'utf-8');
      const allExamsData: ExamData[] = JSON.parse(fileContent);

      if (!Array.isArray(allExamsData)) {
        console.error('[ExamCache] Data is not an array');
        return [];
      }

      // Update cache
      cachedExamsData = allExamsData;
      cacheTimestamp = Date.now();

      return allExamsData;
    })();

    const result = await loadPromise;
    isLoading = false;
    loadPromise = null;
    return result;

  } catch (error: any) {
    isLoading = false;
    loadPromise = null;
    console.error('[ExamCache] Error loading exams:', error.message);
    return [];
  }
}

/**
 * Get single exam by ID
 * Uses cached data from getAllExams
 */
export async function getExamData(examId: string): Promise<ExamData | null> {
  try {
    const allExamsData = await getAllExams();
    const exam = allExamsData.find(e => e.id.toString() === examId.toString());
    return exam || null;
  } catch (error: any) {
    console.error(`Lỗi khi lấy exam ${examId}:`, error.message);
    return null;
  }
}

/**
 * Clear cache manually (useful for development/testing)
 */
export function clearExamCache(): void {
  cachedExamsData = null;
  cacheTimestamp = 0;
  isLoading = false;
  loadPromise = null;
}

/**
 * Preload data into cache (call this on app startup)
 * This makes the first page load instant!
 */
export async function preloadExamCache(): Promise<void> {
  try {
    await getAllExams();
  } catch (error) {
    console.error('[ExamCache] Preload failed:', error);
  }
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats() {
  const isValid = cachedExamsData && (Date.now() - cacheTimestamp) < CACHE_TTL;
  const age = cachedExamsData ? Math.floor((Date.now() - cacheTimestamp) / 1000) : 0;
  const remaining = isValid ? Math.floor((CACHE_TTL - (Date.now() - cacheTimestamp)) / 1000) : 0;

  return {
    status: isValid ? 'valid' : cachedExamsData ? 'expired' : 'empty',
    count: cachedExamsData?.length || 0,
    ageSeconds: age,
    remainingSeconds: remaining,
    isLoading,
  };
}
