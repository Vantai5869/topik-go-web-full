// app/youtube-player/useSavedVideos.ts
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  SavedVideo,
  getLocalSavedVideos,
  addVideoToLocal,
  removeVideoFromLocal,
  getSavedVideosFromAPI,
  saveVideoToAPI,
  deleteVideoFromAPI,
  syncLocalVideosToAPI
} from '@/lib/savedVideos';

interface SavedVideoDisplay {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  lang: string;
  addedAt: number;
}

export function useSavedVideos() {
  const [savedVideos, setSavedVideos] = useState<SavedVideoDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { currentUser, token } = useAuthStore();
  const isLoggedIn = !!currentUser && !!token;

  // Load videos on mount
  useEffect(() => {
    loadVideos();
  }, [isLoggedIn]);

  // Auto-sync when user logs in
  useEffect(() => {
    if (isLoggedIn && token) {
      syncLocalToServer();
    }
  }, [isLoggedIn]);

  const loadVideos = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (isLoggedIn && token) {
        // Load from API
        const apiVideos = await getSavedVideosFromAPI(token);
        const displayVideos = apiVideos.map(v => ({
          id: v.videoId,
          url: `https://youtube.com/watch?v=${v.videoId}`,
          title: v.title || 'Untitled',
          thumbnail: v.thumbnailUrl || `https://img.youtube.com/vi/${v.videoId}/default.jpg`,
          lang: v.lang || 'ko',
          addedAt: v.createdAt ? new Date(v.createdAt).getTime() : Date.now()
        }));
        setSavedVideos(displayVideos);
      } else {
        // Load from localStorage
        const localVideos = getLocalSavedVideos();
        const displayVideos = localVideos.map(v => ({
          id: v.videoId,
          url: `https://youtube.com/watch?v=${v.videoId}`,
          title: v.title || 'Untitled',
          thumbnail: v.thumbnailUrl || `https://img.youtube.com/vi/${v.videoId}/default.jpg`,
          lang: v.lang || 'ko',
          addedAt: v.createdAt ? new Date(v.createdAt).getTime() : Date.now()
        }));
        setSavedVideos(displayVideos);
      }
    } catch (err: any) {
      console.error('Error loading videos:', err);
      setError(err.message || 'Failed to load videos');
    } finally {
      setIsLoading(false);
    }
  };

  const addVideo = async (
    videoId: string,
    title: string,
    lang: string = 'ko',
    subtitles?: any[]
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const video: SavedVideo = {
        videoId,
        title,
        lang,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/default.jpg`,
        subtitles: subtitles || []
      };

      if (isLoggedIn && token) {
        // Save to API
        await saveVideoToAPI(token, video);
        await loadVideos(); // Reload from server
        return { success: true };
      } else {
        // Save to localStorage (with limit check)
        const result = addVideoToLocal(video);

        if (!result.success && result.error === 'MAX_LIMIT_REACHED') {
          return {
            success: false,
            error: 'Bạn chỉ có thể lưu tối đa 2 video. Vui lòng đăng nhập để lưu nhiều hơn!'
          };
        }

        await loadVideos(); // Reload from localStorage
        return result;
      }
    } catch (err: any) {
      console.error('Error adding video:', err);
      return {
        success: false,
        error: err.message || 'Failed to save video'
      };
    }
  };

  const deleteVideo = async (videoId: string): Promise<void> => {
    try {
      if (isLoggedIn && token) {
        // Delete from API
        await deleteVideoFromAPI(token, videoId);
      } else {
        // Delete from localStorage
        removeVideoFromLocal(videoId);
      }

      await loadVideos();
    } catch (err: any) {
      console.error('Error deleting video:', err);
      setError(err.message || 'Failed to delete video');
    }
  };

  const updateVideoTitle = (videoId: string, newTitle: string) => {
    setSavedVideos(prev =>
      prev.map(v => (v.id === videoId ? { ...v, title: newTitle } : v))
    );

    // TODO: Call API to update title on server if logged in
    // For now, just update local state
  };

  const syncLocalToServer = async () => {
    if (!isLoggedIn || !token) return;

    try {
      const result = await syncLocalVideosToAPI(token);
      console.log(`Synced: ${result.success} success, ${result.failed} failed`);
      await loadVideos(); // Reload from server
    } catch (err: any) {
      console.error('Error syncing videos:', err);
    }
  };

  return {
    savedVideos,
    isLoading,
    error,
    addVideo,
    deleteVideo,
    updateVideoTitle,
    refresh: loadVideos
  };
}
