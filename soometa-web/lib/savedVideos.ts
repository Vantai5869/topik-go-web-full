// lib/savedVideos.ts
import axios from 'axios';

const API_BASE_URL = '';
const STORAGE_KEY = 'saved_videos';
const MAX_GUEST_VIDEOS = 2;

export interface SavedVideo {
  videoId: string;
  title?: string;
  thumbnailUrl?: string;
  lang?: string;
  subtitles?: Array<{ start: number; duration: number; text: string }>;
  translatedTo?: string | null;
  translatedSubtitles?: Array<{ start: number; duration: number; text: string }>;
  createdAt?: string;
  updatedAt?: string;
}

// Get saved videos from localStorage
export function getLocalSavedVideos(): SavedVideo[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading saved videos from localStorage:', error);
    return [];
  }
}

// Save videos to localStorage
export function setLocalSavedVideos(videos: SavedVideo[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
  } catch (error) {
    console.error('Error saving videos to localStorage:', error);
  }
}

// Check if a video is saved locally
export function isVideoSavedLocally(videoId: string): boolean {
  const videos = getLocalSavedVideos();
  return videos.some(v => v.videoId === videoId);
}

// Add video to localStorage (for guests)
export function addVideoToLocal(video: SavedVideo): { success: boolean; error?: string } {
  const videos = getLocalSavedVideos();

  // Check if already saved
  const existingIndex = videos.findIndex(v => v.videoId === video.videoId);

  if (existingIndex !== -1) {
    // Update existing video
    videos[existingIndex] = {
      ...videos[existingIndex],
      ...video,
      updatedAt: new Date().toISOString()
    };
    setLocalSavedVideos(videos);
    return { success: true };
  }

  // Check limit for new videos
  if (videos.length >= MAX_GUEST_VIDEOS) {
    return {
      success: false,
      error: 'MAX_LIMIT_REACHED'
    };
  }

  // Add new video
  videos.push({
    ...video,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  setLocalSavedVideos(videos);
  return { success: true };
}

// Remove video from localStorage
export function removeVideoFromLocal(videoId: string): void {
  const videos = getLocalSavedVideos();
  const filtered = videos.filter(v => v.videoId !== videoId);
  setLocalSavedVideos(filtered);
}

// Update video translation in localStorage
export function updateVideoTranslationLocal(videoId: string, translatedTo: string, translatedSubtitles: any[]): void {
  const videos = getLocalSavedVideos();
  const index = videos.findIndex(v => v.videoId === videoId);

  if (index !== -1) {
    videos[index].translatedTo = translatedTo;
    videos[index].translatedSubtitles = translatedSubtitles;
    videos[index].updatedAt = new Date().toISOString();
    setLocalSavedVideos(videos);
  }
}

// Clear all local saved videos
export function clearLocalSavedVideos(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// ===== API functions for logged-in users =====

// Get saved videos from API
export async function getSavedVideosFromAPI(token: string): Promise<SavedVideo[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/saved-videos`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data.videos || [];
  } catch (error) {
    console.error('Error fetching saved videos from API:', error);
    throw error;
  }
}

// Save video to API
export async function saveVideoToAPI(token: string, video: SavedVideo): Promise<SavedVideo> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/saved-videos`,
      video,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data.video;
  } catch (error) {
    console.error('Error saving video to API:', error);
    throw error;
  }
}

// Update video translation in API
export async function updateVideoTranslationAPI(
  token: string,
  videoId: string,
  translatedTo: string,
  translatedSubtitles: any[]
): Promise<SavedVideo> {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/saved-videos/${videoId}/translation`,
      { translatedTo, translatedSubtitles },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data.video;
  } catch (error) {
    console.error('Error updating translation in API:', error);
    throw error;
  }
}

// Delete video from API
export async function deleteVideoFromAPI(token: string, videoId: string): Promise<void> {
  try {
    await axios.delete(
      `${API_BASE_URL}/saved-videos/${videoId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (error) {
    console.error('Error deleting video from API:', error);
    throw error;
  }
}

// Check if video is saved in API
export async function checkVideoSavedAPI(token: string, videoId: string): Promise<{ isSaved: boolean; video?: SavedVideo }> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/saved-videos/check/${videoId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return {
      isSaved: response.data.isSaved,
      video: response.data.video
    };
  } catch (error) {
    console.error('Error checking video in API:', error);
    throw error;
  }
}

// Sync localStorage videos to API after login
export async function syncLocalVideosToAPI(token: string): Promise<{ success: number; failed: number }> {
  try {
    const localVideos = getLocalSavedVideos();

    if (localVideos.length === 0) {
      return { success: 0, failed: 0 };
    }

    const response = await axios.post(
      `${API_BASE_URL}/saved-videos/sync`,
      { videos: localVideos },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Clear localStorage after successful sync
    clearLocalSavedVideos();

    return {
      success: response.data.results.success.length,
      failed: response.data.results.failed.length
    };
  } catch (error) {
    console.error('Error syncing videos to API:', error);
    throw error;
  }
}
