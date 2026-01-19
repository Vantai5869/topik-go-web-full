// routes/savedVideoRoutes.js
import express from 'express';
import SavedVideo from '../models/SavedVideo.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';
import adminAuthMiddleware from '../middleware/adminAuth.js';

const router = express.Router();

// GET /saved-videos - Lấy danh sách video đã lưu của user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.currentUser.id;

    const savedVideos = await SavedVideo.find({ userId })
      .sort({ updatedAt: -1 }) // Newest first
      .select('-__v');

    res.json({
      success: true,
      count: savedVideos.length,
      videos: savedVideos
    });
  } catch (error) {
    console.error('Error fetching saved videos:', error);
    res.status(500).json({ error: 'Failed to fetch saved videos' });
  }
});

// POST /saved-videos - Lưu video mới hoặc cập nhật video đã tồn tại
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const { videoId, title, thumbnailUrl, lang, subtitles, translatedTo, translatedSubtitles } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    // Check if video already saved
    let savedVideo = await SavedVideo.findOne({ userId, videoId });

    if (savedVideo) {
      // Update existing video
      savedVideo.title = title || savedVideo.title;
      savedVideo.thumbnailUrl = thumbnailUrl || savedVideo.thumbnailUrl;
      savedVideo.lang = lang || savedVideo.lang;
      savedVideo.subtitles = subtitles || savedVideo.subtitles;
      savedVideo.translatedTo = translatedTo !== undefined ? translatedTo : savedVideo.translatedTo;
      savedVideo.translatedSubtitles = translatedSubtitles || savedVideo.translatedSubtitles;

      await savedVideo.save();

      res.json({
        success: true,
        message: 'Video updated successfully',
        video: savedVideo
      });
    } else {
      // Create new saved video
      savedVideo = new SavedVideo({
        userId,
        videoId,
        title: title || '',
        thumbnailUrl: thumbnailUrl || '',
        lang: lang || 'ko',
        subtitles: subtitles || [],
        translatedTo: translatedTo || null,
        translatedSubtitles: translatedSubtitles || []
      });

      await savedVideo.save();

      res.status(201).json({
        success: true,
        message: 'Video saved successfully',
        video: savedVideo
      });
    }
  } catch (error) {
    console.error('Error saving video:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Video already saved' });
    }

    res.status(500).json({ error: 'Failed to save video' });
  }
});

// PUT /saved-videos/:videoId/translation - Cập nhật bản dịch của video
router.put('/:videoId/translation', authMiddleware, async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const { videoId } = req.params;
    const { translatedTo, translatedSubtitles } = req.body;

    if (!translatedTo) {
      return res.status(400).json({ error: 'translatedTo is required' });
    }

    const savedVideo = await SavedVideo.findOne({ userId, videoId });

    if (!savedVideo) {
      return res.status(404).json({ error: 'Video not found in saved videos' });
    }

    // Update only translation (overwrite previous translation)
    savedVideo.translatedTo = translatedTo;
    savedVideo.translatedSubtitles = translatedSubtitles || [];
    await savedVideo.save();

    res.json({
      success: true,
      message: 'Translation updated successfully',
      video: savedVideo
    });
  } catch (error) {
    console.error('Error updating translation:', error);
    res.status(500).json({ error: 'Failed to update translation' });
  }
});

// DELETE /saved-videos/:videoId - Xóa video đã lưu
router.delete('/:videoId', authMiddleware, async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const { videoId } = req.params;

    const result = await SavedVideo.deleteOne({ userId, videoId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Video not found in saved videos' });
    }

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// POST /saved-videos/sync - Đồng bộ videos từ localStorage lên server
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const { videos } = req.body;

    if (!Array.isArray(videos)) {
      return res.status(400).json({ error: 'videos must be an array' });
    }

    const syncResults = {
      success: [],
      failed: []
    };

    for (const video of videos) {
      try {
        const { videoId, title, thumbnailUrl, lang, subtitles, translatedTo, translatedSubtitles } = video;

        if (!videoId) {
          syncResults.failed.push({ videoId: 'unknown', error: 'Missing videoId' });
          continue;
        }

        // Check if already exists
        let savedVideo = await SavedVideo.findOne({ userId, videoId });

        if (!savedVideo) {
          // Create new
          savedVideo = new SavedVideo({
            userId,
            videoId,
            title: title || '',
            thumbnailUrl: thumbnailUrl || '',
            lang: lang || 'ko',
            subtitles: subtitles || [],
            translatedTo: translatedTo || null,
            translatedSubtitles: translatedSubtitles || []
          });
          await savedVideo.save();
          syncResults.success.push({ videoId, action: 'created' });
        } else {
          // Update if newer or has more data
          savedVideo.title = title || savedVideo.title;
          savedVideo.thumbnailUrl = thumbnailUrl || savedVideo.thumbnailUrl;
          savedVideo.lang = lang || savedVideo.lang;
          savedVideo.subtitles = subtitles || savedVideo.subtitles;
          if (translatedTo) {
            savedVideo.translatedTo = translatedTo;
            savedVideo.translatedSubtitles = translatedSubtitles || [];
          }
          await savedVideo.save();
          syncResults.success.push({ videoId, action: 'updated' });
        }
      } catch (error) {
        syncResults.failed.push({ videoId: video.videoId, error: error.message });
      }
    }

    res.json({
      success: true,
      message: 'Sync completed',
      results: syncResults
    });
  } catch (error) {
    console.error('Error syncing videos:', error);
    res.status(500).json({ error: 'Failed to sync videos' });
  }
});

// GET /saved-videos/check/:videoId - Kiểm tra xem video đã được lưu chưa
router.get('/check/:videoId', authMiddleware, async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const { videoId } = req.params;

    const savedVideo = await SavedVideo.findOne({ userId, videoId });

    res.json({
      success: true,
      isSaved: !!savedVideo,
      video: savedVideo || null
    });
  } catch (error) {
    console.error('Error checking video:', error);
    res.status(500).json({ error: 'Failed to check video' });
  }
});

// ===== ADMIN ROUTES =====

// GET /saved-videos/admin/overview - Lấy tổng quan về saved videos (Admin only)
router.get('/admin/overview', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    // Tổng số saved videos
    const totalVideos = await SavedVideo.countDocuments();

    // Tổng số users có saved videos
    const usersWithSavedVideos = await SavedVideo.distinct('userId');
    const totalUsers = usersWithSavedVideos.length;

    // Top 10 videos được lưu nhiều nhất
    const topVideos = await SavedVideo.aggregate([
      {
        $group: {
          _id: '$videoId',
          count: { $sum: 1 },
          title: { $first: '$title' },
          thumbnailUrl: { $first: '$thumbnailUrl' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Top 10 users có nhiều saved videos nhất
    const topUsers = await SavedVideo.aggregate([
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $project: {
          userId: '$_id',
          count: 1,
          email: { $arrayElemAt: ['$userInfo.email', 0] },
          name: { $arrayElemAt: ['$userInfo.name', 0] }
        }
      }
    ]);

    res.json({
      success: true,
      overview: {
        totalVideos,
        totalUsers,
        topVideos,
        topUsers
      }
    });
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

// GET /saved-videos/admin/users - Lấy danh sách users có saved videos (Admin only)
router.get('/admin/users', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Aggregate để lấy thông tin users và số lượng videos của họ
    const pipeline = [
      {
        $group: {
          _id: '$userId',
          videoCount: { $sum: 1 },
          lastUpdated: { $max: '$updatedAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          userId: '$_id',
          email: '$userInfo.email',
          name: '$userInfo.name',
          videoCount: 1,
          lastUpdated: 1
        }
      }
    ];

    // Add search filter if provided
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { email: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    // Sort by videoCount descending
    pipeline.push({ $sort: { videoCount: -1 } });

    // Get total count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await SavedVideo.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Add pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    const users = await SavedVideo.aggregate(pipeline);

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users list:', error);
    res.status(500).json({ error: 'Failed to fetch users list' });
  }
});

// GET /saved-videos/admin/user/:userId - Lấy danh sách videos của một user cụ thể (Admin only)
router.get('/admin/user/:userId', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get user info
    const user = await User.findById(userId).select('email name role subscriptionTier');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get saved videos
    const videos = await SavedVideo.find({ userId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await SavedVideo.countDocuments({ userId });

    res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscriptionTier: user.subscriptionTier
      },
      videos,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching user videos:', error);
    res.status(500).json({ error: 'Failed to fetch user videos' });
  }
});

// GET /saved-videos/admin/video/:videoId - Xem tất cả users đã lưu một video cụ thể (Admin only)
router.get('/admin/video/:videoId', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { videoId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get all saved videos for this videoId
    const savedVideos = await SavedVideo.find({ videoId })
      .populate('userId', 'email name role subscriptionTier')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await SavedVideo.countDocuments({ videoId });

    // Get video info from first saved video
    const videoInfo = savedVideos[0] ? {
      videoId: savedVideos[0].videoId,
      title: savedVideos[0].title,
      thumbnailUrl: savedVideos[0].thumbnailUrl,
      lang: savedVideos[0].lang
    } : null;

    res.json({
      success: true,
      videoInfo,
      savedBy: savedVideos.map(sv => ({
        user: sv.userId,
        translatedTo: sv.translatedTo,
        createdAt: sv.createdAt,
        updatedAt: sv.updatedAt
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching video details:', error);
    res.status(500).json({ error: 'Failed to fetch video details' });
  }
});

// DELETE /saved-videos/admin/user/:userId/:videoId - Xóa saved video của user (Admin only)
router.delete('/admin/user/:userId/:videoId', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { userId, videoId } = req.params;

    const result = await SavedVideo.deleteOne({ userId, videoId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Saved video not found' });
    }

    res.json({
      success: true,
      message: 'Saved video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting saved video:', error);
    res.status(500).json({ error: 'Failed to delete saved video' });
  }
});

export default router;
