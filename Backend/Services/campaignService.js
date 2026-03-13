const Campaign = require('../models/Campaign');
const { uploadToCloudinary } = require('./cloudinaryUpload');

class CampaignService {
  /**
   * Save a generated campaign to MongoDB and Cloudinary
   */
  async saveCampaign(campaignData) {
    try {
      const {
        originalPrompt,
        enhancedPrompt,
        style,
        platform,
        tone,
        imageData,
        caption,
        ctaText,
        ctaColor,
        logoUsed,
        parentCampaignId
      } = campaignData;

      // Upload image to Cloudinary first
      let cloudinaryResult = null;
      if (imageData && imageData.buffer) {
        cloudinaryResult = await uploadToCloudinary(
          imageData.buffer,
          'advantagegen'
        );
      }

      // Create campaign document
      const campaign = new Campaign({
  originalPrompt,
  enhancedPrompt,
  style,
  platform,
  tone,
  imageData: {
    prompt: imageData?.metadata?.prompt,
    model: imageData?.metadata?.model
  },
  cloudinaryUrl: cloudinaryResult?.secure_url,
  cloudinaryPublicId: cloudinaryResult?.public_id,
        caption,
        ctaText,
        ctaColor,
        logoUsed: !!logoUsed,
        parentCampaignId: parentCampaignId || null
      });

      // If this is a remix, increment parent's remix count
      if (parentCampaignId) {
        await Campaign.findByIdAndUpdate(parentCampaignId, {
          $inc: { remixCount: 1 }
        });
      }

      // Save to MongoDB
      const savedCampaign = await campaign.save();
      console.log(`✅ Campaign saved to MongoDB with ID: ${savedCampaign._id}`);

      return {
        success: true,
        campaign: savedCampaign
      };
    } catch (error) {
      console.error('❌ Error saving campaign:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all saved campaigns
   */
  async getAllCampaigns(limit = 20, skip = 0) {
    try {
      const campaigns = await Campaign.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
      
      return {
        success: true,
        campaigns
      };
    } catch (error) {
      console.error('❌ Error fetching campaigns:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaignById(id) {
    try {
      const campaign = await Campaign.findById(id);
      if (!campaign) {
        return {
          success: false,
          error: 'Campaign not found'
        };
      }
      return {
        success: true,
        campaign
      };
    } catch (error) {
      console.error('❌ Error fetching campaign:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a remix of an existing campaign
   */
  async createRemix(originalCampaignId, modifications) {
    try {
      // Get original campaign
      const original = await Campaign.findById(originalCampaignId);
      if (!original) {
        throw new Error('Original campaign not found');
      }

      // Create modified prompt
      const modifiedPrompt = this.modifyPrompt(
  original.originalPrompt,
  modifications,
  original
);

      // Return data needed for regeneration
      return {
        success: true,
        remixData: {
          originalPrompt: modifiedPrompt,
          style: modifications.style || original.style,
          platform: modifications.platform || original.platform,
          tone: modifications.tone || original.tone,
          ctaText: modifications.ctaText || original.ctaText,
          ctaColor: modifications.ctaColor || original.ctaColor,
          parentCampaignId: originalCampaignId
        }
      };
    } catch (error) {
      console.error('❌ Error creating remix:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Helper to modify prompts for remix
   */
  modifyPrompt(originalPrompt, modifications, original) {
    let prompt = originalPrompt;

    // Add modifiers based on what user wants to change
    if (modifications.style !== original.style) {
      prompt = `[Style: ${modifications.style}] ${prompt}`;
    }
    
    if (modifications.tone !== original.tone) {
      prompt = `[Tone: ${modifications.tone}] ${prompt}`;
    }

    if (modifications.customModifier) {
      prompt = `${modifications.customModifier}. ${prompt}`;
    }

    return prompt;
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(id) {
    try {
      const campaign = await Campaign.findById(id);
      if (!campaign) {
        return {
          success: false,
          error: 'Campaign not found'
        };
      }

      // Delete from Cloudinary if exists
      if (campaign.cloudinaryPublicId) {
        const { deleteFromCloudinary } = require('./cloudinaryUpload');
        await deleteFromCloudinary(campaign.cloudinaryPublicId);
      }

      // Delete from MongoDB
      await Campaign.findByIdAndDelete(id);

      return {
        success: true,
        message: 'Campaign deleted successfully'
      };
    } catch (error) {
      console.error('❌ Error deleting campaign:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new CampaignService();