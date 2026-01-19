"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './YouTubePlayer.module.css';

interface Subtitle {
  start: number;
  duration: number;
  text: string;
}

interface SubtitleResponse {
  success: boolean;
  video_id: string;
  language: string;
  count: number;
  subtitles: Subtitle[];
}

interface SavedVideo {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  lang: string;
  addedAt: number;
}

export default function YouTubePlayerPage() {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [translatedSubtitles, setTranslatedSubtitles] = useState<Subtitle[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState('ko');
  const [translateTo, setTranslateTo] = useState('vi');
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const playerRef = useRef<any>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const subtitleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Language options for translation (removed "Không dịch" option)
  const translationLanguages = [
    { code: 'vi', label: 'Tiếng Việt', short: 'VI' },
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'zh', label: '中文', short: '中' },
    { code: 'ja', label: '日本語', short: '日' },
    { code: 'ko', label: '한국어', short: '한' },
    { code: 'id', label: 'Bahasa Indonesia', short: 'ID' },
    { code: 'th', label: 'ไทย', short: 'TH' },
    { code: 'my', label: 'မြန်မာ', short: 'MY' },
  ];

  // Format seconds to mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false);
      }
    };

    if (showLangDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLangDropdown]);

  // Load saved videos from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('youtube-saved-videos');
    if (saved) {
      try {
        setSavedVideos(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved videos:', e);
      }
    }
  }, []);

  // Save videos to localStorage whenever it changes
  useEffect(() => {
    if (savedVideos.length > 0) {
      localStorage.setItem('youtube-saved-videos', JSON.stringify(savedVideos));
    }
  }, [savedVideos]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const saveCurrentVideo = (title?: string, tempVideoId?: string) => {
    const currentVideoId = tempVideoId || videoId;
    if (!currentVideoId) return;

    const thumbnail = `https://img.youtube.com/vi/${currentVideoId}/mqdefault.jpg`;
    const newVideo: SavedVideo = {
      id: currentVideoId,
      url: videoUrl,
      title: title || customTitle || `Video ${currentVideoId}`,
      thumbnail,
      lang,
      addedAt: Date.now()
    };

    // Check if video already exists
    if (!savedVideos.some(v => v.id === currentVideoId)) {
      setSavedVideos([newVideo, ...savedVideos]);
    }
  };

  const updateVideoTitle = (id: string, newTitle: string) => {
    setSavedVideos(savedVideos.map(v =>
      v.id === id ? { ...v, title: newTitle } : v
    ));
  };

  const loadSavedVideo = (video: SavedVideo) => {
    setVideoUrl(video.url);
    setLang(video.lang);
    setVideoId('');
    setTimeout(() => loadVideo(video.id, video.lang), 100);
  };

  const deleteVideo = (id: string) => {
    setSavedVideos(savedVideos.filter(v => v.id !== id));
    if (videoId === id) {
      setVideoId('');
      setSubtitles([]);
    }
  };

  const translateSubtitlesAsync = async (subtitles: any[], toLang: string, fromLang: string) => {
    try {
      setTranslationLoading(true);
      console.log(`🌐 Translating ${subtitles.length} subtitles to ${toLang}...`);
      console.log('First subtitle:', subtitles[0]);
      console.log('Request payload:', { subtitles: subtitles.slice(0, 2), to_lang: toLang, from_lang: fromLang });

      const response = await fetch('/api/translate-subtitles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subtitles,
          to_lang: toLang,
          from_lang: fromLang,
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Translation API error:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to translate subtitles');
      }

      const data = await response.json();

      if (data.success && data.translated_subtitles) {
        // Convert milliseconds to seconds
        const convertedTranslated = data.translated_subtitles.map((sub: any) => ({
          start: sub.start / 1000,
          duration: sub.duration / 1000,
          text: sub.text
        }));
        setTranslatedSubtitles(convertedTranslated);
        console.log(`✅ Successfully translated ${convertedTranslated.length} subtitles to ${toLang}`);
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedSubtitles([]);
    } finally {
      setTranslationLoading(false);
    }
  };

  const loadVideo = async (customId?: string, customLang?: string) => {
    const extractedId = customId || extractVideoId(videoUrl);

    if (!extractedId) {
      setError('URL YouTube không hợp lệ');
      return;
    }

    // Close modal immediately and clear form
    setShowAddForm(false);
    const savedTitle = customTitle;
    setCustomTitle('');
    setVideoUrl('');

    // Add video to sidebar immediately (even before loading)
    if (!customId && !savedVideos.some(v => v.id === extractedId)) {
      saveCurrentVideo(savedTitle || 'Đang tải...', extractedId);
    }

    setError('');
    setLoading(true);
    setVideoId(extractedId);
    const useLang = customLang || lang;

    try {
      // Fetch subtitles (without translation)
      const response = await fetch(
        `/api/youtube-subtitles?video_id=${extractedId}&lang=${useLang}`
      );

      if (!response.ok) {
        throw new Error('Không thể tải phụ đề');
      }

      const data: SubtitleResponse = await response.json();

      if (data.subtitles && Array.isArray(data.subtitles)) {
        // Convert milliseconds to seconds
        const convertedSubtitles = data.subtitles.map((sub: any) => ({
          start: sub.start / 1000,      // ms to seconds
          duration: sub.duration / 1000, // ms to seconds
          text: sub.text
        }));

        setSubtitles(convertedSubtitles);

        // Don't auto-translate on load, only when user enables toggle
        // Clear any previous translations
        setTranslatedSubtitles([]);
      } else {
        setError('Không có phụ đề cho video này');
        setSubtitles([]);
        setTranslatedSubtitles([]);
      }

      // Initialize YouTube player
      if ((window as any).YT && (window as any).YT.Player) {
        initializePlayer(extractedId);
      } else {
        (window as any).onYouTubeIframeAPIReady = () => {
          initializePlayer(extractedId);
        };
      }

      // Get video title from YouTube player after it's ready
      const getVideoTitle = () => {
        return new Promise<string>((resolve) => {
          const checkPlayer = setInterval(() => {
            if (playerRef.current && typeof playerRef.current.getVideoData === 'function') {
              clearInterval(checkPlayer);
              const videoData = playerRef.current.getVideoData();
              resolve(videoData.title || `Video ${extractedId}`);
            }
          }, 500);

          // Timeout after 5 seconds
          setTimeout(() => {
            clearInterval(checkPlayer);
            resolve(`Video ${extractedId}`);
          }, 5000);
        });
      };

      // Update video title after getting it from YouTube
      const title = await getVideoTitle();
      const finalTitle = savedTitle || title;

      // Update the video title in the list
      setSavedVideos(prev => prev.map(v =>
        v.id === extractedId ? { ...v, title: finalTitle } : v
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải video');
      // Remove video from list if failed
      if (!customId) {
        setSavedVideos(prev => prev.filter(v => v.id !== extractedId));
      }
    } finally {
      setLoading(false);
    }
  };

  const initializePlayer = (id: string) => {
    // Clean up existing player and interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (playerRef.current) {
      playerRef.current.destroy();
    }

    setIsPlayerReady(false);
    setCurrentTime(0);

    playerRef.current = new (window as any).YT.Player('youtube-player', {
      videoId: id,
      playerVars: {
        autoplay: 0,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: () => {
          setIsPlayerReady(true);

          // Start time tracking
          intervalRef.current = setInterval(() => {
            if (playerRef.current && playerRef.current.getCurrentTime) {
              const time = playerRef.current.getCurrentTime();
              setCurrentTime(time);
            }
          }, 100);
        },
        onStateChange: (event: any) => {
          if (event.data === (window as any).YT.PlayerState.PAUSED) {
            if (playerRef.current && playerRef.current.getCurrentTime) {
              setCurrentTime(playerRef.current.getCurrentTime());
            }
          }
        },
      },
    });
  };

  const handleSubtitleClick = (startTime: number) => {
    if (!isPlayerReady || !playerRef.current) return;

    try {
      if (typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(startTime, true);
        if (typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
        }
      }
    } catch (err) {
      console.error('Error seeking video:', err);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, []);

  const getCurrentSubtitleIndex = useCallback((): number => {
    if (subtitles.length === 0) return -1;

    let bestMatch = -1;
    let closestStart = -1;

    for (let i = 0; i < subtitles.length; i++) {
      const sub = subtitles[i];
      const endTime = sub.start + sub.duration;

      if (currentTime >= sub.start && currentTime < endTime) {
        // If multiple subtitles match, choose the one with the closest (latest) start time
        if (sub.start > closestStart) {
          closestStart = sub.start;
          bestMatch = i;
        }
      }
    }

    return bestMatch;
  }, [currentTime, subtitles]);

  const [activeSubtitleIndex, setActiveSubtitleIndex] = useState(-1);

  // Update active subtitle index
  useEffect(() => {
    if (!isPlayerReady || subtitles.length === 0) {
      setActiveSubtitleIndex(-1);
      return;
    }

    const newIndex = getCurrentSubtitleIndex();
    if (newIndex !== activeSubtitleIndex) {
      setActiveSubtitleIndex(newIndex);
    }
  }, [currentTime, subtitles, isPlayerReady, getCurrentSubtitleIndex, activeSubtitleIndex]);

  // Auto-scroll to current subtitle
  useEffect(() => {
    if (activeSubtitleIndex >= 0 && subtitleRefs.current[activeSubtitleIndex]) {
      const element = subtitleRefs.current[activeSubtitleIndex];
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [activeSubtitleIndex]);

  return (
    <div className={styles.container}>
      {/* Add Video Popup */}
      {showAddForm && (
        <div className={styles.overlay} onClick={() => setShowAddForm(false)}>
          <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popupHeader}>
              <h3 className={styles.popupTitle}>Thêm Video Mới</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowAddForm(false)}
                title="Đóng"
              >
                ×
              </button>
            </div>
            <div className={styles.popupContent}>
              <label className={styles.label}>Đường dẫn YouTube</label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className={styles.popupInput}
                autoFocus
              />
              <label className={styles.label}>Tên tùy chỉnh (Tùy chọn)</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Để trống sẽ dùng tên gốc của video"
                className={styles.popupInput}
              />
            </div>
            <div className={styles.popupFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowAddForm(false)}
              >
                Hủy
              </button>
              <button
                onClick={() => loadVideo()}
                disabled={loading || !videoUrl}
                className={styles.importButton}
              >
                {loading ? 'Đang tải...' : 'Nhập Video'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Translation Settings Popup */}
      {showSettingsPopup && (
        <div className={styles.overlay} onClick={() => setShowSettingsPopup(false)}>
          <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popupHeader}>
              <h3 className={styles.popupTitle}>Cài đặt dịch phụ đề</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowSettingsPopup(false)}
                title="Đóng"
              >
                ×
              </button>
            </div>
            <div className={styles.popupContent}>
              <label className={styles.label}>Dịch sang ngôn ngữ</label>
              <div className={styles.languageGrid}>
                {translationLanguages.map((language) => (
                  <button
                    key={language.code}
                    className={`${styles.languageButton} ${
                      translateTo === language.code ? styles.selected : ''
                    }`}
                    onClick={() => {
                      const newLang = language.code;
                      setTranslateTo(newLang);
                      setShowSettingsPopup(false);

                      // Only translate if toggle is ON and we have subtitles
                      if (showTranslation && videoId && subtitles.length > 0 && newLang) {
                        // Convert back to milliseconds for API
                        const subsInMs = subtitles.map(sub => ({
                          start: Math.round(sub.start * 1000),
                          duration: Math.round(sub.duration * 1000),
                          text: sub.text
                        }));
                        translateSubtitlesAsync(subsInMs, newLang, lang);
                      } else {
                        // Clear translations if toggle is OFF
                        setTranslatedSubtitles([]);
                      }
                    }}
                  >
                    {language.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>My Videos</h2>
          <button
            className={styles.addButton}
            onClick={() => setShowAddForm(true)}
            title="Add new video"
          >
            +
          </button>
        </div>

        <div className={styles.videoList}>
          {savedVideos.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No videos yet</p>
              <p>Click + to add</p>
            </div>
          ) : (
            savedVideos.map((video) => (
              <div
                key={video.id}
                className={`${styles.videoCard} ${videoId === video.id ? styles.active : ''}`}
              >
                <div className={styles.videoCardContent} onClick={() => loadSavedVideo(video)}>
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className={styles.videoThumbnail}
                  />
                  <div className={styles.videoInfo}>
                    <input
                      type="text"
                      value={video.title}
                      onChange={(e) => updateVideoTitle(video.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className={styles.videoTitleInput}
                      placeholder="Video title..."
                    />
                    <span className={styles.videoLang}>{video.lang.toUpperCase()}</span>
                  </div>
                </div>
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteVideo(video.id);
                  }}
                  title="Delete"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {error && (
          <div className={styles.error}>{error}</div>
        )}

        {videoId && (
          <div className={styles.playerContainer}>
            <div className={styles.videoWrapper}>
              <div
                id="youtube-player"
                className={styles.player}
              ></div>
              {loading && (
                <div className={styles.skeleton}></div>
              )}
            </div>

            {loading ? (
              <div className={styles.subtitlesSection}>
                <div className={styles.subtitlesList}>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className={styles.skeletonSubtitle}>
                      <div className={styles.skeletonTimestamp}></div>
                      <div className={styles.skeletonText} style={{ width: `${60 + Math.random() * 30}%` }}></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : subtitles.length > 0 ? (
              <div className={styles.subtitlesSection}>
                <div className={styles.subtitlesHeader}>
                  <span className={styles.subtitlesTitle}>Phụ đề</span>
                  <div className={styles.headerControls}>
                    <label className={styles.toggleSwitch}>
                      <span className={styles.toggleLabel}>Song ngữ</span>
                      <input
                        type="checkbox"
                        checked={showTranslation}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          console.log('Toggle changed:', isChecked);
                          console.log('Current translations:', translatedSubtitles.length);
                          console.log('Subtitles:', subtitles.length);
                          console.log('Translate to:', translateTo);

                          setShowTranslation(isChecked);

                          // If turning on and no translation yet, fetch it
                          if (isChecked && translatedSubtitles.length === 0 && subtitles.length > 0 && translateTo) {
                            console.log('Fetching translations...');
                            const subsInMs = subtitles.map(sub => ({
                              start: Math.round(sub.start * 1000),
                              duration: Math.round(sub.duration * 1000),
                              text: sub.text
                            }));
                            translateSubtitlesAsync(subsInMs, translateTo, lang);
                          }
                        }}
                      />
                      <span className={styles.slider}></span>
                    </label>
                    <div className={styles.customSelect} ref={langDropdownRef}>
                      <button
                        className={styles.selectButton}
                        onClick={() => setShowLangDropdown(!showLangDropdown)}
                        title="Chọn ngôn ngữ dịch"
                      >
                        <span>{translationLanguages.find(l => l.code === translateTo)?.label || 'Chọn ngôn ngữ'}</span>
                        <span className={styles.arrow}>▼</span>
                      </button>
                      {showLangDropdown && (
                        <div className={styles.dropdownMenu}>
                          {translationLanguages.map((language) => (
                            <div
                              key={language.code}
                              className={`${styles.dropdownItem} ${translateTo === language.code ? styles.selected : ''}`}
                              onClick={() => {
                                const newLang = language.code;
                                setTranslateTo(newLang);
                                setShowLangDropdown(false);

                                // Only translate if toggle is ON and we have subtitles
                                if (showTranslation && videoId && subtitles.length > 0 && newLang) {
                                  // Convert back to milliseconds for API
                                  const subsInMs = subtitles.map(sub => ({
                                    start: Math.round(sub.start * 1000),
                                    duration: Math.round(sub.duration * 1000),
                                    text: sub.text
                                  }));
                                  translateSubtitlesAsync(subsInMs, newLang, lang);
                                } else {
                                  // Clear translations if toggle is OFF
                                  setTranslatedSubtitles([]);
                                }
                              }}
                            >
                              {language.label}
                              {translateTo === language.code && <span className={styles.checkmark}>✓</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className={styles.subtitlesList}>
                  {subtitles.map((subtitle, index) => {
                    const isActive = index === activeSubtitleIndex;
                    const translated = translatedSubtitles[index];
                    const hasDualSub = showTranslation && translated;
                    const showSkeleton = showTranslation && translationLoading && !translated;

                    return (
                      <div
                        key={index}
                        ref={(el) => { subtitleRefs.current[index] = el; }}
                        className={`${styles.subtitleItem} ${
                          isActive ? styles.active : ''
                        } ${hasDualSub || showSkeleton ? styles.dualSubtitle : ''}`}
                        onClick={() => handleSubtitleClick(subtitle.start)}
                      >
                        <span className={styles.timestamp}>
                          {formatTime(subtitle.start)}
                        </span>
                        <div className={styles.textContainer}>
                          <span className={styles.text}>{subtitle.text}</span>
                          {hasDualSub && (
                            <span className={styles.translatedText}>{translated.text}</span>
                          )}
                          {showSkeleton && (
                            <span className={styles.translatedText}>
                              <span className={styles.skeletonText} style={{ width: '100%', display: 'block' }}></span>
                            </span>
                          )}
                        </div>
                        {isActive && <span className={styles.playingIndicator}>▶</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
