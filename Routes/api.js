const express = require('express');
const router = express.Router();


const promptEnhancer = require('../Services/PromptEnhancher');
const huggingFace = require('../Services/HuggingFace');

router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

router.get('/styles', (req, res) => {
  const styles = promptEnhancer.getStyles();
  res.json({
    success: true,
    data: styles
  });
});

router.post('/enhance-prompt', async (req, res) => {
  try {
    const { prompt, style = 'photorealistic' } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a prompt'
      });
    }

    console.log(`Enhancing prompt: "${prompt}" with style: ${style}`);


    const result = await promptEnhancer.enhancePrompt(prompt, style);

   
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Something went wrong'
    });
  }
});

router.post('/generate-image', async (req, res) => {
  try {
    const { 
      prompt, 
      useEnhanced = true,
      style = 'photorealistic',
      options = {} 
    } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a prompt'
      });
    }


    const validation = huggingFace.validatePrompt(prompt);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    console.log('Starting image generation process...');
    console.log(`Original prompt: "${prompt}"`);

    let finalPrompt = prompt;
    let enhancementResult = null;

    if (useEnhanced) {
      console.log('Enhancing prompt...');
      enhancementResult = await promptEnhancer.enhancePrompt(prompt, style);
      finalPrompt = enhancementResult.enhanced;
      console.log(`Enhanced prompt: "${finalPrompt.substring(0, 100)}..."`);
    }

    console.log('Generating image with Hugging Face...');
    const imageResult = await huggingFace.generateWithRetry(finalPrompt, options);

    res.json({
      success: true,
      data: {
        image: imageResult.dataUrl,  
        format: imageResult.format,
        
      
        prompts: {
          original: prompt,
          enhanced: finalPrompt,
          enhancedByAI: enhancementResult?.enhanced !== prompt
        },
    
        metadata: {
          model: imageResult.metadata.model,
          options: imageResult.metadata.options,
          generationTime: imageResult.metadata.timestamp,
          enhancement: enhancementResult ? {
            style: enhancementResult.style,
            timestamp: enhancementResult.timestamp
          } : null
        }
      }
    });

  } catch (error) {
    console.error('Image generation route error:', error);
    
    const status = error.message.includes('loading') ? 503 : 500;
    
    res.status(status).json({
      success: false,
      error: error.message,
      tip: error.message.includes('loading') 
        ? '⏳ The model is loading. Please wait 20 seconds and try again.' 
        : 'Please check your inputs and try again.'
    });
  }
});

router.post('/full-pipeline', async (req, res) => {
  try {
    const { prompt, style = 'photorealistic', options = {} } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a prompt'
      });
    }

    console.log('Running full pipeline...');

    console.log('Step 1: Enhancing prompt...');
    const enhanced = await promptEnhancer.enhancePrompt(prompt, style);

    console.log('Step 2: Generating image...');
    const image = await huggingFace.generateWithRetry(enhanced.enhanced, options);

    res.json({
      success: true,
      data: {
        originalPrompt: prompt,
        enhancedPrompt: enhanced.enhanced,
        image: image.dataUrl,
        style: style,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Pipeline error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;