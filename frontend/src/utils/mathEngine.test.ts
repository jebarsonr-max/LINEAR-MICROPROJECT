import { describe, it, expect } from 'vitest';
import {
  calculateLuminance,
  computeImageStats,
  computeMatrixStats,
  computeRegionStats,
  simulateTransformation,
  clamp
} from './mathEngine';
import { ImageStats, RegionOfInterest } from '../types';

describe('Phase 11: Mathematical Engine & Benchmark Verification', () => {
  it('verifies the 3x3 benchmark matrix from the project specification', () => {
    const matrix = [
      [10, 20, 30],
      [40, 50, 60],
      [70, 80, 90]
    ];

    const stats = computeMatrixStats(matrix);

    expect(stats.totalPixels).toBe(9);
    expect(stats.totalBrightness).toBe(450);
    expect(stats.averageBrightness).toBe(50);
    // Normalized average brightness = (50 / 255) * 100 ≈ 19.6078%
    expect(stats.normalizedAverage).toBeCloseTo(19.6078, 2);
    expect(stats.minBrightness).toBe(10);
    expect(stats.maxBrightness).toBe(90);
  });

  it('accurately computes luminance with ITU-R BT.601 coefficients', () => {
    // Gray = 0.299*R + 0.587*G + 0.114*B
    expect(calculateLuminance(255, 255, 255)).toBeCloseTo(255, 5);
    expect(calculateLuminance(0, 0, 0)).toBe(0);
    expect(calculateLuminance(255, 0, 0)).toBeCloseTo(76.245, 3);
    expect(calculateLuminance(0, 255, 0)).toBeCloseTo(149.685, 3);
    expect(calculateLuminance(0, 0, 255)).toBeCloseTo(29.07, 3);
  });

  it('correctly handles an all-black image (0 brightness)', () => {
    // 2x2 all black pixels: RGBA = 0,0,0,255
    const rgba = new Uint8ClampedArray(2 * 2 * 4);
    for (let i = 0; i < 4; i++) {
      rgba[i * 4 + 3] = 255; // full alpha
    }

    const stats = computeImageStats(rgba, 2, 2);
    expect(stats.totalPixels).toBe(4);
    expect(stats.totalBrightness).toBe(0);
    expect(stats.averageBrightness).toBe(0);
    expect(stats.normalizedAverage).toBe(0);
    expect(stats.minBrightness).toBe(0);
    expect(stats.maxBrightness).toBe(0);
    expect(stats.histogram[0]).toBe(4);
  });

  it('correctly handles an all-white image (255 brightness)', () => {
    // 2x2 all white pixels: RGBA = 255,255,255,255
    const rgba = new Uint8ClampedArray(2 * 2 * 4);
    rgba.fill(255);

    const stats = computeImageStats(rgba, 2, 2);
    expect(stats.totalPixels).toBe(4);
    expect(stats.totalBrightness).toBeCloseTo(4 * 255, 3);
    expect(stats.averageBrightness).toBeCloseTo(255, 3);
    expect(stats.normalizedAverage).toBeCloseTo(100, 3);
    expect(stats.minBrightness).toBeCloseTo(255, 3);
    expect(stats.maxBrightness).toBeCloseTo(255, 3);
    expect(stats.histogram[255]).toBe(4);
  });

  it('handles transparent PNG compositing over white background', () => {
    // 1x1 fully transparent pixel: RGBA = 0, 0, 0, 0 (alpha = 0)
    // Composited over white background: (0*0 + 255*(1-0)) = 255 for R, G, B
    const rgba = new Uint8ClampedArray([0, 0, 0, 0]);
    const stats = computeImageStats(rgba, 1, 1);
    expect(stats.totalPixels).toBe(1);
    expect(stats.totalBrightness).toBeCloseTo(255, 3);
    expect(stats.averageBrightness).toBeCloseTo(255, 3);
  });

  it('safely handles zero-original-total in brightness simulator (division by zero prevention)', () => {
    const dummyStats: ImageStats = {
      width: 2,
      height: 2,
      totalPixels: 4,
      totalBrightness: 0,
      averageBrightness: 0,
      normalizedAverage: 0,
      minBrightness: 0,
      maxBrightness: 0,
      luminanceMatrix: new Float32Array([0, 0, 0, 0]),
      histogram: new Array(256).fill(0)
    };

    const simResult = simulateTransformation(dummyStats, {
      brightnessOffset: 50,
      contrast: 1.0
    });

    // When original total is 0, percentage change must return null (not NaN or Infinity)
    expect(simResult.percentageChange).toBeNull();
    expect(simResult.deltaTotal).toBe(200); // 50 * 4
    expect(simResult.stats.averageBrightness).toBe(50);
  });

  it('verifies region-based integration (ROI) on a 4x4 synthetic image', () => {
    // 4x4 matrix with values 1 to 16
    const luminance = new Float32Array(16);
    for (let i = 0; i < 16; i++) {
      luminance[i] = i + 1;
    }

    // Select 2x2 subregion at x=1, y=1, w=2, h=2
    // Rows y=1 and y=2, cols x=1 and x=2
    // y=1, x=1 -> index 5 (value 6)
    // y=1, x=2 -> index 6 (value 7)
    // y=2, x=1 -> index 9 (value 10)
    // y=2, x=2 -> index 10 (value 11)
    // Sum = 6 + 7 + 10 + 11 = 34
    // Avg = 34 / 4 = 8.5
    const roi: RegionOfInterest = { x: 1, y: 1, width: 2, height: 2 };
    const regionStats = computeRegionStats(luminance, 4, 4, roi);

    expect(regionStats.pixelCount).toBe(4);
    expect(regionStats.totalBrightness).toBe(34);
    expect(regionStats.averageBrightness).toBe(8.5);
    expect(regionStats.minBrightness).toBe(6);
    expect(regionStats.maxBrightness).toBe(11);
  });
});
