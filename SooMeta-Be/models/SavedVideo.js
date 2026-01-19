// models/SavedVideo.js
import mongoose from "mongoose";

const subtitleSchema = new mongoose.Schema({
  start: { type: Number, required: true }, // in milliseconds
  duration: { type: Number, required: true }, // in milliseconds
  text: { type: String, required: true }
}, { _id: false });

const savedVideoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true
  },
  videoId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  lang: {
    type: String,
    default: 'ko',
    enum: ['ko', 'en', 'ja', 'zh', 'vi', 'id', 'th', 'my']
  },
  subtitles: {
    type: [subtitleSchema],
    default: []
  },
  // Translation info
  translatedTo: {
    type: String,
    default: null,
    enum: ['vi', 'en', 'zh', 'ja', 'ko', 'id', 'th', 'my', null]
  },
  translatedSubtitles: {
    type: [subtitleSchema],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index: một user không thể lưu cùng 1 video nhiều lần
savedVideoSchema.index({ userId: 1, videoId: 1 }, { unique: true });

// Update timestamp on save
savedVideoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.SavedVideo || mongoose.model('SavedVideo', savedVideoSchema);
