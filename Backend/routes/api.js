const express = require('express');
const router = express.Router();
const multer = require('multer');

// Import services
const promptEnhancer = require('../Services/PromptEnhancher');
const huggingFace = require('../Services/HuggingFace');
const captionService = require('../Services/captionServices');
const imageCompositor = require('../Services/imageCompositer');

// Import campaign service with try-catch to handle missing module
let campaignService;
try {
  campaignService = require('../Services/campaignService');
} catch (error) {
  console.log('⚠️ Campaign service not available, continuing without persistence');
  campaignService = null;
}
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  }
});

// ========== TEST ROUTE ==========
router.get('/test', (req, res) => {
  console.log('✅ Test endpoint hit');
  res.json({ 
    success: true, 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// ========== STYLES ROUTE ==========
router.get('/styles', (req, res) => {
  try {
    const styles = promptEnhancer.getStyles ? promptEnhancer.getStyles() : [
      { id: 'photorealistic', name: '📸 Photorealistic', description: 'Looks like a real photo' },
      { id: 'cinematic', name: '🎬 Cinematic', description: 'Movie-like dramatic scenes' },
      { id: 'artistic', name: '🎨 Artistic', description: 'Creative and expressive' }
    ];
    res.json({ success: true, data: styles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== OPTIONS ROUTE ==========
router.get('/options', (req, res) => {
  try {
    const options = {
      styles: [
        { id: 'photorealistic', name: '📸 Photorealistic', description: 'Looks like a real photo' },
        { id: 'cinematic', name: '🎬 Cinematic', description: 'Movie-like dramatic scenes' },
        { id: 'artistic', name: '🎨 Artistic', description: 'Creative and expressive' },
        { id: 'product', name: '📦 Product', description: 'Professional product shots' }
      ],
      tones: [
        { id: 'professional', name: '👔 Professional' },
        { id: 'casual', name: '😊 Casual' },
        { id: 'witty', name: '😄 Witty' },
        { id: 'urgent', name: '⚡ Urgent' },
        { id: 'inspirational', name: '✨ Inspirational' }
      ],
      platforms: [
        { id: 'instagram', name: '📷 Instagram' },
        { id: 'linkedin', name: '💼 LinkedIn' },
        { id: 'twitter', name: '🐦 Twitter' },
        { id: 'facebook', name: '📘 Facebook' }
      ],
      ctaTexts: [
        'Shop Now', 'Learn More', 'Sign Up', 'Book Now', 'Download', 'Contact Us'
      ]
    };
    res.json({ success: true, data: options });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== ENHANCE PROMPT ==========
router.post('/enhance-prompt', async (req, res) => {
  try {
    const { prompt, style = 'photorealistic' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });
    
    console.log('Enhancing prompt:', prompt);
    const result = await promptEnhancer.enhancePrompt(prompt, style);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Enhance error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== GENERATE IMAGE ==========
router.post('/generate-image', async (req, res) => {
  try {
    const { prompt, useEnhanced = true, style = 'photorealistic' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });

    let finalPrompt = prompt;
    if (useEnhanced) {
      const enhanced = await promptEnhancer.enhancePrompt(prompt, style);
      finalPrompt = enhanced.enhanced;
    }

    console.log('Generating image for:', finalPrompt.substring(0, 100));
    const image = await huggingFace.generateImage(finalPrompt);
    res.json({ success: true, data: image });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== GENERATE CAPTION ==========
router.post('/generate-caption', async (req, res) => {
  try {
    const { prompt, platform = 'instagram', tone = 'professional', includeHashtags = true } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });

    console.log('Generating caption for:', prompt.substring(0, 100));
    const caption = await captionService.generateCaption({ 
      prompt, 
      platform, 
      tone, 
      includeHashtags 
    });
    res.json({ success: true, data: caption });
  } catch (error) {
    console.error('Caption error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== FULL CAMPAIGN ==========
router.post('/full-campaign', async (req, res) => {
  try {
    const {
      prompt,
      style = 'photorealistic',
      platform = 'instagram',
      tone = 'professional',
      logoData,
      ctaText = 'Shop Now',
      ctaColor = '#007AFF'
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt required' });
    }

    console.log('🚀 Starting full campaign generation...');
    console.log('Prompt:', prompt.substring(0, 100));

    // STEP 1: Enhance prompt
    console.log('📝 Step 1: Enhancing prompt...');
    const enhanced = await promptEnhancer.enhancePrompt(prompt, style);
    console.log('✅ Prompt enhanced');

    // STEP 2: Generate image
    console.log('🎨 Step 2: Generating image with Hugging Face...');
    const image = await huggingFace.generateImage(enhanced.enhanced);
    console.log('✅ Image generated');

    // STEP 3: Generate caption
    console.log('✍️ Step 3: Generating caption...');
    const caption = await captionService.generateCaption({
      prompt: enhanced.enhanced,
      platform,
      tone
    });
    console.log('✅ Caption generated');

    // STEP 4: Composite image if logo provided
    console.log('🖼️ Step 4: Adding branding...');
    let compositedImage = null;
    if (logoData) {
      try {
        const imageBuffer = Buffer.from(image.dataUrl.split(',')[1], 'base64');
        const logoBuffer = Buffer.from(
  logoData.split(',')[1] || logoData,
  'base64'
);
        
        compositedImage = await imageCompositor.compositeImage({
          imageBuffer,
          logoBuffer,
          ctaText,
          ctaColor
        });
        console.log('✅ Branding added');
      } catch (compositeError) {
        console.error('⚠️ Branding failed:', compositeError.message);
      }
    }

    // STEP 5: Save to database (if available)
    let savedCampaign = null;
    if (campaignService) {
      try {
        const saveResult = await campaignService.saveCampaign({
          originalPrompt: prompt,
          enhancedPrompt: enhanced.enhanced,
          style,
          platform,
          tone,
          imageData: image,
          caption,
          ctaText,
          ctaColor,
          logoUsed: !!logoData
        });
        
        if (saveResult.success) {
          savedCampaign = saveResult.campaign;
          console.log('✅ Campaign saved with ID:', savedCampaign._id);
        }
      } catch (saveError) {
        console.error('⚠️ Auto-save failed:', saveError.message);
      }
    }

    // Send response
    res.json({
      success: true,
      data: {
        campaignId: savedCampaign?._id || `camp_${Date.now()}`,
        timestamp: new Date().toISOString(),
        originalPrompt: prompt,
        enhancedPrompt: enhanced.enhanced,
        image: image,
        brandedImage: compositedImage,
        caption: caption,
        saved: !!savedCampaign
      }
    });

  } catch (error) {
    console.error('❌ Campaign error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.stack
    });
  }
});

// ========== UPLOAD LOGO ==========
router.post('/upload-logo', upload.single('logo'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const base64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

    res.json({
      success: true,
      data: {
        filename: req.file.originalname,
        size: req.file.size,
        dataUrl: dataUrl
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== COMPOSITE IMAGE ==========
router.post('/composite-image', async (req, res) => {
  try {
    const { imageData, logoData, ctaText = 'Shop Now', ctaColor = '#007AFF' } = req.body;
    if (!imageData) return res.status(400).json({ error: 'Image data required' });

    const imageBuffer = Buffer.from(imageData.split(',')[1] || imageData, 'base64');
    let logoBuffer = null;
    
    if (logoData) {
      logoBuffer = Buffer.from(logoData.split(',')[1] || logoData, 'base64');
    }

    const result = await imageCompositor.compositeImage({
      imageBuffer,
      logoBuffer,
      ctaText,
      ctaColor
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== CAMPAIGN ROUTES (if service exists) ==========
if (campaignService) {
  // Get all campaigns
  router.get('/campaigns', async (req, res) => {
    try {
      const { limit = 10, skip = 0 } = req.query;
      const result = await campaignService.getAllCampaigns(parseInt(limit), parseInt(skip));
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Save campaign
  router.post('/campaigns/save', async (req, res) => {
    try {
      const result = await campaignService.saveCampaign(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get single campaign
  router.get('/campaigns/:id', async (req, res) => {
    try {
      const result = await campaignService.getCampaignById(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Create remix
  router.post('/campaigns/:id/remix', async (req, res) => {
    try {
      const { modifications } = req.body;
      const result = await campaignService.createRemix(req.params.id, modifications || {});
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Delete campaign
  router.delete('/campaigns/:id', async (req, res) => {
    try {
      const result = await campaignService.deleteCampaign(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
} else {
  // Mock campaign routes when service not available
  router.get('/campaigns', (req, res) => {
    res.json({ success: true, campaigns: [] });
  });

  router.post('/campaigns/save', (req, res) => {
    res.json({ success: true, campaign: { _id: 'mock-' + Date.now() } });
  });
}

module.exports = router;