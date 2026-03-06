const { GoogleGenerativeAI } = require('@google/generative-ai');

class CaptionService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateCaption(options) {
    const {
      prompt,           
      platform = 'instagram',  
      tone = 'professional',   
      productName = '',        
      keywords = [],           
      includeHashtags = true   
    } = options;

    try {
      console.log(`Generating ${platform} caption with ${tone} tone...`);

      const captionRequest = this.buildCaptionPrompt({
        prompt, platform, tone, productName, keywords, includeHashtags
      });

  
      const result = await this.model.generateContent(captionRequest);
      const response = await result.response;
      const text = response.text();

      
      return this.parseResponse(text, includeHashtags);

    } catch (error) {
      console.error('Caption generation error:', error.message);

      return this.getFallbackCaption(prompt, platform);
    }
  }

  buildCaptionPrompt(options) {
    const { prompt, platform, tone, productName, keywords, includeHashtags } = options;

    const platformRules = {
      instagram: `
        - First line should be catchy (hook)
        - Add 3-5 emojis
        - Use line breaks between sentences
        - Friendly and visual language
        - Max length: 2200 characters`,
      
      linkedin: `
        - Professional tone
        - Max 2 emojis
        - Focus on business value
        - Include industry insights
        - Max length: 3000 characters`,
      
      twitter: `
        - Super concise
        - Max 280 characters
        - Max 1-2 hashtags
        - Create curiosity`,
      
      facebook: `
        - Community focused
        - Encourage comments
        - Add 2-4 emojis
        - Storytelling approach`
    };

    const toneRules = {
      professional: "Use formal language, be authoritative, focus on quality",
      casual: "Use conversational language, be friendly, use everyday words",
      witty: "Use humor, be clever, add wordplay if possible",
      urgent: "Create FOMO, use words like 'now', 'limited', 'today'",
      inspirational: "Be motivational, use uplifting words, inspire action"
    };

    const hashtagInstruction = includeHashtags ? 
      `Add 10-15 relevant hashtags at the end. Mix of:
       - Popular tags (like #photography)
       - Niche tags (specific to topic)
       - Branded tags (if product name provided)
       Format hashtags with space between them` : '';

    return `You are a social media expert. Create a ${platform} caption.

CONTEXT:
Image shows: "${prompt}"
Product/Brand: ${productName || 'Not specified'}
Key words to include: ${keywords.join(', ') || 'Use relevant words from prompt'}

STYLE:
Tone: ${toneRules[tone]}
Platform rules: ${platformRules[platform]}

${hashtagInstruction}

FORMAT YOUR RESPONSE LIKE THIS:
---CAPTION---
[Your caption here]
${includeHashtags ? '---HASHTAGS---\n[Hashtags separated by spaces]' : ''}`;
  }

  parseResponse(text, includeHashtags) {
    let caption = '';
    let hashtags = [];
    const captionMatch = text.match(/---CAPTION---\n([\s\S]*?)(?=---HASHTAGS---|$)/);
    if (captionMatch) {
      caption = captionMatch[1].trim();
    }

    if (includeHashtags) {
      const hashtagsMatch = text.match(/---HASHTAGS---\n([\s\S]*?)$/);
      if (hashtagsMatch) {
        const hashtagText = hashtagsMatch[1].trim();
        hashtags = hashtagText.split(/\s+/).filter(tag => tag.startsWith('#'));
      }
    }

    if (includeHashtags && hashtags.length === 0) {
      hashtags = this.generateBasicHashtags(caption);
    }

    return {
      caption: caption || 'Check out this amazing image!',
      hashtags: hashtags,
      fullResponse: text
    };
  }

  generateBasicHashtags(text) {
    const words = text.toLowerCase().split(' ');
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    
    const keywords = words
      .filter(word => word.length > 3 && !commonWords.includes(word))
      .slice(0, 5)
      .map(word => '#' + word.replace(/[^a-z]/g, ''));

    const genericTags = ['#socialmedia', '#marketing', '#content', '#viral', '#trending'];
    
    return [...new Set([...keywords, ...genericTags])].slice(0, 10);
  }

  getFallbackCaption(prompt, platform) {
    const captions = {
      instagram: ` ${prompt}\n\nDouble tap if you love this! \n\n#amazing #photooftheday`,
      linkedin: `I'm excited to share this ${prompt}.\n\nWhat are your thoughts?`,
      twitter: `Check out this ${prompt}! `,
      facebook: `Look what I found! ${prompt} \n\nComment below!`
    };

    return {
      caption: captions[platform] || `Check out this ${prompt}!`,
      hashtags: ['#amazing', '#content', '#viral']
    };
  }

 
  async generateVariations(options, count = 3) {
    const variations = [];
    
    for (let i = 0; i < count; i++) {
      const variationOptions = {
        ...options,
        prompt: `${options.prompt} (version ${i + 1})`
      };
      
      const caption = await this.generateCaption(variationOptions);
      variations.push(caption);
    }
    
    return {
      variations,
      selected: variations[0] 
    };
  }

  getTones() {
    return [
      { id: 'professional', name: '👔 Professional', emoji: '👔' },
      { id: 'casual', name: '😊 Casual', emoji: '😊' },
      { id: 'witty', name: '😄 Witty', emoji: '😄' },
      { id: 'urgent', name: '⚡ Urgent', emoji: '⚡' },
      { id: 'inspirational', name: '✨ Inspirational', emoji: '✨' }
    ];
  }

  getPlatforms() {
    return [
      { id: 'instagram', name: '📷 Instagram', icon: '📷' },
      { id: 'linkedin', name: '💼 LinkedIn', icon: '💼' },
      { id: 'twitter', name: '🐦 Twitter', icon: '🐦' },
      { id: 'facebook', name: '📘 Facebook', icon: '📘' }
    ];
  }
}

module.exports = new CaptionService();