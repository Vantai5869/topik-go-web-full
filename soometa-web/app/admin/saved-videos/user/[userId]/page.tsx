'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/app/store/authStore';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE_URL = '';

interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  subscriptionTier: string;
}

interface SavedVideo {
  _id: string;
  videoId: string;
  title: string;
  thumbnailUrl: string;
  lang: string;
  translatedTo: string | null;
  createdAt: string;
  updatedAt: string;
  subtitles: any[];
  translatedSubtitles: any[];
}

export default function UserVideosPage() {
  const params = useParams();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const userId = params.userId as string;

  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<SavedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState<SavedVideo | null>(null);

  useEffect(() => {
    const fetchUserVideos = async () => {
      if (!token || !userId) return;

      setLoading(true);
      try {
        const url = new URL(`${API_BASE_URL}/saved-videos/admin/user/${userId}`);
        url.searchParams.set('page', page.toString());
        url.searchParams.set('limit', '20');

        const response = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setVideos(data.videos);
          setTotalPages(data.pagination.totalPages);
        } else if (response.status === 404) {
          alert('User not found');
          router.push('/admin/saved-videos');
        }
      } catch (error) {
        console.error('Error fetching user videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserVideos();
  }, [token, userId, page, router]);

  const handleDelete = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this saved video?')) return;
    if (!token || !userId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/saved-videos/admin/user/${userId}/${videoId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        setVideos(videos.filter(v => v.videoId !== videoId));
        alert('Video deleted successfully');
      } else {
        alert('Failed to delete video');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Error deleting video');
    }
  };

  if (loading && !user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/saved-videos"
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Users
        </Link>
      </div>

      {user && (
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User's Saved Videos</h1>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Name:</span>
              <div className="font-medium text-gray-900">{user.name || 'N/A'}</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Email:</span>
              <div className="font-medium text-gray-900">{user.email}</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Role:</span>
              <div className="font-medium text-gray-900">{user.role}</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Subscription:</span>
              <div className="font-medium text-gray-900">{user.subscriptionTier || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Saved Videos ({videos.length})
          </h2>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading videos...</div>
          ) : videos.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No saved videos</div>
          ) : (
            <div className="space-y-4">
              {videos.map((video) => (
                <div
                  key={video._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    {video.thumbnailUrl && (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-40 h-24 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {video.title || 'Untitled'}
                      </h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <span className="font-medium">Video ID:</span>{' '}
                          <a
                            href={`https://www.youtube.com/watch?v=${video.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {video.videoId}
                          </a>
                        </div>
                        <div>
                          <span className="font-medium">Language:</span> {video.lang}
                        </div>
                        {video.translatedTo && (
                          <div>
                            <span className="font-medium">Translated to:</span> {video.translatedTo}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Subtitles:</span> {video.subtitles.length} segments
                        </div>
                        {video.translatedSubtitles.length > 0 && (
                          <div>
                            <span className="font-medium">Translated subtitles:</span>{' '}
                            {video.translatedSubtitles.length} segments
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Created:</span>{' '}
                          {new Date(video.createdAt).toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Updated:</span>{' '}
                          {new Date(video.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 justify-start">
                      <button
                        onClick={() => setSelectedVideo(video)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        View Video
                      </button>
                      <button
                        onClick={() => handleDelete(video.videoId)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Video Player Popup */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedVideo.title || 'Video Player'}
              </h2>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* YouTube Player */}
              <div className="aspect-video mb-6">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${selectedVideo.videoId}`}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg"
                ></iframe>
              </div>

              {/* Video Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600 font-medium">Language:</span>
                  <div className="text-gray-900">{selectedVideo.lang}</div>
                </div>
                {selectedVideo.translatedTo && (
                  <div>
                    <span className="text-sm text-gray-600 font-medium">Translated to:</span>
                    <div className="text-gray-900">{selectedVideo.translatedTo}</div>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-600 font-medium">Subtitles:</span>
                  <div className="text-gray-900">{selectedVideo.subtitles.length} segments</div>
                </div>
                {selectedVideo.translatedSubtitles.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600 font-medium">Translated subtitles:</span>
                    <div className="text-gray-900">{selectedVideo.translatedSubtitles.length} segments</div>
                  </div>
                )}
              </div>

              {/* Subtitles Section */}
              {selectedVideo.subtitles.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Subtitles Preview</h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      {selectedVideo.subtitles.slice(0, 20).map((sub: any, index: number) => (
                        <div key={index} className="text-sm">
                          <span className="text-gray-500 font-mono mr-2">
                            {Math.floor(sub.start / 1000 / 60)}:{String(Math.floor(sub.start / 1000) % 60).padStart(2, '0')}
                          </span>
                          <span className="text-gray-900">{sub.text}</span>
                          {selectedVideo.translatedSubtitles[index] && (
                            <div className="ml-12 text-gray-600 italic">
                              {selectedVideo.translatedSubtitles[index].text}
                            </div>
                          )}
                        </div>
                      ))}
                      {selectedVideo.subtitles.length > 20 && (
                        <div className="text-center text-gray-500 text-sm pt-2">
                          ... and {selectedVideo.subtitles.length - 20} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
