// lib/documentDataCache.ts
import fs from 'fs/promises';
import path from 'path';

export interface DocumentLinkItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  skill?: string;
  googleDriveLink: string;
  previewImageUrl?: string;
  fileType: string;
  year?: number;
}

const DOCUMENTS_DATA_PATH = path.join(process.cwd(), 'data', 'document_links.json');

// In-memory cache để tránh đọc file nhiều lần
let cachedDocumentsData: DocumentLinkItem[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour cache in production

// Track if we're currently loading (prevent multiple simultaneous loads)
let isLoading = false;
let loadPromise: Promise<DocumentLinkItem[]> | null = null;

/**
 * Get all documents with in-memory caching
 * Optimized để tránh đọc file JSON mỗi request
 */
export async function getAllDocuments(): Promise<DocumentLinkItem[]> {
  try {
    // Check cache first
    const now = Date.now();
    if (cachedDocumentsData && (now - cacheTimestamp) < CACHE_TTL) {
      return cachedDocumentsData;
    }

    // If already loading, wait for that promise
    if (isLoading && loadPromise) {
      return loadPromise;
    }

    // Start loading
    isLoading = true;

    loadPromise = (async () => {
      const fileContent = await fs.readFile(DOCUMENTS_DATA_PATH, 'utf-8');
      const allDocumentsData: DocumentLinkItem[] = JSON.parse(fileContent);

      if (!Array.isArray(allDocumentsData)) {
        console.error('[DocumentCache] Data is not an array');
        return [];
      }

      // Update cache
      cachedDocumentsData = allDocumentsData;
      cacheTimestamp = Date.now();

      return allDocumentsData;
    })();

    const result = await loadPromise;
    isLoading = false;
    loadPromise = null;
    return result;

  } catch (error: any) {
    isLoading = false;
    loadPromise = null;
    console.error('[DocumentCache] Error loading documents:', error.message);
    return [];
  }
}

/**
 * Get single document by ID
 * Uses cached data from getAllDocuments
 */
export async function getDocumentData(documentId: string): Promise<DocumentLinkItem | undefined> {
  const allDocuments = await getAllDocuments();
  return allDocuments.find(doc => doc.id === documentId);
}

/**
 * Clear cache manually (useful for development/testing)
 */
export function clearDocumentCache(): void {
  cachedDocumentsData = null;
  cacheTimestamp = 0;
  isLoading = false;
  loadPromise = null;
}

/**
 * Preload data into cache (call this on app startup)
 * This makes the first page load instant!
 */
export async function preloadDocumentCache(): Promise<void> {
  try {
    await getAllDocuments();
  } catch (error) {
    console.error('[DocumentCache] Preload failed:', error);
  }
}

/**
 * Get cache statistics (for debugging)
 */
export function getDocumentCacheStats() {
  const isValid = cachedDocumentsData && (Date.now() - cacheTimestamp) < CACHE_TTL;
  const age = cachedDocumentsData ? Math.floor((Date.now() - cacheTimestamp) / 1000) : 0;
  const remaining = isValid ? Math.floor((CACHE_TTL - (Date.now() - cacheTimestamp)) / 1000) : 0;

  return {
    status: isValid ? 'valid' : cachedDocumentsData ? 'expired' : 'empty',
    count: cachedDocumentsData?.length || 0,
    ageSeconds: age,
    remainingSeconds: remaining,
    isLoading,
  };
}
