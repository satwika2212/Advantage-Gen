const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    default: function() {
      return `Campaign ${new Date().toLocaleDateString()}`;
    }
  },
  
  // Prompt Information
  originalPrompt: {
    type: String,
    required: true,
  },
  enhancedPrompt: {
    type: String,
  },
  
  // Settings
  style: {
    type: String,
    default: 'photorealistic'
  },
  platform: {
    type: String,
    default: 'instagram'
  },
  tone: {
    type: String,
    default: 'professional'
  },
  
  // Image Assets
  imageData: {
    type: Object, // Store the full image object from generation
  },
  cloudinaryUrl: {
    type: String, // URL from Cloudinary
  },
  cloudinaryPublicId: {
    type: String, // For deleting/updating images
  },
  
  // Caption
  caption: {
    caption: String,
    hashtags: [String],
  },
  
  // Branding
  logoUsed: {
    type: Boolean,
    default: false,
  },
  ctaText: {
    type: String,
    default: 'Shop Now'
  },
  ctaColor: {
    type: String,
    default: '#007AFF'
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  
  // For Remix Feature
  parentCampaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    default: null
  },
  remixCount: {
    type: Number,
    default: 0
  },
  
  // User Info (if you add authentication later)
  userId: {
    type: String,
    default: 'anonymous'
  }
});

// Update the updatedAt timestamp on save
CampaignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Campaign', CampaignSchema);