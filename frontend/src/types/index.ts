export interface ImageStats {
  width: number;
  height: number;
  totalPixels: number;
  totalBrightness: number;        // T = Σ Σ B(i,j) (sum of float luminance)
  averageBrightness: number;      // Avg = T / (m * n)
  normalizedAverage: number;      // (Avg / 255) * 100%
  minBrightness: number;          // min B(i,j)
  maxBrightness: number;          // max B(i,j)
  luminanceMatrix?: Float32Array; // 1D flat array row-major for high performance
  histogram: number[];           // 256 bins [0..255]
}

export interface RegionOfInterest {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RegionStats {
  roi: RegionOfInterest;
  pixelCount: number;
  totalBrightness: number;
  averageBrightness: number;
  normalizedAverage: number;
  minBrightness: number;
  maxBrightness: number;
  histogram: number[];
}

export interface ImageAnalysisSession {
  id: string;
  name: string;
  timestamp: number;
  stats: ImageStats;
  thumbnailUrl: string;
  backendAnalysisId?: string;
}

export interface SimulationParams {
  brightnessOffset: number; // -100 to +100
  contrast: number;         // 0.0 to 3.0 (default 1.0)
}

export interface SimulationResult {
  stats: ImageStats;
  deltaTotal: number;
  deltaAverage: number;
  percentageChange: number | null; // null if original total is 0 (division by zero guard)
}

export type ActiveTab = 
  | 'overview'
  | 'analyzer'
  | 'integration'
  | 'visualizations'
  | 'simulator'
  | 'linear-algebra'
  | 'reports'
  | 'history';
