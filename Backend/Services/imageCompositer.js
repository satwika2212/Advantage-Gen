
const sharp = require('sharp');
const axios = require('axios');

class ImageCompositorService {
  constructor() {
    const fs = require('fs');
    if (!fs.existsSync('./uploads')) {
      fs.mkdirSync('./uploads');
    }
  }

  async compositeImage(options) {
    const {
      imageBuffer,           
      logoBuffer,            
      ctaText = 'Shop Now',  
      ctaColor = '#007AFF',  
      logoPosition = 'top-left',     
      ctaPosition = 'bottom-right',  
      logoOpacity = 0.8,      
      logoSize = 100          
    } = options;

    try {
      console.log('Starting image compositing...');
      
      // Load the main image
      let image = sharp(imageBuffer);
      
      // Get image dimensions
      const metadata = await image.metadata();
      console.log(`Image size: ${metadata.width} x ${metadata.height}`);

      // STEP 1: Add logo if provided
      if (logoBuffer) {
        image = await this.addLogo(image, logoBuffer, {
          position: logoPosition,
          opacity: logoOpacity,
          size: logoSize,
          imageWidth: metadata.width,
          imageHeight: metadata.height
        });
        console.log('Logo added');
      }

      // STEP 2: Add CTA button
      image = await this.addCTA(image, {
        text: ctaText,
        color: ctaColor,
        position: ctaPosition,
        imageWidth: metadata.width,
        imageHeight: metadata.height
      });
      console.log('CTA button added');

      // Get final image
      const finalBuffer = await image.toBuffer();
      const base64Image = finalBuffer.toString('base64');

      return {
        success: true,
        buffer: finalBuffer,
        dataUrl: `data:image/jpeg;base64,${base64Image}`,
        format: 'jpeg'
      };

    } catch (error) {
      console.error('Compositing error:', error.message);
      throw new Error(`Failed to composite image: ${error.message}`);
    }
  }

  async addLogo(image, logoBuffer, options) {
    const { position, opacity, size, imageWidth, imageHeight } = options;

    // Resize logo
    let logo = sharp(logoBuffer)
      .resize(size, null, { fit: 'contain' })
      .png();

    // Apply opacity if needed
    if (opacity < 1) {
      const logoMetadata = await logo.metadata();
      const logoPixels = await logo.raw().toBuffer();
      
      // Create RGBA buffer with opacity
      const rgbaBuffer = Buffer.alloc(logoPixels.length * 4 / 3);
      for (let i = 0; i < logoPixels.length; i += 3) {
        rgbaBuffer[i * 4 / 3] = logoPixels[i];        // R
        rgbaBuffer[i * 4 / 3 + 1] = logoPixels[i + 1]; // G
        rgbaBuffer[i * 4 / 3 + 2] = logoPixels[i + 2]; // B
        rgbaBuffer[i * 4 / 3 + 3] = Math.round(255 * opacity); // A
      }
      
      logo = sharp(rgbaBuffer, {
        raw: {
          width: logoMetadata.width,
          height: logoMetadata.height,
          channels: 4
        }
      });
    }

    const logoBuffer_withOpacity = await logo.toBuffer();

    // Calculate position
    const logoMetadata = await sharp(logoBuffer_withOpacity).metadata();
    const padding = 20;

    let left = padding;
    let top = padding;

    if (position === 'top-right') {
      left = imageWidth - logoMetadata.width - padding;
    } else if (position === 'bottom-left') {
      top = imageHeight - logoMetadata.height - padding;
    } else if (position === 'bottom-right') {
      left = imageWidth - logoMetadata.width - padding;
      top = imageHeight - logoMetadata.height - padding;
    }

    // Composite logo onto image
    return image.composite([{
      input: logoBuffer_withOpacity,
      top: Math.round(top),
      left: Math.round(left)
    }]);
  }


  async addCTA(image, options) {
    const { text, color, position, imageWidth, imageHeight } = options;

    // Create button as SVG
    const buttonWidth = 160;
    const buttonHeight = 50;
    const fontSize = 20;
    const padding = 20;

    // Create SVG button
    const buttonSvg = `
      <svg width="${buttonWidth}" height="${buttonHeight}">
        <rect
          x="0"
          y="0"
          width="${buttonWidth}"
          height="${buttonHeight}"
          rx="8"
          fill="${color}"
        />
        <text
          x="${buttonWidth / 2}"
          y="${buttonHeight / 2 + 6}"
          font-family="Arial, sans-serif"
          font-size="${fontSize}"
          fill="white"
          text-anchor="middle"
          dominant-baseline="middle"
        >${text}</text>
      </svg>
    `;

    const buttonBuffer = Buffer.from(buttonSvg);

    // Calculate position
    let left = padding;
    let top = padding;

    if (position === 'top-right') {
      left = imageWidth - buttonWidth - padding;
    } else if (position === 'bottom-left') {
      top = imageHeight - buttonHeight - padding;
    } else if (position === 'bottom-right') {
      left = imageWidth - buttonWidth - padding;
      top = imageHeight - buttonHeight - padding;
    } else if (position === 'center') {
      left = (imageWidth - buttonWidth) / 2;
      top = (imageHeight - buttonHeight) / 2;
    }

    // Composite button onto image
    return image.composite([{
      input: buttonBuffer,
      top: Math.round(top),
      left: Math.round(left)
    }]);
  }

 
  getPositions() {
    return [
      { id: 'top-left', name: 'Top Left' },
      { id: 'top-right', name: 'Top Right' },
      { id: 'bottom-left', name: 'Bottom Left' },
      { id: 'bottom-right', name: 'Bottom Right' },
      { id: 'center', name: 'Center' }
    ];
  }

  
  getCTAOptions() {
    return [
      'Shop Now',
      'Learn More',
      'Sign Up',
      'Book Now',
      'Download',
      'Contact Us',
      'Get Started',
      'Buy Now'
    ];
  }


  getColorOptions() {
    return [
      { name: 'Blue', value: '#007AFF' },
      { name: 'Green', value: '#34C759' },
      { name: 'Red', value: '#FF3B30' },
      { name: 'Orange', value: '#FF9500' },
      { name: 'Purple', value: '#5856D6' },
      { name: 'Black', value: '#000000' }
    ];
  }
}

module.exports = new ImageCompositorService();
