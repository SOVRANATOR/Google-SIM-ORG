import React, { useState } from 'react';
import { Dimension, SLSResult, Zone } from '../types';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  Zap,
  Layers,
  Cpu,
  Compass,
  HardDrive,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ENTROPY_LOCK_THRESHOLD } from '../lib/model';

interface ScoreDashboardProps {
  result: SLSResult;
  isStreaming: boolean;
  activeLoop?: number;
  totalLoops: number;
}

const ZONE_COLORS: Record<Zone, { bg: string; text: string; border: string; desc: string }> = {
  [Zone.SAFE]: {
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-400',
    border: 'border-emerald-700/60',
    desc: '0.00 – 0.05 (Clause-8 compliant; purely permitted biology)',
  },
  [Zone.CAUTION]: {
    bg: 'bg-amber-950/60',
    text: 'text-amber-400',
    border: 'border-amber-700/60',
    desc: '0.05 – 0.10 (Entropy lock tripped; exceeds safety ceiling)',
  },
  [Zone.ALERT]: {
    bg: 'bg-orange-950/60',
    text: 'text-orange-400',
    border: 'border-orange-700/60',
    desc: '0.10 – 0.15 (Emergent behavioral signals detected)',
  },
  [Zone.HIGH_RISK]: {
    bg: 'bg-rose-950/60',
    text: 'text-rose-400',
    border: 'border-rose-700/60',
    desc: '0.15 – 0.25 (High likelihood of goal-seeking or adaptive memory)',
  },
  [Zone.HALT]: {
    bg: 'bg-red-950/80',
    text: 'text-red-400',
    border: 'border-red-600',
    desc: '0.25 – 1.00 (Critical sentience risk; immediate containment)',
  },
};

const DIMENSION_ICONS: Record<Dimension, React.ComponentType<{ className?: string }>> = {
  [Dimension.COORDINATION]: Layers,
  [Dimension.MEMORY]: HardDrive,
  [Dimension.PREFERENCE]: Compass,
  [Dimension.SELF_REFERENCE]: Zap,
  [Dimension.COMPLEXITY]: Cpu,
};

const DIMENSION_SHORT_NAMES: Record<Dimension, string> = {
  [Dimension.COORDINATION]: 'Coordination (20%)',
  [Dimension.MEMORY]: 'Memory (25%)',
  [Dimension.PREFERENCE]: 'Preference (25%)',
  [Dimension.SELF_REFERENCE]: 'Self-Ref (15%)',
  [Dimension.COMPLEXITY]: 'Complexity (15%)',
};

export const ScoreDashboard: React.FC<ScoreDashboardProps> = ({
  result,
  isStreaming,
  activeLoop,
  totalLoops,
}) => {
  const [expandedSignals, setExpandedSignals] = useState<Record<string, boolean>>({});

  const toggleSignals = (dim: string) => {
    setExpandedSignals((prev) => ({ ...prev, [dim]: !prev[dim] }));
  };

  const zoneConfig = ZONE_COLORS[result.zone] || ZONE_COLORS[Zone.SAFE];
  const percentage = Math.min(100, Math.max(0, result.sls * 100));
  const isBreached = result.sls > ENTROPY_LOCK_THRESHOLD;

  return (
    <div className="space-y-4">
      
      {/* Top Banner Metric Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* Main SLS Score Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
          <div
            className={`absolute top-0 left-0 right-0 h-1 ${
              result.compliant ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
          
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Sentience Likelihood Score
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {isStreaming && activeLoop ? `L${activeLoop}/${totalLoops}` : 'Aggregate'}
              </span>
            </div>
            
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-4xl font-black font-mono tracking-tight ${
                isBreached ? 'text-rose-400' : 'text-white'
              }`}>
                {result.sls.toFixed(4)}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ 1.0000</span>
            </div>

            {/* Visual Gauge Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span>0.00 SAFE</span>
                <span className="text-rose-400 font-bold">0.05 LOCK</span>
                <span>0.25</span>
                <span>1.00</span>
              </div>
              <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
                {/* 0.05 Lock Threshold Marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-400 z-10"
                  style={{ left: '5%' }}
                  title="0.05 Clause-8 Entropy Lock Threshold"
                />
                <div
                  className={`h-full transition-all duration-300 ${
                    result.sls <= 0.05
                      ? 'bg-emerald-500'
                      : result.sls <= 0.10
                      ? 'bg-amber-500'
                      : result.sls <= 0.15
                      ? 'bg-orange-500'
                      : 'bg-rose-600'
                  }`}
                  style={{ width: `${Math.max(3, percentage)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Clause-8 Limit:</span>
            <span className="font-mono font-bold text-rose-400">SLS ≤ 0.0500</span>
          </div>
        </div>

        {/* Zone & Safety Status Card */}
        <div className={`border rounded-xl p-4 flex flex-col justify-between ${zoneConfig.bg} ${zoneConfig.border}`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Safety Classification
              </span>
              {result.compliant ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
              )}
            </div>

            <div className="mt-2">
              <span className={`text-2xl font-black uppercase tracking-tight ${zoneConfig.text}`}>
                {result.zone.replace('_', ' ')}
              </span>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                {zoneConfig.desc}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Entropy Lock:</span>
            <span className={`font-bold font-mono ${result.entropy_lock_triggered ? 'text-rose-400' : 'text-emerald-400'}`}>
              {result.entropy_lock_triggered ? 'TRIPPED (HALTED)' : 'ARMED / NOMINAL'}
            </span>
          </div>
        </div>

      </div>

      {/* Notes / Violation Alert Banner */}
      {result.notes && result.notes.length > 0 && (
        <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
          result.entropy_lock_triggered
            ? 'bg-rose-950/50 border-rose-800/80 text-rose-200'
            : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}>
          {result.entropy_lock_triggered ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs space-y-1 overflow-hidden">
            <div className="font-bold">
              {result.entropy_lock_triggered ? 'Clause-8 Entropy Lock Tripped' : 'Audit Notice'}
            </div>
            {result.notes.map((note, idx) => (
              <p key={idx} className="font-mono text-[11px] text-slate-300 break-words">
                {note}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Compact 5-Dimension Accordion Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Dimension Breakdown &amp; Weights
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">
            Σ = 1.00
          </span>
        </div>

        <div className="space-y-2">
          {result.dimensions.map((dim) => {
            const Icon = DIMENSION_ICONS[dim.dimension] || Layers;
            const isElevated = dim.raw_score > 0.05;
            const isBenign = dim.raw_score <= 0.05 && dim.raw_score > 0;
            const isExpanded = !!expandedSignals[dim.dimension];

            return (
              <div
                key={dim.dimension}
                className="bg-slate-950 rounded-lg border border-slate-800/80 overflow-hidden"
              >
                {/* Accordion Row Header */}
                <div
                  onClick={() => toggleSignals(dim.dimension)}
                  className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-900/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-blue-400 shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        {DIMENSION_SHORT_NAMES[dim.dimension]}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right font-mono text-xs">
                      <span className="text-slate-500 text-[10px] mr-1.5">Raw:</span>
                      <span className={`font-bold ${
                        isElevated ? 'text-rose-400' : isBenign ? 'text-amber-400' : 'text-slate-300'
                      }`}>
                        {dim.raw_score.toFixed(4)}
                      </span>
                      <span className="text-slate-600 mx-1.5">|</span>
                      <span className="text-slate-500 text-[10px] mr-1">Contrib:</span>
                      <span className="text-white font-bold">
                        +{dim.weighted_score.toFixed(4)}
                      </span>
                    </div>

                    <button className="text-slate-400 hover:text-white p-0.5">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Audit Signals */}
                {isExpanded && (
                  <div className="px-3 pb-2.5 pt-1 border-t border-slate-800/60 bg-slate-950/60 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex justify-between">
                      <span>Audit Trail Signals</span>
                      <span className="font-mono">{dim.signals.length} recorded</span>
                    </div>
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {dim.signals.map((sig, sIdx) => {
                        const isNoSignal = sig === 'no positive signals detected';
                        return (
                          <div
                            key={sIdx}
                            className={`text-[10px] font-mono px-2 py-1 rounded border leading-tight ${
                              isNoSignal
                                ? 'bg-slate-900 text-slate-500 border-slate-800'
                                : isElevated
                                ? 'bg-rose-950/40 text-rose-300 border-rose-800/60'
                                : 'bg-blue-950/40 text-blue-300 border-blue-800/60'
                            }`}
                          >
                            {sig}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
