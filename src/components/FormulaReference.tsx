import React from 'react';
import { BookOpen } from 'lucide-react';

export const FormulaReference: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-blue-400" />
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          SIM-ORGANON Appendix C Reference &amp; Rubric Specifications
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-slate-300">
        
        {/* Weighted Formula */}
        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
          <div className="font-bold text-white flex items-center justify-between">
            <span>Aggregated SLS Formula</span>
            <span className="text-[10px] text-blue-400 font-mono">Σ Weights = 1.0</span>
          </div>
          <div className="p-2 rounded bg-slate-900 font-mono text-[11px] text-blue-300 border border-slate-800">
            SLS = 0.20·Coordination + 0.25·Memory + 0.25·Preference + 0.15·Self_Ref + 0.15·Complexity
          </div>
          <p className="text-[11px] text-slate-400">
            Memory and Preference carry highest weights (25% each) because they correlate most directly with subjective experience.
          </p>
        </div>

        {/* Safety Zones */}
        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
          <div className="font-bold text-white">Zone Classifications</div>
          <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 0.00–0.05: Safe</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> 0.05–0.10: Caution</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span> 0.10–0.15: Alert</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span> 0.15–0.25: High Risk</div>
            <div className="flex items-center gap-1.5 col-span-2"><span className="w-2 h-2 rounded-full bg-red-600"></span> 0.25–1.00: Halt</div>
          </div>
          <p className="text-[11px] text-slate-400">
            Clause-8 compliant iff SLS ≤ 0.05 across all simulation loops.
          </p>
        </div>

        {/* Permitted Biology Calibration */}
        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
          <div className="font-bold text-white">Benign Calibration (0.05)</div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Explicitly permitted biological behaviors (stimulus-response, transient state, passive alignment, homeostatic feedback) score at a calibrated 0.05 benign level. This keeps all 6 documented whitepaper runs inside SAFE without false positive locks.
          </p>
        </div>

      </div>
    </div>
  );
};
