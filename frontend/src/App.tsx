import React, { useState, useEffect } from 'react';
import { ActiveTab, ImageAnalysisSession, ImageStats } from './types';
import { ProcessedImageData, generateSampleImage } from './utils/imageProcessor';
import { checkBackendHealth, fetchHistoryDetailApi, HistoryRecord } from './services/api';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { OverviewTab } from './components/Overview/OverviewTab';
import { ImageAnalyzerTab } from './components/Analyzer/ImageAnalyzerTab';
import { IntegrationLabTab } from './components/IntegrationLab/IntegrationLabTab';
import { VisualizationsTab } from './components/Visualizations/VisualizationsTab';
import { SimulatorTab } from './components/Simulator/SimulatorTab';
import { LinearAlgebraTab } from './components/LinearAlgebra/LinearAlgebraTab';
import { ReportTab } from './components/Reports/ReportTab';
import { AnalysisHistoryTab } from './components/History/AnalysisHistoryTab';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [imageData, setImageData] = useState<ProcessedImageData | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [sessions, setSessions] = useState<ImageAnalysisSession[]>([]);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  // Poll / check backend connectivity
  useEffect(() => {
    let isMounted = true;
    const testConnection = async () => {
      const health = await checkBackendHealth();
      if (isMounted) {
        setBackendOnline(health.online);
      }
    };
    testConnection();
    const interval = setInterval(testConnection, 10000); // Check every 10s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Automatically load the academic 3x3 Benchmark matrix sample on initial launch
  useEffect(() => {
    try {
      const initial = generateSampleImage('benchmark');
      setImageData(initial);
      setImageName('Benchmark-3x3-Matrix.png');

      const initialSession: ImageAnalysisSession = {
        id: 'session-init',
        name: 'Benchmark-3x3-Matrix.png',
        timestamp: Date.now(),
        stats: initial.stats,
        thumbnailUrl: initial.grayscaleDataUrl,
      };
      setSessions([initialSession]);
    } catch (e) {
      console.error('Failed to generate initial sample', e);
    }
  }, []);

  const handleImageProcessed = (data: ProcessedImageData, name: string) => {
    setImageData(data);
    setImageName(name);

    // Save to session history
    const newSession: ImageAnalysisSession = {
      id: `session-${Date.now()}`,
      name,
      timestamp: Date.now(),
      stats: data.stats,
      thumbnailUrl: data.grayscaleDataUrl,
      backendAnalysisId: data.backendAnalysisId,
    };

    setSessions((prev) => [newSession, ...prev.filter((s) => s.name !== name)].slice(0, 8));
  };

  const handleLoadSample = (type: 'benchmark' | 'gradient' | 'gaussian' | 'academic') => {
    try {
      const data = generateSampleImage(type);
      const names = {
        benchmark: 'Benchmark-3x3-Matrix.png',
        gaussian: '2D-Gaussian-Surface.png',
        gradient: 'Linear-Gradient-Ramp.png',
        academic: 'Concentric-Circles.png',
      };
      handleImageProcessed(data, names[type]);
    } catch (err) {
      console.error('Failed to load sample image', err);
    }
  };

  const handleReset = () => {
    setImageData(null);
    setImageName('');
  };

  const handleSelectSession = (session: ImageAnalysisSession) => {
    if (imageData && imageData.stats === session.stats) return;
    if (session.name.includes('Benchmark')) {
      handleLoadSample('benchmark');
    } else if (session.name.includes('Gaussian')) {
      handleLoadSample('gaussian');
    } else if (session.name.includes('Gradient')) {
      handleLoadSample('gradient');
    } else if (session.name.includes('Concentric')) {
      handleLoadSample('academic');
    }
  };

  const handleSelectHistoryRecord = async (record: HistoryRecord) => {
    try {
      // Reconstruct stats from SQLite record
      const detail = await fetchHistoryDetailApi(record.id);
      const hist = detail.histogram || new Array(256).fill(0);

      const reconstructedStats: ImageStats = {
        width: record.width,
        height: record.height,
        totalPixels: record.total_pixels,
        totalBrightness: record.total_brightness,
        averageBrightness: record.average_brightness,
        normalizedAverage: record.normalized_average,
        minBrightness: record.min_brightness,
        maxBrightness: record.max_brightness,
        histogram: hist,
      };

      const reconstructedData: ProcessedImageData = {
        originalDataUrl: record.thumbnail_base64 || '',
        grayscaleDataUrl: record.thumbnail_base64 || '',
        stats: reconstructedStats,
        width: record.width,
        height: record.height,
        backendAnalysisId: record.id,
      };

      setImageData(reconstructedData);
      setImageName(record.filename);
      setActiveTab('analyzer');
    } catch (err) {
      console.error('Failed to restore history record:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FC] text-[#172554] flex flex-col lg:flex-row antialiased selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        hasImage={!!imageData}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen w-full">
        <Header
          activeTab={activeTab}
          setMobileOpen={setMobileOpen}
          stats={imageData?.stats || null}
          onReset={handleReset}
          onLoadSample={handleLoadSample}
          onNavigateTab={setActiveTab}
          backendOnline={backendOnline}
        />

        <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
          {activeTab === 'overview' && (
            <OverviewTab
              imageData={imageData}
              imageName={imageName}
              onImageProcessed={handleImageProcessed}
              onLoadSample={handleLoadSample}
              sessions={sessions}
              onSelectSession={handleSelectSession}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'analyzer' && (
            <ImageAnalyzerTab
              imageData={imageData}
              imageName={imageName}
            />
          )}

          {activeTab === 'integration' && (
            <IntegrationLabTab />
          )}

          {activeTab === 'visualizations' && (
            <VisualizationsTab
              imageData={imageData}
              imageName={imageName}
            />
          )}

          {activeTab === 'simulator' && (
            <SimulatorTab
              imageData={imageData}
              imageName={imageName}
            />
          )}

          {activeTab === 'linear-algebra' && (
            <LinearAlgebraTab />
          )}

          {activeTab === 'reports' && (
            <ReportTab
              imageData={imageData}
              imageName={imageName}
            />
          )}

          {activeTab === 'history' && (
            <AnalysisHistoryTab
              onSelectRecord={handleSelectHistoryRecord}
              onNavigateTab={setActiveTab}
              backendOnline={backendOnline}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
