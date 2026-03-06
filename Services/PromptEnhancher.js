const { GoogleGenerativeAI } = require('@google/generative-ai');

class PromptEnhancerService {
  constructor() {

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async enhancePrompt(userPrompt, style = 'photorealistic') {
    try {
    
      if (!userPrompt || userPrompt.trim().length === 0) {
        throw new Error('Prompt cannot be empty');
      }

      const enhancementPrompt = this.buildEnhancementPrompt(userPrompt, style);
      
    
      const result = await this.model.generateContent(enhancementPrompt);
      const response = await result.response;
      const enhancedPrompt = response.text().trim();

      return {
        success: true,
        original: userPrompt,
        enhanced: enhancedPrompt,
        style: style,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error enhancing prompt:', error.message);
      
    
      return {
        success: false,
        original: userPrompt,
        enhanced: userPrompt, 
        style: style,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  buildEnhancementPrompt(userPrompt, style) {
    const styleInstructions = {
      photorealistic: `Create a PHOTOREALISTIC description:
        - Add details about lighting (soft, dramatic, golden hour)
        - Add texture details (smooth, rough, glossy)
        - Add quality terms (8K, highly detailed, sharp focus)
        - Add camera terms (DSLR, macro lens, bokeh)`,
      
      cinematic: `Create a CINEMATIC description:
        - Add movie-like lighting
        - Add dramatic atmosphere
        - Add composition details (rule of thirds)
        - Add mood and emotion`,
      
      artistic: `Create an ARTISTIC description:
        - Add creative interpretation
        - Add unique color palette
        - Add artistic style (impressionist, modern)
        - Add expressive elements`,
      
      product: `Create a PRODUCT PHOTOGRAPHY description:
        - Add studio lighting setup
        - Add clean background
        - Add product details and textures
        - Add commercial appeal`
    };

   
    const styleInstruction = styleInstructions[style] || styleInstructions.photorealistic;

    return `You are an expert AI image prompt engineer. Your task is to expand this basic prompt into a highly detailed, image-generator-optimized prompt.

Basic prompt: "${userPrompt}"

${styleInstruction}

REQUIREMENTS:
- Keep it under 200 words
- Focus on VISUAL elements only
- Add specific details about: lighting, composition, colors, atmosphere
- Include quality boosters: "masterpiece", "high quality", "detailed"
- DO NOT add any explanations or comments
- Return ONLY the enhanced prompt text

Enhanced prompt:`;
  }
  getStyles() {
    return [
      { id: 'photorealistic', name: 'Photorealistic', description: 'Looks like a real photo' },
      { id: 'cinematic', name: 'Cinematic', description: 'Movie-like dramatic scenes' },
      { id: 'artistic', name: 'Artistic', description: 'Creative and expressive' },
      { id: 'product', name: 'Product', description: 'Professional product shots' }
    ];
  }
}
module.exports = new PromptEnhancerService();
