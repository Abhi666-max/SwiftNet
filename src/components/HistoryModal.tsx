'use client';

import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  FileSpreadsheet, 
  FileJson, 
  GitCompare, 
  Clock, 
  ArrowDown, 
  ArrowUp,
  AlertCircle
} from 'lucide-react';
import { SpeedTestResult } from '@/types/speedtest';
import { exportHistoryToCsv, exportResultToJson } from '@/lib/exportReport';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SpeedTestResult[];
  onClearHistory: () => void;
  onDeleteTest: (id: string) => void;
  onCompare: (testA: SpeedTestResult, testB: SpeedTestResult) => void;
}

export function HistoryModal({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onDeleteTest,
  onCompare,
}: HistoryModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= 2) {
        // Replace oldest selection
        setSelectedIds([selectedIds[1], id]);
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const handleLaunchCompare = () => {
    if (selectedIds.length !== 2) return;
    const testA = history.find((h) => h.id === selectedIds[0]);
    const testB = history.find((h) => h.id === selectedIds[1]);
    if (testA && testB) {
      onCompare(testA, testB);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-surface-border bg-surface p-5 sm:p-6 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-cyan/15 border border-brand-cyan/30 text-brand-cyan">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Diagnostic History</h2>
              <p className="text-xs text-slate-400">
                Saved in your browser localStorage ({history.length} records)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <>
                <button
                  onClick={() => exportHistoryToCsv(history)}
                  className="flex items-center gap-1 rounded-lg border border-surface-border bg-surface-subtle px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-surface-elevated hover:text-white"
                  title="Export all to CSV"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>

                <button
                  onClick={onClearHistory}
                  className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20"
                  title="Clear all records"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-surface-elevated hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Compare banner if selections active */}
        {selectedIds.length > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 p-3 text-xs text-slate-200">
            <div className="flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-brand-cyan" />
              <span>
                {selectedIds.length === 1
                  ? 'Select 1 more test to compare side-by-side.'
                  : '2 tests selected for comparison.'}
              </span>
            </div>
            {selectedIds.length === 2 && (
              <button
                onClick={handleLaunchCompare}
                className="rounded-lg bg-brand-cyan px-3 py-1 font-bold text-slate-950 hover:bg-cyan-300 transition-colors"
              >
                Compare Now
              </button>
            )}
          </div>
        )}

        {/* History List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 pr-1">
          {history.length === 0 ? (
            <div className="py-16 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-slate-500" />
              <p className="mt-2 text-sm text-slate-400">No test records saved yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Run a speed test to track your internet metrics over time.
              </p>
            </div>
          ) : (
            history.map((record) => {
              const isSelected = selectedIds.includes(record.id);

              return (
                <div
                  key={record.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 transition-all ${
                    isSelected
                      ? 'border-brand-cyan/60 bg-brand-cyan/10'
                      : 'border-surface-border bg-surface-subtle/50 hover:border-slate-700 hover:bg-surface-elevated/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(record.id)}
                      className="h-4 w-4 rounded border-slate-700 bg-surface-elevated text-brand-cyan focus:ring-0 cursor-pointer"
                      title="Select for comparison"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {record.dateFormatted}
                        </span>
                        <span
                          className="rounded px-1.5 py-0.2 text-[10px] font-bold uppercase"
                          style={{
                            backgroundColor: `${record.score?.color || '#38BDF8'}20`,
                            color: record.score?.color || '#38BDF8',
                          }}
                        >
                          Score: {record.score?.totalScore ?? 'N/A'} ({record.score?.tier ?? 'Good'})
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Endpoint: {record.endpointName}
                      </span>
                    </div>
                  </div>

                  {/* Metrics snapshot */}
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1 text-brand-cyan">
                      <ArrowDown className="h-3 w-3" />
                      <span>{record.downloadSpeedMbps.toFixed(1)} Mbps</span>
                    </div>
                    <div className="flex items-center gap-1 text-brand-purple">
                      <ArrowUp className="h-3 w-3" />
                      <span>{record.uploadSpeedMbps.toFixed(1)} Mbps</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400">
                      <span>{record.latency?.avg ?? '—'} ms</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        onClick={() => exportResultToJson(record)}
                        className="rounded p-1 text-slate-400 hover:bg-surface-subtle hover:text-white"
                        title="Export JSON report"
                      >
                        <FileJson className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTest(record.id)}
                        className="rounded p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400"
                        title="Delete test"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
