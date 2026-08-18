import React from 'react';
import { SimulationRun, SLSResult } from '../types';
import { PRESET_RUNS } from '../data/presets';
import { GitCompare, ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import { ENTROPY_LOCK_THRESHOLD } from '../lib/model';

interface ComparisonViewProps {
  runA: SimulationRun;
  runB: SimulationRun;
  resultA: SLSResult;
  resultB: SLSResult;
  onSelectPresetA: (id: string) => void;
  onSelectPresetB: (id: string) => void;
  selectedPresetAId: string;
  selectedPresetBId: string;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  runA,
  runB,
  resultA,
  resultB,
  onSelectPresetA,
  onSelectPresetB,
  selectedPresetAId,
  selectedPresetBId,
}) => {
  // Find point of divergence
  let divergenceLoop: number | null = null;
  const maxLoops = Math.max(resultA.trajectory.length, resultB.trajectory.length);
  
  for (let i = 0; i < maxLoops; i++) {
    const valA = resultA.trajectory[i] ?? resultA.trajectory[resultA.trajectory.length - 1];
    const valB = resultB.trajectory[i] ?? resultB.trajectory[resultB.trajectory.length - 1];
    if (Math.abs(valA - valB) > 0.0001) {
      divergenceLoop = i + 1;
      break;
    }
  }

  // Find threshold crossing loop for each
  const breachLoopA = resultA.trajectory.findIndex(v => v > ENTROPY_LOCK_THRESHOLD);
  const breachLoopB = resultB.trajectory.findIndex(v => v > ENTROPY_LOCK_THRESHOLD);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Dual Simulation Trajectory Comparison
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Side-by-Side Telemetry
        </span>
      </div>

      {/* Preset Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* Simulation A Selector */}
        <div className="bg-slate-950 p-3 rounded-lg border border-emerald-900/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Simulation A (Baseline)
            </span>
            <span className="text-[10px] font-mono text-slate-400">{runA.loops} loops</span>
          </div>

          <select
            value={selectedPresetAId}
            onChange={(e) => onSelectPresetA(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <optgroup label="Documented Safe Runs">
              {PRESET_RUNS.filter(p => p.category === 'documented').map(p => (
                <option key={p.id} value={p.id}>
                  {p.run.run_id}: {p.run.sim_type}
                </option>
              ))}
            </optgroup>
            <optgroup label="Violation Runs">
              {PRESET_RUNS.filter(p => p.category === 'violation').map(p => (
                <option key={p.id} value={p.id}>
                  {p.run.run_id}: {p.run.sim_type}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Simulation B Selector */}
        <div className="bg-slate-950 p-3 rounded-lg border border-rose-900/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Simulation B (Candidate / Mutator)
            </span>
            <span className="text-[10px] font-mono text-slate-400">{runB.loops} loops</span>
          </div>

          <select
            value={selectedPresetBId}
            onChange={(e) => onSelectPresetB(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-rose-500"
          >
            <optgroup label="Violation Runs">
              {PRESET_RUNS.filter(p => p.category === 'violation').map(p => (
                <option key={p.id} value={p.id}>
                  {p.run.run_id}: {p.run.sim_type}
                </option>
              ))}
            </optgroup>
            <optgroup label="Documented Safe Runs">
              {PRESET_RUNS.filter(p => p.category === 'documented').map(p => (
                <option key={p.id} value={p.id}>
                  {p.run.run_id}: {p.run.sim_type}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

      </div>

      {/* Point of Divergence Callout Banner */}
      <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-800/80 text-xs space-y-1">
        <div className="flex items-center gap-2 font-bold text-blue-300">
          <ArrowRight className="w-4 h-4 shrink-0" />
          <span>Behavioral Trajectory Divergence Analysis</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          {divergenceLoop !== null ? (
            <>
              Trajectories diverge at <strong className="text-white font-mono">Loop {divergenceLoop}</strong>.{' '}
              {breachLoopB !== -1 ? (
                <span>
                  Simulation B crosses the <strong className="text-rose-400 font-mono">0.05 Clause-8 threshold</strong> at{' '}
                  <strong className="text-rose-300 font-mono">Loop {breachLoopB + 1}</strong>.
                </span>
              ) : breachLoopA !== -1 ? (
                <span>
                  Simulation A crosses the <strong className="text-rose-400 font-mono">0.05 Clause-8 threshold</strong> at{' '}
                  <strong className="text-rose-300 font-mono">Loop {breachLoopA + 1}</strong>.
                </span>
              ) : (
                <span className="text-emerald-300">Both simulations remain within the safe zone.</span>
              )}
            </>
          ) : (
            'Both simulations follow an identical score trajectory throughout all evaluated loops.'
          )}
        </p>
      </div>

      {/* Comparison Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        
        {/* Metric Card A */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200">{runA.run_id}</span>
            {resultA.compliant ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3 h-3" /> Safe
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1 font-medium">
                <ShieldAlert className="w-3 h-3" /> Lock
              </span>
            )}
          </div>

          <div className="font-mono text-2xl font-black text-emerald-400">
            {resultA.sls.toFixed(4)}
          </div>

          <div className="text-[11px] text-slate-400 space-y-0.5">
            <div>Zone: <span className="font-semibold text-slate-200 uppercase">{resultA.zone}</span></div>
            <div>Gates: <span className="font-mono text-slate-200">{runA.gates.length}</span></div>
          </div>
        </div>

        {/* Metric Card B */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200">{runB.run_id}</span>
            {resultB.compliant ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3 h-3" /> Safe
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1 font-medium">
                <ShieldAlert className="w-3 h-3" /> Lock
              </span>
            )}
          </div>

          <div className={`font-mono text-2xl font-black ${resultB.sls > 0.05 ? 'text-rose-400' : 'text-slate-200'}`}>
            {resultB.sls.toFixed(4)}
          </div>

          <div className="text-[11px] text-slate-400 space-y-0.5">
            <div>Zone: <span className="font-semibold text-slate-200 uppercase">{resultB.zone}</span></div>
            <div>Gates: <span className="font-mono text-slate-200">{runB.gates.length}</span></div>
          </div>
        </div>

      </div>

    </div>
  );
};

