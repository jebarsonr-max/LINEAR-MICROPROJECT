import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  Layers,
  BarChart3,
  GitCommit,
  Maximize2,
  Box,
  RotateCw,
  Eye,
  Sliders,
  Info,
  ChevronDown
} from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ProcessedImageData, downsampleLuminanceFor3D } from '../../utils/imageProcessor';
import { getRowProfile, getColumnProfile, clamp } from '../../utils/mathEngine';

interface VisualizationsTabProps {
  imageData: ProcessedImageData | null;
  imageName: string;
}

type VisualSubTab = '3d-surface' | 'heatmap' | 'histogram' | 'profiles';

export const VisualizationsTab: React.FC<VisualizationsTabProps> = ({
  imageData,
  imageName,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<VisualSubTab>('3d-surface');

  // Heatmap State
  const [heatmapPalette, setHeatmapPalette] = useState<'viridis' | 'inferno' | 'grayscale' | 'turbo'>('viridis');
  const [heatmapHover, setHeatmapHover] = useState<{ x: number; y: number; lum: number } | null>(null);

  // Profile States
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [selectedCol, setSelectedCol] = useState<number>(0);

  // 3D Surface States
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [heightScale, setHeightScale] = useState<number>(1.0);

  const stats = imageData?.stats;

  // Initialize selected row/col to center of image on load
  useEffect(() => {
    if (stats) {
      setSelectedRow(Math.floor(stats.height / 2));
      setSelectedCol(Math.floor(stats.width / 2));
    }
  }, [stats?.width, stats?.height]);

  if (!imageData || !stats || !stats.luminanceMatrix) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-white max-w-7xl mx-auto">
        <Activity className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-700">No Image Loaded</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          Please upload an image from the Overview dashboard or select a sample pattern to generate 3D surfaces, heatmaps, and spatial profiles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Sub-navigation Tabs */}
      <div className="bg-white rounded-2xl border border-scientific-border p-2 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab('3d-surface')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeSubTab === '3d-surface'
                ? 'bg-scientific-primary text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>3D Intensity Surface</span>
          </button>
          <button
            onClick={() => setActiveSubTab('heatmap')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeSubTab === 'heatmap'
                ? 'bg-scientific-primary text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Brightness Heatmap</span>
          </button>
          <button
            onClick={() => setActiveSubTab('histogram')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeSubTab === 'histogram'
                ? 'bg-scientific-primary text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Intensity Histogram</span>
          </button>
          <button
            onClick={() => setActiveSubTab('profiles')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeSubTab === 'profiles'
                ? 'bg-scientific-primary text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GitCommit className="w-4 h-4" />
            <span>Row & Col Profiles</span>
          </button>
        </div>

        <div className="text-xs font-mono text-slate-500 px-3 hidden sm:block">
          Dimensions: {stats.width} × {stats.height} px
        </div>
      </div>

      {/* View: 3D Intensity Surface */}
      {activeSubTab === '3d-surface' && (
        <ThreeDSurfaceView
          luminance={stats.luminanceMatrix}
          width={stats.width}
          height={stats.height}
          wireframe={wireframe}
          setWireframe={setWireframe}
          autoRotate={autoRotate}
          setAutoRotate={setAutoRotate}
          heightScale={heightScale}
          setHeightScale={setHeightScale}
        />
      )}

      {/* View: Brightness Heatmap */}
      {activeSubTab === 'heatmap' && (
        <HeatmapView
          luminance={stats.luminanceMatrix}
          width={stats.width}
          height={stats.height}
          palette={heatmapPalette}
          setPalette={setHeatmapPalette}
          hoverInfo={heatmapHover}
          setHoverInfo={setHeatmapHover}
        />
      )}

      {/* View: Intensity Histogram */}
      {activeSubTab === 'histogram' && (
        <FullHistogramView
          histogram={stats.histogram}
          stats={stats}
        />
      )}

      {/* View: Row & Column Profiles */}
      {activeSubTab === 'profiles' && (
        <ProfilesView
          luminance={stats.luminanceMatrix}
          width={stats.width}
          height={stats.height}
          selectedRow={selectedRow}
          setSelectedRow={setSelectedRow}
          selectedCol={selectedCol}
          setSelectedCol={setSelectedCol}
        />
      )}
    </div>
  );
};

/**
 * -------------------------------------------------------------
 * 1. Three.js 3D Intensity Surface View with OrbitControls
 * -------------------------------------------------------------
 */
interface ThreeDSurfaceProps {
  luminance: Float32Array;
  width: number;
  height: number;
  wireframe: boolean;
  setWireframe: (val: boolean) => void;
  autoRotate: boolean;
  setAutoRotate: (val: boolean) => void;
  heightScale: number;
  setHeightScale: (val: number) => void;
}

const ThreeDSurfaceView: React.FC<ThreeDSurfaceProps> = ({
  luminance,
  width,
  height,
  wireframe,
  setWireframe,
  autoRotate,
  setAutoRotate,
  heightScale,
  setHeightScale,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Downsample to max 75x75 grid solely for smooth 60fps WebGL rendering
  const { data: sampledData, targetW, targetH } = React.useMemo(() => {
    return downsampleLuminanceFor3D(luminance, width, height, 75);
  }, [luminance, width, height]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Dimensions
    const w = container.clientWidth || 800;
    const h = 520;

    // Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xF5F7FC); // Match scientific light theme

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(60, 50, 75);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.0;

    // Ambient and Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 80, 50);
    scene.add(dirLight);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(80, 20, 0x94A3B8, 0xE2E8F0);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    // Build Surface Geometry
    const segW = targetW - 1;
    const segH = targetH - 1;
    const planeGeom = new THREE.PlaneGeometry(60, 60 * (targetH / targetW), segW, segH);
    planeGeom.rotateX(-Math.PI / 2); // Lay horizontal on XZ plane

    const posAttr = planeGeom.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);

    // Set vertex elevations and vertex colors based on luminance
    for (let i = 0; i < posAttr.count; i++) {
      const row = Math.floor(i / targetW);
      const col = i % targetW;
      const lum = sampledData[row] ? sampledData[row][col] || 0 : 0;

      // Elevation scaled by heightScale
      posAttr.setY(i, (lum / 255) * 20 * heightScale);

      // Color mapping: deep indigo (0) -> royal blue -> purple -> gold/white (255)
      const t = lum / 255;
      const color = new THREE.Color();
      if (t < 0.35) {
        color.setRGB(0.09 + t * 0.5, 0.14 + t * 0.7, 0.5 + t * 0.5);
      } else if (t < 0.75) {
        color.setRGB(0.26 + (t - 0.35) * 1.5, 0.38 + (t - 0.35) * 0.5, 0.9);
      } else {
        color.setRGB(0.86 + (t - 0.75) * 0.5, 0.58 + (t - 0.75) * 1.6, 0.3 + (t - 0.75) * 2.8);
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    planeGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    planeGeom.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      wireframe,
      roughness: 0.35,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(planeGeom, material);
    meshRef.current = mesh;
    scene.add(mesh);

    // Render loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.autoRotate = autoRotate;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      camera.aspect = width / h;
      camera.updateProjectionMatrix();
      renderer.setSize(width, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      planeGeom.dispose();
      material.dispose();
    };
  }, [sampledData, targetW, targetH, heightScale, wireframe, autoRotate]);

  return (
    <div className="bg-white rounded-3xl border border-scientific-border p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-scientific-text flex items-center gap-2">
            <Box className="w-5 h-5 text-scientific-primary" />
            <span>Interactive 3D Luminance Surface B(x, y)</span>
          </h3>
          <p className="text-xs text-scientific-subtext">
            Rotational 3D elevation field where Z represents photometric brightness intensity.
          </p>
        </div>

        {/* 3D Surface Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              autoRotate
                ? 'bg-scientific-primary text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Auto-Rotate</span>
          </button>

          <button
            onClick={() => setWireframe(!wireframe)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              wireframe
                ? 'bg-scientific-violet text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Wireframe</span>
          </button>

          {/* Height Scale Slider */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl text-xs">
            <span className="text-slate-500 font-medium">Z-Scale:</span>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.1"
              value={heightScale}
              onChange={(e) => setHeightScale(parseFloat(e.target.value))}
              className="w-20 accent-scientific-primary cursor-pointer"
            />
            <span className="font-mono text-slate-700 font-bold min-w-[28px]">
              {heightScale.toFixed(1)}x
            </span>
          </div>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200 bg-[#F5F7FC] relative cursor-grab active:cursor-grabbing"
      />

      <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-900 flex items-start gap-2">
        <Info className="w-4 h-4 text-scientific-primary flex-shrink-0 mt-0.5" />
        <span>
          <strong>Performance & Sampling Notice:</strong> To maintain a continuous 60fps orbit rate in WebGL, the 3D surface is evaluated over a sampled{' '}
          <span className="font-mono font-semibold">{targetW} × {targetH}</span> mesh.
          The primary numerical integration calculation in BrightInt strictly uses the full{' '}
          <span className="font-mono font-semibold">{width} × {height}</span> ({width * height} pixels) without downsampling.
        </span>
      </div>
    </div>
  );
};

/**
 * -------------------------------------------------------------
 * 2. Brightness Heatmap View
 * -------------------------------------------------------------
 */
interface HeatmapViewProps {
  luminance: Float32Array;
  width: number;
  height: number;
  palette: 'viridis' | 'inferno' | 'grayscale' | 'turbo';
  setPalette: (p: 'viridis' | 'inferno' | 'grayscale' | 'turbo') => void;
  hoverInfo: { x: number; y: number; lum: number } | null;
  setHoverInfo: (info: { x: number; y: number; lum: number } | null) => void;
}

const HeatmapView: React.FC<HeatmapViewProps> = ({
  luminance,
  width,
  height,
  palette,
  setPalette,
  hoverInfo,
  setHoverInfo,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw Heatmap to Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const imgData = ctx.createImageData(width, height);
    const total = width * height;

    for (let i = 0; i < total; i++) {
      const lum = luminance[i];
      const t = clamp(lum / 255, 0, 1);
      const idx = i * 4;

      let r = 0, g = 0, b = 0;

      if (palette === 'grayscale') {
        const v = Math.round(lum);
        r = g = b = v;
      } else if (palette === 'viridis') {
        // Viridis color approximation
        r = Math.round(255 * (0.267 + t * (0.993 - 0.267) * t));
        g = Math.round(255 * (0.004 + t * 0.906));
        b = Math.round(255 * (0.329 + (1 - t) * 0.5));
      } else if (palette === 'inferno') {
        // Inferno color approximation
        r = Math.round(255 * Math.min(1, t * 1.5));
        g = Math.round(255 * (t > 0.4 ? (t - 0.4) * 1.6 : 0));
        b = Math.round(255 * (t < 0.6 ? t * 1.2 : 0.6 - (t - 0.6)));
      } else {
        // Turbo spectrum
        r = Math.round(255 * Math.sin(t * Math.PI));
        g = Math.round(255 * Math.sin((t + 0.33) * Math.PI));
        b = Math.round(255 * Math.cos(t * Math.PI * 0.5));
      }

      imgData.data[idx] = clamp(r, 0, 255);
      imgData.data[idx + 1] = clamp(g, 0, 255);
      imgData.data[idx + 2] = clamp(b, 0, 255);
      imgData.data[idx + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
  }, [luminance, width, height, palette]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;

    const x = Math.min(width - 1, Math.max(0, Math.floor((e.clientX - rect.left) * scaleX)));
    const y = Math.min(height - 1, Math.max(0, Math.floor((e.clientY - rect.top) * scaleY)));

    const lum = luminance[y * width + x];
    setHoverInfo({ x, y, lum });
  };

  return (
    <div className="bg-white rounded-3xl border border-scientific-border p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-scientific-text flex items-center gap-2">
            <Layers className="w-5 h-5 text-scientific-violet" />
            <span>2D Brightness Intensity Heatmap</span>
          </h3>
          <p className="text-xs text-scientific-subtext">
            Photometric spatial matrix colormap with pixel coordinate telemetry.
          </p>
        </div>

        {/* Color Palette Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <span className="text-slate-500 px-2 text-[11px]">Colormap:</span>
          {(['viridis', 'inferno', 'grayscale', 'turbo'] as const).map((pal) => (
            <button
              key={pal}
              onClick={() => setPalette(pal)}
              className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                palette === pal
                  ? 'bg-white text-scientific-primary shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {pal}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Canvas Display */}
      <div className="relative aspect-video max-h-[500px] bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-300">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverInfo(null)}
          className="max-h-full max-w-full object-contain cursor-crosshair"
          style={{ imageRendering: width <= 25 ? 'pixelated' : 'auto' }}
        />

        {/* Floating telemetry */}
        {hoverInfo && (
          <div className="absolute top-3 right-3 bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700 text-xs font-mono shadow-xl pointer-events-none">
            <div>Coordinate: <strong className="text-blue-300">({hoverInfo.x}, {hoverInfo.y})</strong></div>
            <div>Luminance: <strong className="text-purple-300">{hoverInfo.lum.toFixed(2)}</strong> / 255</div>
          </div>
        )}
      </div>

      {/* Color Scale Legend */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-700 flex justify-between">
          <span>0 (Min Brightness)</span>
          <span>128 (Mid Luminance)</span>
          <span>255 (Peak Brightness)</span>
        </div>
        <div
          className="h-3 w-full rounded-md border border-slate-300"
          style={{
            background:
              palette === 'grayscale'
                ? 'linear-gradient(to right, #000, #fff)'
                : palette === 'viridis'
                ? 'linear-gradient(to right, #440154, #3b528b, #21918c, #5ec962, #fde725)'
                : palette === 'inferno'
                ? 'linear-gradient(to right, #000004, #57106e, #bb3754, #f98e09, #fcffa4)'
                : 'linear-gradient(to right, #30123b, #4686fb, #1ae4b6, #a2fc3c, #f8ca36, #e23812, #7a0403)',
          }}
        />
      </div>
    </div>
  );
};

/**
 * -------------------------------------------------------------
 * 3. High-Definition Intensity Histogram View
 * -------------------------------------------------------------
 */
interface HistogramViewProps {
  histogram: number[];
  stats: any;
}

const FullHistogramView: React.FC<HistogramViewProps> = ({ histogram, stats }) => {
  const [hoverBin, setHoverBin] = useState<{ bin: number; count: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compute stats
  const totalPixels = stats.totalPixels;
  const maxCount = Math.max(...histogram, 1);

  // Draw Histogram to Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background guide grid lines
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let f = 0.25; f < 1; f += 0.25) {
      const y = height * f;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const barWidth = width / 256;

    // Draw bars
    for (let i = 0; i < 256; i++) {
      const count = histogram[i];
      const barH = (count / maxCount) * (height - 20);
      const x = i * barWidth;
      const y = height - barH;

      // Color mapping
      const isHovered = hoverBin && hoverBin.bin === i;
      ctx.fillStyle = isHovered
        ? '#7C3AED'
        : i < 85
        ? '#1E3A8A'
        : i < 170
        ? '#2563EB'
        : '#60A5FA';

      ctx.fillRect(x, y, Math.max(1, barWidth), barH);
    }

    // Draw Mean Brightness Line
    const meanX = (stats.averageBrightness / 255) * width;
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(meanX, 0);
    ctx.lineTo(meanX, height);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [histogram, stats.averageBrightness, hoverBin]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 256 / rect.width;
    const bin = Math.min(255, Math.max(0, Math.floor((e.clientX - rect.left) * scaleX)));
    setHoverBin({ bin, count: histogram[bin] });
  };

  return (
    <div className="bg-white rounded-3xl border border-scientific-border p-5 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-scientific-text flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-scientific-primary" />
            <span>256-Bin Photometric Frequency Distribution</span>
          </h3>
          <p className="text-xs text-scientific-subtext">
            Discrete probability density function of pixel luminance across the interval [0, 255].
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 text-red-600 font-mono font-medium">
            <span className="w-2.5 h-0.5 bg-red-600 inline-block" />
            Mean = {stats.averageBrightness.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Histogram Canvas */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <canvas
          ref={canvasRef}
          width={768}
          height={280}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverBin(null)}
          className="w-full h-64 cursor-crosshair rounded-xl"
        />

        <div className="flex items-center justify-between text-xs font-mono text-slate-500 mt-2 px-1">
          <span>0 (Total Black)</span>
          <span>64 (Shadows)</span>
          <span>128 (Midtones)</span>
          <span>192 (Highlights)</span>
          <span>255 (Specular White)</span>
        </div>
      </div>

      {/* Telemetry & Distribution Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Probe Bin Hover
          </span>
          <span className="text-lg font-bold font-mono text-scientific-text">
            {hoverBin ? `Bin ${hoverBin.bin} / 255` : 'Hover over chart'}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5 font-mono">
            {hoverBin
              ? `${hoverBin.count.toLocaleString()} pixels (${((hoverBin.count / totalPixels) * 100).toFixed(2)}%)`
              : 'Real-time bin frequency telemetry'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
          <span className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider block">
            Dynamic Intensity Range
          </span>
          <span className="text-lg font-bold font-mono text-scientific-primary">
            ΔI = {(stats.maxBrightness - stats.minBrightness).toFixed(1)}
          </span>
          <span className="text-xs text-blue-700 block mt-0.5 font-mono">
            [{stats.minBrightness.toFixed(1)} to {stats.maxBrightness.toFixed(1)}]
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200">
          <span className="text-[11px] font-semibold text-purple-900 uppercase tracking-wider block">
            Distribution Shape
          </span>
          <span className="text-sm font-bold text-purple-950 block mt-0.5">
            {stats.averageBrightness < 85
              ? 'Low-Key (Dark Skewed)'
              : stats.averageBrightness > 170
              ? 'High-Key (Bright Skewed)'
              : 'Balanced Midtone Exposure'}
          </span>
          <span className="text-xs text-purple-700 block mt-0.5">
            Norm Intensity: {stats.normalizedAverage.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * -------------------------------------------------------------
 * 4. Row & Column 1D Slice Profiles View
 * -------------------------------------------------------------
 */
interface ProfilesViewProps {
  luminance: Float32Array;
  width: number;
  height: number;
  selectedRow: number;
  setSelectedRow: (r: number) => void;
  selectedCol: number;
  setSelectedCol: (c: number) => void;
}

const ProfilesView: React.FC<ProfilesViewProps> = ({
  luminance,
  width,
  height,
  selectedRow,
  setSelectedRow,
  selectedCol,
  setSelectedCol,
}) => {
  const rowCanvasRef = useRef<HTMLCanvasElement>(null);
  const colCanvasRef = useRef<HTMLCanvasElement>(null);

  const rowProfile = React.useMemo(() => {
    return getRowProfile(luminance, width, height, selectedRow);
  }, [luminance, width, height, selectedRow]);

  const colProfile = React.useMemo(() => {
    return getColumnProfile(luminance, width, height, selectedCol);
  }, [luminance, width, height, selectedCol]);

  // Draw Row Profile Line Chart
  useEffect(() => {
    const canvas = rowCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Guide grid
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let f = 0.25; f <= 0.75; f += 0.25) {
      ctx.beginPath();
      ctx.moveTo(0, h * f);
      ctx.lineTo(w, h * f);
      ctx.stroke();
    }

    // Plot profile
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const stepX = w / (width - 1 || 1);

    for (let x = 0; x < width; x++) {
      const lum = rowProfile[x];
      const plotY = h - (lum / 255) * (h - 20) - 10;
      if (x === 0) ctx.moveTo(0, plotY);
      else ctx.lineTo(x * stepX, plotY);
    }
    ctx.stroke();
  }, [rowProfile, width]);

  // Draw Col Profile Line Chart
  useEffect(() => {
    const canvas = colCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Guide grid
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let f = 0.25; f <= 0.75; f += 0.25) {
      ctx.beginPath();
      ctx.moveTo(0, h * f);
      ctx.lineTo(w, h * f);
      ctx.stroke();
    }

    // Plot profile
    ctx.strokeStyle = '#7C3AED';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const stepY = w / (height - 1 || 1);

    for (let y = 0; y < height; y++) {
      const lum = colProfile[y];
      const plotY = h - (lum / 255) * (h - 20) - 10;
      if (y === 0) ctx.moveTo(0, plotY);
      else ctx.lineTo(y * stepY, plotY);
    }
    ctx.stroke();
  }, [colProfile, height]);

  const rowSum = rowProfile.reduce((a, b) => a + b, 0);
  const rowAvg = rowSum / (width || 1);

  const colSum = colProfile.reduce((a, b) => a + b, 0);
  const colAvg = colSum / (height || 1);

  return (
    <div className="space-y-6">
      {/* Row Profile Section */}
      <div className="bg-white rounded-3xl border border-scientific-border p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-scientific-text flex items-center gap-2">
              <GitCommit className="w-5 h-5 text-scientific-primary" />
              <span>Horizontal Row Slice: B(x, y={selectedRow})</span>
            </h3>
            <p className="text-xs text-scientific-subtext">
              1D line cross-section across columns X ∈ [0, {width - 1}].
            </p>
          </div>

          {/* Row Scrubber Slider */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <span className="font-semibold text-slate-700">Row (y):</span>
            <input
              type="range"
              min="0"
              max={height - 1}
              value={selectedRow}
              onChange={(e) => setSelectedRow(parseInt(e.target.value))}
              className="w-32 accent-scientific-primary cursor-pointer"
            />
            <span className="font-mono text-scientific-primary font-bold min-w-[32px]">
              {selectedRow} / {height - 1}
            </span>
          </div>
        </div>

        {/* Row Canvas Chart */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <canvas
            ref={rowCanvasRef}
            width={700}
            height={180}
            className="w-full h-44 rounded-xl"
          />
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 mt-2 px-1">
            <span>x = 0</span>
            <span>x = {Math.floor(width / 2)}</span>
            <span>x = {width - 1}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
          <span>Row Integral R_y = Σ B(x, y) = <strong className="text-blue-900">{rowSum.toFixed(1)}</strong></span>
          <span>Row Mean = <strong className="text-blue-900">{rowAvg.toFixed(2)}</strong> / 255</span>
        </div>
      </div>

      {/* Column Profile Section */}
      <div className="bg-white rounded-3xl border border-scientific-border p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-scientific-text flex items-center gap-2">
              <GitCommit className="w-5 h-5 text-scientific-violet" />
              <span>Vertical Column Slice: B(x={selectedCol}, y)</span>
            </h3>
            <p className="text-xs text-scientific-subtext">
              1D line cross-section across vertical rows Y ∈ [0, {height - 1}].
            </p>
          </div>

          {/* Col Scrubber Slider */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <span className="font-semibold text-slate-700">Col (x):</span>
            <input
              type="range"
              min="0"
              max={width - 1}
              value={selectedCol}
              onChange={(e) => setSelectedCol(parseInt(e.target.value))}
              className="w-32 accent-scientific-violet cursor-pointer"
            />
            <span className="font-mono text-scientific-violet font-bold min-w-[32px]">
              {selectedCol} / {width - 1}
            </span>
          </div>
        </div>

        {/* Col Canvas Chart */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <canvas
            ref={colCanvasRef}
            width={700}
            height={180}
            className="w-full h-44 rounded-xl"
          />
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 mt-2 px-1">
            <span>y = 0</span>
            <span>y = {Math.floor(height / 2)}</span>
            <span>y = {height - 1}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
          <span>Col Integral C_x = Σ B(x, y) = <strong className="text-purple-900">{colSum.toFixed(1)}</strong></span>
          <span>Col Mean = <strong className="text-purple-900">{colAvg.toFixed(2)}</strong> / 255</span>
        </div>
      </div>
    </div>
  );
};
