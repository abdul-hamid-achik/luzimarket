import OpenAI from 'openai';
import { uploadBlob } from './blob';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_SECRET_KEY,
});

interface GenerateImageOptions {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  n?: number;
}

/**
 * Generate an image using OpenAI's DALL-E 3
 * Returns the URL of the generated image
 */
export async function generateImage(options: GenerateImageOptions): Promise<string> {
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: options.prompt,
      size: options.size || '1024x1024',
      quality: options.quality || 'standard',
      style: options.style || 'natural',
      n: options.n || 1,
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    return imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

/**
 * Generate and upload an image to Vercel Blob storage
 * Returns the blob URL
 */
export async function generateAndUploadImage(
  prompt: string,
  filename: string,
  options?: Omit<GenerateImageOptions, 'prompt'>
): Promise<string> {
  try {
    // Generate image
    const imageUrl = await generateImage({ prompt, ...options });
    
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch generated image');
    }
    
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    
    // Upload to blob storage
    const blob = await uploadBlob(
      `ai-generated/${filename}`,
      imageBuffer,
      { contentType: 'image/png' }
    );
    
    return blob.url;
  } catch (error) {
    console.error('Error generating and uploading image:', error);
    throw error;
  }
}

/**
 * Generate product image prompt based on product details
 */
export function generateProductImagePrompt(product: {
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
}): string {
  const basePrompt = `A professional product photograph of ${product.name}`;
  
  const details = [];
  
  if (product.category) {
    details.push(`in the ${product.category} category`);
  }
  
  if (product.description) {
    details.push(product.description);
  }
  
  if (product.tags && product.tags.length > 0) {
    details.push(`featuring ${product.tags.join(', ')}`);
  }
  
  // Add consistent styling
  details.push('on a clean white background');
  details.push('with soft studio lighting');
  details.push('high quality e-commerce photography');
  details.push('elegant and minimalist style');
  
  return `${basePrompt}, ${details.join(', ')}`;
}

/**
 * Generate category image prompt
 */
export function generateCategoryImagePrompt(category: {
  name: string;
  description?: string;
}): string {
  const basePrompt = `A lifestyle photograph representing the ${category.name} category`;
  
  const details = [];
  
  if (category.description) {
    details.push(category.description);
  }
  
  // Add consistent styling for categories
  details.push('elegant and sophisticated composition');
  details.push('warm and inviting atmosphere');
  details.push('luxury gift aesthetic');
  details.push('soft natural lighting');
  details.push('high-end editorial style');
  
  return `${basePrompt}, ${details.join(', ')}`;
}