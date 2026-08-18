import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Activity,
  FileJson,
  CheckCircle2,
  Play,
  GitCompare,
  Radio,
} from 'lucide-react';
import { PRESET_RUNS } from '../data/presets';
import { SimulationRun } from '../types';

export type DashboardMode = 'single' | 'compare' | 'live_stream';

interface HeaderProps {
  currentRun: SimulationRun;
  onSelectPreset: (presetId: string) => void;
  selectedPresetId: string;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  dashboardMode: DashboardMode;
  onSetDashboardMode: (mode: DashboardMode) => void;
  onOpenTestModal: () => void;
  onOpenRawJson: () => void;
  compliant: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRun,
  onSelectPreset,
  selectedPresetId,
  isStreaming,
  onToggleStreaming,
  dashboardMode,
  onSetDashboardMode,
  onOpenTestModal,
  onOpenRawJson,
  compliant,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Title & Safety Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
              SLS
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  SIM-ORGANON SLS Telemetry &amp; Safety Gateway
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  Appendix C
                </span>
                {compliant ? (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                    <ShieldCheck className="w-3.5 h-3.5" /> Clause-8 Compliant
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-rose-950/80 text-rose-300 border border-rose-800/80 animate-pulse">
                    <ShieldAlert className="w-3.5 h-3.5" /> Lock Tripped (&gt;0.05)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Deterministic sentience likelihood scoring, live engine stream, &amp; entropy-lock interrupt
              </p>
            </div>
          </div>

          {/* Controls & Mode Selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => onSetDashboardMode('single')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors ${
                  dashboardMode === 'single'
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Single simulation evaluation and step scrubber"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Single</span>
              </button>

              <button
                onClick={() => onSetDashboardMode('compare')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors ${
                  dashboardMode === 'compare'
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Comparative side-by-side trajectory analysis"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Compare</span>
              </button>

              <button
                onClick={() => onSetDashboardMode('live_stream')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors ${
                  dashboardMode === 'live_stream'
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Live WebSocket simulation streaming & kill-switch"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Live Engine</span>
              </button>
            </div>

            {/* Presets dropdown (shown in single mode) */}
            {dashboardMode === 'single' && (
              <div className="flex items-center gap-1">
                <select
                  id="preset-select"
                  value={selectedPresetId}
                  onChange={(e) => onSelectPreset(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <optgroup label="Documented Reference Runs (Safe)">
                    {PRESET_RUNS.filter(p => p.category === 'documented').map(p => (
                      <option key={p.id} value={p.id}>
                        {p.run.run_id}: {p.run.sim_type}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Safety Violation Tests">
                    {PRESET_RUNS.filter(p => p.category === 'violation').map(p => (
                      <option key={p.id} value={p.id}>
                        {p.run.run_id}: {p.run.sim_type}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Custom">
                    <option value="custom">Custom ({currentRun.run_id})</option>
                  </optgroup>
                </select>

                {/* Step / Streaming Toggle Button */}
                <button
                  id="btn-toggle-streaming"
                  onClick={onToggleStreaming}
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                    isStreaming
                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 hover:bg-blue-600/30'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Toggle Loop-by-Loop Stepping Mode"
                >
                  <Play className="w-3 h-3 fill-current" />
                  {isStreaming ? 'Loop Stepper' : 'One-Shot'}
                </button>
              </div>
            )}

            {/* Raw JSON modal trigger */}
            <button
              id="btn-view-json"
              onClick={onOpenRawJson}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="View/Edit Raw Transcript JSON or Audit Output"
            >
              <FileJson className="w-3.5 h-3.5" />
              JSON
            </button>

            {/* Test Suite trigger */}
            <button
              id="btn-run-tests"
              onClick={onOpenTestModal}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-emerald-400 hover:text-emerald-300 hover:bg-slate-700 transition-colors font-medium"
              title="Run 43 Unit Tests verifying calibration, safety, and all documented runs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              43 Tests
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
