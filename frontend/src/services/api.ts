import axios from 'axios';

// In dev, defaults to http://localhost:8000; in Vercel production, defaults to relative '' for same-domain API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:8000' : '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export interface BackendStats {
  width: number;
  height: number;
  total_pixels: number;
  total_brightness: number;
  average_brightness: number;
  normalized_average: number;
  min_brightness: number;
  max_brightness: number;
  histogram: number[];
  preview_base64?: string;
  thumbnail_base64?: string;
  row_profile_sample?: number[];
  col_profile_sample?: number[];
}

export interface BackendAnalysisResponse {
  analysis_id: string;
  filename: string;
  stats: BackendStats;
  created_at: string;
}

export interface BackendRegionResponse {
  analysis_id?: string;
  region: { x: number; y: number; width: number; height: number };
  pixel_count: number;
  total_brightness: number;
  average_brightness: number;
  normalized_average: number;
  min_brightness: number;
  max_brightness: number;
  histogram: number[];
  mathematical_model: string;
}

export interface BackendSimulationResponse {
  analysis_id: string;
  brightness_offset: number;
  contrast: number;
  original_total: number;
  original_average: number;
  transformed_stats: BackendStats;
  delta_total: number;
  delta_average: number;
  percentage_change: number | null;
  transformed_preview_base64: string;
}

export interface HistoryRecord {
  id: string;
  filename: string;
  width: number;
  height: number;
  total_pixels: number;
  total_brightness: number;
  average_brightness: number;
  normalized_average: number;
  min_brightness: number;
  max_brightness: number;
  thumbnail_base64?: string;
  created_at: string;
  simulation_summary?: string;
}

// Health check
export async function checkBackendHealth(): Promise<{ online: boolean; version?: string; numpy_version?: string }> {
  try {
    const res = await apiClient.get('/api/health');
    return { online: true, version: res.data.version, numpy_version: res.data.numpy_version };
  } catch (err) {
    return { online: false };
  }
}

// Analyze image via multipart upload
export async function uploadAndAnalyzeImage(file: File): Promise<BackendAnalysisResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiClient.post<BackendAnalysisResponse>('/api/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

// Region of Interest integration
export async function integrateRegionApi(params: {
  analysis_id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}): Promise<BackendRegionResponse> {
  const res = await apiClient.post<BackendRegionResponse>('/api/integrate', params);
  return res.data;
}

// What-If Brightness simulation
export async function simulateTransformationApi(params: {
  analysis_id: string;
  brightness_offset: number;
  contrast: number;
}): Promise<BackendSimulationResponse> {
  const res = await apiClient.post<BackendSimulationResponse>('/api/simulate', params);
  return res.data;
}

// History endpoints
export async function fetchHistoryApi(limit = 50, offset = 0): Promise<HistoryRecord[]> {
  const res = await apiClient.get<HistoryRecord[]>('/api/history', {
    params: { limit, offset },
  });
  return res.data;
}

export async function fetchHistoryDetailApi(id: string): Promise<any> {
  const res = await apiClient.get(`/api/history/${id}`);
  return res.data;
}

export async function deleteHistoryApi(id: string): Promise<void> {
  await apiClient.delete(`/api/history/${id}`);
}

// Download PDF Report
export async function downloadPdfReportApi(analysisId: string, filename = 'BrightInt_Report.pdf'): Promise<void> {
  const res = await apiClient.post(`/api/reports/${analysisId}`, {}, {
    responseType: 'blob',
  });

  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
