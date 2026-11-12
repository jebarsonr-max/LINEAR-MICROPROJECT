import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, AlertCircle, Sparkles, CheckCircle } from 'lucide-react';
import { processImageFile, ProcessedImageData } from '../../utils/imageProcessor';
import { uploadAndAnalyzeImage } from '../../services/api';

interface ImageDropzoneProps {
  onImageProcessed: (data: ProcessedImageData, name: string) => void;
  onLoadSample: (type: 'benchmark' | 'gradient' | 'gaussian' | 'academic') => void;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  onImageProcessed,
  onLoadSample,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setLoading(true);
    try {
      const data = await processImageFile(file);

      // Attempt FastAPI backend upload for SQLite storage & server-side verification
      try {
        const backendRes = await uploadAndAnalyzeImage(file);
        data.backendAnalysisId = backendRes.analysis_id;
        data.stats.totalBrightness = backendRes.stats.total_brightness;
        data.stats.averageBrightness = backendRes.stats.average_brightness;
        data.stats.normalizedAverage = backendRes.stats.normalized_average;
        data.stats.minBrightness = backendRes.stats.min_brightness;
        data.stats.maxBrightness = backendRes.stats.max_brightness;
        data.stats.histogram = backendRes.stats.histogram;
        if (backendRes.stats.preview_base64) {
          data.grayscaleDataUrl = backendRes.stats.preview_base64;
        }
      } catch (backendErr) {
        // Graceful fallback to client runtime
        console.info('Operating with local computing engine:', backendErr);
      }

      onImageProcessed(data, file.name);
    } catch (err: any) {
      setError(err?.message || 'Failed to process the image.');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="w-full">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-scientific-primary bg-blue-50/80 shadow-md scale-[1.005]'
            : 'border-slate-300 hover:border-scientific-primary/70 bg-white hover:bg-slate-50/50 shadow-xs'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFile(e.target.files[0]);
            }
          }}
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
        />

        <div className="mx-auto w-16 h-16 rounded-2xl bg-scientific-blueLight text-scientific-primary flex items-center justify-center mb-4 shadow-inner">
          {loading ? (
            <div className="w-7 h-7 border-3 border-scientific-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-8 h-8 stroke-[2]" />
          )}
        </div>

        <h3 className="text-base sm:text-lg font-bold text-scientific-text">
          {loading ? 'Processing pixel luminance data...' : 'Upload Image for Mathematical Analysis'}
        </h3>
        <p className="text-xs sm:text-sm text-scientific-subtext mt-1.5 max-w-md mx-auto">
          Drag & drop your PNG, JPEG, or WebP image here, or browse files locally.
          Processed 100% in your browser using HTML5 Canvas.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
          <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
            Gray = 0.299R + 0.587G + 0.114B
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
            Max limit: 15MB
          </span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-3.5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Processing error: </span>
            {error}
          </div>
        </div>
      )}

      {/* Sample demonstration pills */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-scientific-text">
          <Sparkles className="w-4 h-4 text-scientific-violet" />
          <span>Or load an academic test model:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLoadSample('benchmark');
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
          >
            3×3 Benchmark (T=450)
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLoadSample('gaussian');
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            2D Gaussian Bell Field
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLoadSample('gradient');
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
          >
            Linear Gradient Ramp
          </button>
        </div>
      </div>
    </div>
  );
};
