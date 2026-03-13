const axios = require('axios');

class HuggingFaceService {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.model = process.env.IMAGE_MODEL;
    if (!this.model) {
  throw new Error("IMAGE_MODEL not set in .env");
}
    this.baseUrl = 'https://api-inference.huggingface.co/models/';
  }

  
  async generateImage(prompt, options = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('Hugging Face API key is missing');
      }

      if (!prompt || prompt.trim().length === 0) {
        throw new Error('Prompt cannot be empty');
      }

      
      const defaultOptions = {
        negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy",
        num_inference_steps: 30,
        guidance_scale: 7.5,
        width: 1024,
        height: 1024
      };

     
      const generationOptions = { ...defaultOptions, ...options };

      console.log('Generating image for prompt:', prompt.substring(0, 100) + '...');

      
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}${this.model}`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          inputs: prompt,
          parameters: generationOptions
        },
        responseType: 'arraybuffer', 
        timeout: 60000 
      });

      
      const contentType = response.headers['content-type'];
      
      if (!contentType || !contentType.includes('image')) {
        const errorText = response.data.toString();
        throw new Error(`API returned: ${errorText.substring(0, 200)}`);
      }

      
      const imageBuffer = response.data;
      const base64Image = imageBuffer.toString('base64');
      const dataUrl = `data:${contentType};base64,${base64Image}`;

      return {
        success: true,
        buffer: imageBuffer,        
        base64: base64Image,        
        dataUrl: dataUrl,           
        format: contentType.split('/')[1] || 'png',
        metadata: {
          prompt: prompt,
          model: this.model,
          options: generationOptions,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Image generation error:', error.message);
      
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. The model is taking too long.');
      }
      
      if (error.response?.status === 503) {
        throw new Error('Model is loading. Please try again in 10-20 seconds.');
      }

      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  
  async generateWithRetry(prompt, options = {}, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateImage(prompt, options);
      } catch (error) {
        console.log(`Attempt ${attempt} failed: ${error.message}`);
        
        if (attempt === maxRetries) {
          throw error; 
        }
        
        
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }


  validatePrompt(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      return { valid: false, error: 'Prompt must be text' };
    }
    
    if (prompt.length > 1000) {
      return { valid: false, error: 'Prompt too long (max 1000 characters)' };
    }
    
    return { valid: true };
  }
}


module.exports = new HuggingFaceService();