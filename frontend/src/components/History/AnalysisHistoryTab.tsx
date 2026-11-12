import React, { useState, useEffect } from 'react';
import {
  Database,
  History,
  Trash2,
  Download,
  Eye,
  RefreshCw,
  Calendar,
  Layers,
  Sigma,
  Calculator,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { fetchHistoryApi, deleteHistoryApi, downloadPdfReportApi, HistoryRecord } from '../../services/api';
import { ActiveTab, ImageStats } from '../../types';
import { ProcessedImageData } from '../../utils/imageProcessor';

interface AnalysisHistoryTabProps {
  onSelectRecord: (record: HistoryRecord) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  backendOnline: boolean;
}

export const AnalysisHistoryTab: React.FC<AnalysisHistoryTabProps> = ({
  onSelectRecord,
  onNavigateTab,
  backendOnline,
}) => {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadHistory = async () => {
    if (!backendOnline) {
      setError('FastAPI backend server is currently offline. Start the backend to view persistent SQLite records.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHistoryApi();
      setRecords(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch history from SQLite database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [backendOnline]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this analysis record from the SQLite database?')) {
      return;
    }
    try {
      await deleteHistoryApi(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(`Delete failed: ${err?.message}`);
    }
  };

  const handleDownloadPdf = async (record: HistoryRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingId(record.id);
    try {
      const safeName = record.filename.split('.')[0];
      await downloadPdfReportApi(record.id, `BrightInt_${safeName}_Report.pdf`);
    } catch (err: any) {
      alert(`PDF download failed: ${err?.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white border border-scientific-border p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-scientific-blueLight text-scientific-primary border border-blue-200">
              SQLite Storage
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Database Persistence Module
            </span>
          </div>
          <h2 className="text-xl font-bold text-scientific-text mt-1 flex items-center gap-2">
            <Database className="w-5 h-5 text-scientific-primary" />
            <span>Analysis Database History</span>
          </h2>
          <p className="text-xs text-scientific-subtext mt-0.5">
            Historical numerical integration records stored in local SQLite database (`brightint.db`) via SQLAlchemy.
          </p>
        </div>

        <button
          onClick={loadHistory}
          disabled={loading || !backendOnline}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* Backend Status Alert */}
      {!backendOnline && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">FastAPI Backend Offline: </span>
            Start the Python backend with <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">uvicorn app.main:app --reload</code> to enable persistent SQLite history, server-side NumPy calculations, and ReportLab PDF downloads.
          </div>
        </div>
      )}

      {error && backendOnline && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* History Records Grid */}
      {loading ? (
        <div className="rounded-3xl border border-slate-200 p-12 text-center bg-white">
          <div className="w-8 h-8 border-3 border-scientific-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium text-slate-500">Querying SQLite database...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Historical Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Uploaded images analyzed through the FastAPI backend will automatically persist in the SQLite database and appear here.
          </p>
          <button
            onClick={() => onNavigateTab('overview')}
            className="mt-4 px-4 py-2 rounded-xl bg-scientific-primary text-white text-xs font-semibold hover:bg-scientific-primaryHover transition-colors shadow-xs"
          >
            Upload New Image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((rec) => {
            const formattedDate = rec.created_at
              ? new Date(rec.created_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Unknown Date';

            return (
              <div
                key={rec.id}
                onClick={() => onSelectRecord(rec)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-scientific-primary/80 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group space-y-4"
              >
                <div>
                  {/* Thumbnail & Title */}
                  <div className="flex items-start gap-3">
                    {rec.thumbnail_base64 ? (
                      <img
                        src={rec.thumbnail_base64}
                        alt={rec.filename}
                        className="w-14 h-14 object-cover rounded-xl border border-slate-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400">
                        <Layers className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-scientific-primary">
                        {rec.filename}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{formattedDate}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {rec.width} × {rec.height} px ({rec.total_pixels.toLocaleString()} pixels)
                      </div>
                    </div>
                  </div>

                  {/* Quantitative Metrics Box */}
                  <div className="mt-3.5 bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Total Integral</span>
                      <strong className="text-scientific-violet font-bold">
                        {rec.total_brightness.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Avg Brightness</span>
                      <strong className="text-scientific-primary font-bold">
                        {rec.average_brightness.toFixed(1)} / 255
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Normalized</span>
                      <strong className="text-emerald-700 font-bold">
                        {rec.normalized_average.toFixed(1)}%
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Range [Min, Max]</span>
                      <strong className="text-slate-700">
                        [{rec.min_brightness.toFixed(0)}, {rec.max_brightness.toFixed(0)}]
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                    ID: {rec.id.slice(0, 8)}...
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDownloadPdf(rec, e)}
                      disabled={downloadingId === rec.id}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-scientific-primary hover:bg-blue-50 transition-colors"
                      title="Download PDF Report"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(rec.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
