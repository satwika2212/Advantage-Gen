const express = require('express');
const router = express.Router();
const multer = require('multer');

// Import services
const promptEnhancer = require('../Services/PromptEnhancher');
const huggingFace = require('../Services/HuggingFace');
const captionService = require('../Services/captionServices');  
const imageCompositor = require('../Services/imageCompositer');       
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  }
});
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'API is working!' });
});

router.get('/styles', (req, res) => {
  res.json({ success: true, data: promptEnhancer.getStyles() });
});

router.post('/enhance-prompt', async (req, res) => {
  try {
    const { prompt, style = 'photorealistic' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });
    
    const result = await promptEnhancer.enhancePrompt(prompt, style);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-image', async (req, res) => {
  try {
    const { prompt, useEnhanced = true, style = 'photorealistic' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });

    let finalPrompt = prompt;
    if (useEnhanced) {
      const enhanced = await promptEnhancer.enhancePrompt(prompt, style);
      finalPrompt = enhanced.enhanced;
    }

    const image = await huggingFace.generateImage(finalPrompt);
    res.json({ success: true, data: image });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-caption', async (req, res) => {
  try {
    const {
      prompt,
      platform = 'instagram',
      tone = 'professional',
      productName = '',
      keywords = [],
      includeHashtags = true
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const caption = await captionService.generateCaption({
      prompt,
      platform,
      tone,
      productName,
      keywords,
      includeHashtags
    });

    res.json({
      success: true,
      data: caption
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/caption-variations', async (req, res) => {
  try {
    const { prompt, platform, tone, count = 3 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt required' });
    }

    const result = await captionService.generateVariations({
      prompt, platform, tone
    }, count);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/upload-logo', upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const base64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

    res.json({
      success: true,
      data: {
        filename: req.file.originalname,
        size: req.file.size,
        dataUrl: dataUrl,
        buffer: base64
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/composite-image', async (req, res) => {
  try {
    const {
      imageData,      
      logoData,       
      ctaText = 'Shop Now',
      ctaColor = '#007AFF',
      logoPosition = 'top-left',
      ctaPosition = 'bottom-right',
      logoOpacity = 0.8,
      logoSize = 100
    } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Image data required' });
    }

    // Convert data URLs to buffers
    const imageBuffer = Buffer.from(imageData.split(',')[1] || imageData, 'base64');
    let logoBuffer = null;
    
    if (logoData) {
      logoBuffer = Buffer.from(logoData.split(',')[1] || logoData, 'base64');
    }

    // Composite the image
    const result = await imageCompositor.compositeImage({
      imageBuffer,
      logoBuffer,
      ctaText,
      ctaColor,
      logoPosition,
      ctaPosition,
      logoOpacity,
      logoSize
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/full-campaign', async (req, res) => {
  try {
    const {
      prompt,
      style = 'photorealistic',
      platform = 'instagram',
      tone = 'professional',
      productName = '',
      logoData,
      ctaText = 'Shop Now',
      ctaColor = '#007AFF',
      logoPosition = 'top-left',
      logoOpacity = 0.8
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt required' });
    }

    console.log(' Starting full campaign generation...');

    // STEP 1: Enhance prompt
    console.log(' Step 1: Enhancing prompt...');
    const enhanced = await promptEnhancer.enhancePrompt(prompt, style);

    // STEP 2: Generate image
    console.log(' Step 2: Generating image...');
    const image = await huggingFace.generateImage(enhanced.enhanced);

    // STEP 3: Generate caption (parallel)
    console.log('Step 3: Generating caption...');
    const captionPromise = captionService.generateCaption({
      prompt: enhanced.enhanced,
      platform,
      tone,
      productName
    });

    // STEP 4: Composite image (if logo provided)
    console.log('Step 4: Adding branding...');
    let compositedImage = null;
    if (logoData) {
      const imageBuffer = Buffer.from(image.dataUrl.split(',')[1], 'base64');
      const logoBuffer = Buffer.from(logoData.split(',')[1], 'base64');
      
      compositedImage = await imageCompositor.compositeImage({
        imageBuffer,
        logoBuffer,
        ctaText,
        ctaColor,
        logoPosition,
        logoOpacity
      });
    }

    // Wait for caption
    const caption = await captionPromise;

    res.json({
      success: true,
      data: {
        campaignId: `camp_${Date.now()}`,
        timestamp: new Date().toISOString(),
        originalPrompt: prompt,
        enhancedPrompt: enhanced.enhanced,
        image: image.dataUrl,
        brandedImage: compositedImage?.dataUrl || null,
        caption: caption.caption,
        hashtags: caption.hashtags,
        platform,
        tone
      }
    });

  } catch (error) {
    console.error('Campaign error:', error);
    res.status(500).json({ error: error.message });
  }
});
router.get('/options', (req, res) => {
  res.json({
    success: true,
    data: {
      tones: captionService.getTones(),
      platforms: captionService.getPlatforms(),
      positions: imageCompositor.getPositions(),
      ctaTexts: imageCompositor.getCTAOptions(),
      ctaColors: imageCompositor.getColorOptions()
    }
  });
});

module.exports = router;