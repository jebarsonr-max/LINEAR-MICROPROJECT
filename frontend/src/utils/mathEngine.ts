import { ImageStats, RegionOfInterest, RegionStats, SimulationParams, SimulationResult } from '../types';

/**
 * Standard ITU-R BT.601 luminance coefficients
 * Gray = 0.299*R + 0.587*G + 0.114*B
 */
export function calculateLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Clamps a number between min and max
 */
export function clamp(val: number, min = 0, max = 255): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Analyzes raw RGBA pixel buffer and computes accurate mathematical stats.
 * Uses floating point accumulation for numerical stability.
 * Transparent pixels are pre-composited over a pure white background (255, 255, 255).
 */
export function computeImageStats(
  rgba: Uint8ClampedArray,
  width: number,
  height: number
): ImageStats {
  const totalPixels = width * height;
  if (totalPixels === 0) {
    return {
      width: 0,
      height: 0,
      totalPixels: 0,
      totalBrightness: 0,
      averageBrightness: 0,
      normalizedAverage: 0,
      minBrightness: 0,
      maxBrightness: 0,
      histogram: new Array(256).fill(0),
      luminanceMatrix: new Float32Array(0)
    };
  }

  const luminanceMatrix = new Float32Array(totalPixels);
  const histogram = new Array(256).fill(0);

  let totalBrightness = 0;
  let minBrightness = Infinity;
  let maxBrightness = -Infinity;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const rRaw = rgba[idx];
    const gRaw = rgba[idx + 1];
    const bRaw = rgba[idx + 2];
    const alpha = rgba[idx + 3] / 255;

    // Composite over white background: (c * alpha) + 255 * (1 - alpha)
    const r = rRaw * alpha + 255 * (1 - alpha);
    const g = gRaw * alpha + 255 * (1 - alpha);
    const b = bRaw * alpha + 255 * (1 - alpha);

    // Precise floating point luminance Gray(i,j)
    const lum = calculateLuminance(r, g, b);
    luminanceMatrix[i] = lum;
    totalBrightness += lum;

    if (lum < minBrightness) minBrightness = lum;
    if (lum > maxBrightness) maxBrightness = lum;

    // For histogram binning, round and clamp to [0..255]
    const bin = clamp(Math.round(lum), 0, 255);
    histogram[bin]++;
  }

  if (minBrightness === Infinity) minBrightness = 0;
  if (maxBrightness === -Infinity) maxBrightness = 0;

  const averageBrightness = totalBrightness / totalPixels;
  const normalizedAverage = (averageBrightness / 255) * 100;

  return {
    width,
    height,
    totalPixels,
    totalBrightness,
    averageBrightness,
    normalizedAverage,
    minBrightness,
    maxBrightness,
    luminanceMatrix,
    histogram
  };
}

/**
 * Calculates brightness stats for a 2D matrix of numbers
 */
export function computeMatrixStats(matrix: number[][]): {
  rows: number;
  cols: number;
  totalPixels: number;
  totalBrightness: number;
  averageBrightness: number;
  normalizedAverage: number;
  minBrightness: number;
  maxBrightness: number;
} {
  const rows = matrix.length;
  const cols = rows > 0 ? matrix[0].length : 0;
  const totalPixels = rows * cols;

  if (totalPixels === 0) {
    return {
      rows: 0,
      cols: 0,
      totalPixels: 0,
      totalBrightness: 0,
      averageBrightness: 0,
      normalizedAverage: 0,
      minBrightness: 0,
      maxBrightness: 0
    };
  }

  let totalBrightness = 0;
  let minBrightness = Infinity;
  let maxBrightness = -Infinity;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = matrix[r][c];
      totalBrightness += val;
      if (val < minBrightness) minBrightness = val;
      if (val > maxBrightness) maxBrightness = val;
    }
  }

  const averageBrightness = totalBrightness / totalPixels;
  const normalizedAverage = (averageBrightness / 255) * 100;

  return {
    rows,
    cols,
    totalPixels,
    totalBrightness,
    averageBrightness,
    normalizedAverage,
    minBrightness,
    maxBrightness
  };
}

/**
 * Computes region-based integration over a rectangular subregion (ROI)
 */
export function computeRegionStats(
  luminance: Float32Array,
  imageWidth: number,
  imageHeight: number,
  roi: RegionOfInterest
): RegionStats {
  // Normalize and clamp ROI bounds
  const x1 = roi.x;
  const x2 = roi.x + (roi.width > 0 ? roi.width - 1 : roi.width < 0 ? roi.width + 1 : 0);
  const y1 = roi.y;
  const y2 = roi.y + (roi.height > 0 ? roi.height - 1 : roi.height < 0 ? roi.height + 1 : 0);

  const startX = clamp(Math.floor(Math.min(x1, x2)), 0, imageWidth - 1);
  const endX = clamp(Math.floor(Math.max(x1, x2)), 0, imageWidth - 1);
  const startY = clamp(Math.floor(Math.min(y1, y2)), 0, imageHeight - 1);
  const endY = clamp(Math.floor(Math.max(y1, y2)), 0, imageHeight - 1);

  const regionW = Math.max(1, endX - startX + 1);
  const regionH = Math.max(1, endY - startY + 1);
  const pixelCount = regionW * regionH;

  const histogram = new Array(256).fill(0);
  let totalBrightness = 0;
  let minBrightness = Infinity;
  let maxBrightness = -Infinity;

  for (let y = startY; y <= endY; y++) {
    const rowOffset = y * imageWidth;
    for (let x = startX; x <= endX; x++) {
      const lum = luminance[rowOffset + x];
      totalBrightness += lum;
      if (lum < minBrightness) minBrightness = lum;
      if (lum > maxBrightness) maxBrightness = lum;

      const bin = clamp(Math.round(lum), 0, 255);
      histogram[bin]++;
    }
  }

  if (minBrightness === Infinity) minBrightness = 0;
  if (maxBrightness === -Infinity) maxBrightness = 0;

  const averageBrightness = totalBrightness / pixelCount;
  const normalizedAverage = (averageBrightness / 255) * 100;

  return {
    roi: { x: startX, y: startY, width: regionW, height: regionH },
    pixelCount,
    totalBrightness,
    averageBrightness,
    normalizedAverage,
    minBrightness,
    maxBrightness,
    histogram
  };
}

/**
 * Applies brightness and contrast transformation:
 * I_new = clamp(contrast * (I_orig - 127.5) + 127.5 + brightnessOffset, 0, 255)
 */
export function simulateTransformation(
  originalStats: ImageStats,
  params: SimulationParams
): SimulationResult {
  const { luminanceMatrix, width, height, totalPixels, totalBrightness: origTotal } = originalStats;

  if (!luminanceMatrix || totalPixels === 0) {
    return {
      stats: { ...originalStats },
      deltaTotal: 0,
      deltaAverage: 0,
      percentageChange: 0
    };
  }

  const transformedLuminance = new Float32Array(totalPixels);
  const histogram = new Array(256).fill(0);

  let newTotal = 0;
  let minBrightness = Infinity;
  let maxBrightness = -Infinity;

  const { contrast, brightnessOffset } = params;

  for (let i = 0; i < totalPixels; i++) {
    const origLum = luminanceMatrix[i];
    // Formula: I_new = clamp(contrast * (I_orig - 127.5) + 127.5 + brightnessOffset, 0, 255)
    const transformed = clamp(contrast * (origLum - 127.5) + 127.5 + brightnessOffset, 0, 255);
    transformedLuminance[i] = transformed;
    newTotal += transformed;

    if (transformed < minBrightness) minBrightness = transformed;
    if (transformed > maxBrightness) maxBrightness = transformed;

    const bin = clamp(Math.round(transformed), 0, 255);
    histogram[bin]++;
  }

  const newAverage = newTotal / totalPixels;
  const newNormalized = (newAverage / 255) * 100;

  const deltaTotal = newTotal - origTotal;
  const deltaAverage = newAverage - originalStats.averageBrightness;
  
  // Guard against division by zero if original total brightness is 0 (all black image)
  const percentageChange = origTotal > 0 ? (deltaTotal / origTotal) * 100 : null;

  const transformedStats: ImageStats = {
    width,
    height,
    totalPixels,
    totalBrightness: newTotal,
    averageBrightness: newAverage,
    normalizedAverage: newNormalized,
    minBrightness: minBrightness === Infinity ? 0 : minBrightness,
    maxBrightness: maxBrightness === -Infinity ? 0 : maxBrightness,
    luminanceMatrix: transformedLuminance,
    histogram
  };

  return {
    stats: transformedStats,
    deltaTotal,
    deltaAverage,
    percentageChange
  };
}

/**
 * Extracts a row profile: array of luminance values along row y [0..width-1]
 */
export function getRowProfile(luminance: Float32Array, width: number, height: number, y: number): number[] {
  const row = clamp(Math.floor(y), 0, height - 1);
  const offset = row * width;
  const profile: number[] = new Array(width);
  for (let x = 0; x < width; x++) {
    profile[x] = luminance[offset + x];
  }
  return profile;
}

/**
 * Extracts a column profile: array of luminance values along column x [0..height-1]
 */
export function getColumnProfile(luminance: Float32Array, width: number, height: number, x: number): number[] {
  const col = clamp(Math.floor(x), 0, width - 1);
  const profile: number[] = new Array(height);
  for (let y = 0; y < height; y++) {
    profile[y] = luminance[y * width + col];
  }
  return profile;
}
