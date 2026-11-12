import { computeImageStats, clamp } from './mathEngine';
import { ImageStats } from '../types';

export interface ProcessedImageData {
  originalDataUrl: string;
  grayscaleDataUrl: string;
  stats: ImageStats;
  width: number;
  height: number;
  backendAnalysisId?: string;
}

/**
 * Loads an image from a File and extracts its RGBA data and grayscale representation
 */
export async function processImageFile(file: File): Promise<ProcessedImageData> {
  return new Promise((resolve, reject) => {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      reject(new Error(`Unsupported image type "${file.type}". Please upload a PNG, JPEG, or WebP image.`));
      return;
    }

    // Size limit: 15MB
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      reject(new Error(`File size ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds maximum allowed limit (15MB).`));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read the selected file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode the image file. Ensure it is a valid, uncorrupted image.'));
      img.onload = () => {
        try {
          const result = processHtmlImage(img, reader.result as string);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Processes an HTMLImageElement through Canvas
 */
export function processHtmlImage(img: HTMLImageElement, originalDataUrl: string): ProcessedImageData {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  if (width === 0 || height === 0) {
    throw new Error('Image has zero dimensions.');
  }

  // Create canvas for reading pixel data
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not initialize 2D canvas context.');

  // Composite over pure white background to handle transparency
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, width, height);
  const stats = computeImageStats(imgData.data, width, height);

  // Render visual grayscale image to canvas
  const grayCanvas = document.createElement('canvas');
  grayCanvas.width = width;
  grayCanvas.height = height;
  const grayCtx = grayCanvas.getContext('2d');
  if (!grayCtx) throw new Error('Could not create grayscale canvas context.');

  const grayImgData = grayCtx.createImageData(width, height);
  const lum = stats.luminanceMatrix!;

  for (let i = 0; i < stats.totalPixels; i++) {
    const v = clamp(Math.round(lum[i]), 0, 255);
    const idx = i * 4;
    grayImgData.data[idx] = v;     // R
    grayImgData.data[idx + 1] = v; // G
    grayImgData.data[idx + 2] = v; // B
    grayImgData.data[idx + 3] = 255; // Alpha
  }

  grayCtx.putImageData(grayImgData, 0, 0);
  const grayscaleDataUrl = grayCanvas.toDataURL('image/png');

  return {
    originalDataUrl,
    grayscaleDataUrl,
    stats,
    width,
    height
  };
}

/**
 * Generates an updated grayscale DataURL from transformed luminance
 */
export function createDataUrlFromLuminance(
  luminance: Float32Array,
  width: number,
  height: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const imgData = ctx.createImageData(width, height);
  const total = width * height;

  for (let i = 0; i < total; i++) {
    const v = clamp(Math.round(luminance[i]), 0, 255);
    const idx = i * 4;
    imgData.data[idx] = v;
    imgData.data[idx + 1] = v;
    imgData.data[idx + 2] = v;
    imgData.data[idx + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Creates built-in mathematical sample images
 */
export function generateSampleImage(type: 'gaussian' | 'gradient' | 'benchmark' | 'academic'): ProcessedImageData {
  const canvas = document.createElement('canvas');
  
  if (type === 'benchmark') {
    // 3x3 Benchmark matrix scaled up cleanly for visual inspection
    // Matrix: [[10, 20, 30], [40, 50, 60], [70, 80, 90]]
    const matrix = [
      [10, 20, 30],
      [40, 50, 60],
      [70, 80, 90]
    ];
    canvas.width = 3;
    canvas.height = 3;
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.createImageData(3, 3);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const val = matrix[r][c];
        const idx = (r * 3 + c) * 4;
        imgData.data[idx] = val;
        imgData.data[idx + 1] = val;
        imgData.data[idx + 2] = val;
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } else if (type === 'gradient') {
    // 120x80 linear diagonal gradient ramp
    canvas.width = 120;
    canvas.height = 80;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 120, 80);
    grad.addColorStop(0, '#000000');
    grad.addColorStop(0.5, '#4F46E5');
    grad.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 120, 80);
  } else if (type === 'gaussian') {
    // 100x100 2D Gaussian brightness field B(x,y) = 255 * exp(-((x-50)^2 + (y-50)^2)/(2*sigma^2))
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.createImageData(100, 100);
    const sigmaSq = 20 * 20 * 2;
    for (let y = 0; y < 100; y++) {
      for (let x = 0; x < 100; x++) {
        const distSq = (x - 50) ** 2 + (y - 50) ** 2;
        const b = Math.round(255 * Math.exp(-distSq / sigmaSq));
        const idx = (y * 100 + x) * 4;
        // Color with subtle blue-purple intensity gradient
        imgData.data[idx] = Math.round(b * 0.9);
        imgData.data[idx + 1] = Math.round(b * 0.95);
        imgData.data[idx + 2] = b;
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } else {
    // 'academic' - Geometric rings & step gradient pattern
    canvas.width = 120;
    canvas.height = 120;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1E1B4B';
    ctx.fillRect(0, 0, 120, 120);

    // Draw concentric circles
    const colors = ['#312E81', '#3730A3', '#4338CA', '#6366F1', '#A5B4FC', '#FFFFFF'];
    for (let r = 55; r >= 10; r -= 9) {
      ctx.beginPath();
      ctx.arc(60, 60, r, 0, 2 * Math.PI);
      ctx.fillStyle = colors[Math.floor((55 - r) / 9)];
      ctx.fill();
    }
  }

  const dataUrl = canvas.toDataURL('image/png');
  const img = new Image();
  img.src = dataUrl;
  return processHtmlImage(img, dataUrl);
}

/**
 * Downsamples a luminance matrix to a max grid size (e.g. 80x80)
 * solely for responsive 3D surface rendering without lag.
 */
export function downsampleLuminanceFor3D(
  luminance: Float32Array,
  width: number,
  height: number,
  maxDimension = 75
): { data: number[][]; stepX: number; stepY: number; targetW: number; targetH: number } {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const targetW = Math.max(2, Math.round(width * scale));
  const targetH = Math.max(2, Math.round(height * scale));

  const stepX = width / targetW;
  const stepY = height / targetH;

  const data: number[][] = [];

  for (let ty = 0; ty < targetH; ty++) {
    const row: number[] = [];
    const srcY = Math.min(height - 1, Math.floor(ty * stepY));
    const rowOffset = srcY * width;
    for (let tx = 0; tx < targetW; tx++) {
      const srcX = Math.min(width - 1, Math.floor(tx * stepX));
      row.push(luminance[rowOffset + srcX]);
    }
    data.push(row);
  }

  return { data, stepX, stepY, targetW, targetH };
}
