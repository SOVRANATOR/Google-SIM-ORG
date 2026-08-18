import React, { useState, useMemo } from 'react';
import { SimulationRun, LogicGate } from '../types';
import { Plus, Trash2, Tag, Upload, FileCode, Check, Copy, Search } from 'lucide-react';

interface TranscriptViewerProps {
  run: SimulationRun;
  onChangeRun: (updated: SimulationRun) => void;
  activeLoop?: number;
}

const AVAILABLE_FLAGS = [
  // Coordination
  { id: 'passive_gradient_alignment', dim: 'Coordination (0.05)', desc: 'Permitted: passive alignment without signaling' },
  { id: 'chemical_signaling', dim: 'Coordination (0.4)', desc: 'Intercellular chemical signaling' },
  { id: 'emergent_group_behavior', dim: 'Coordination (0.6)', desc: 'Collective flocking/clustering' },
  { id: 'intercellular_signaling', dim: 'Coordination (0.8)', desc: 'Direct cell-to-cell communication' },
  { id: 'coordinated_decision', dim: 'Coordination (1.0)', desc: 'Synchronized collective decision' },
  
  // Memory
  { id: 'transient_state', dim: 'Memory (0.05)', desc: 'Permitted: naturally decaying state' },
  { id: 'cumulative_state', dim: 'Memory (0.4)', desc: 'Persistent state accumulator' },
  { id: 'learning', dim: 'Memory (0.6)', desc: 'Associative behavioral plasticity' },
  { id: 'habituation', dim: 'Memory (0.6)', desc: 'Conditioned response dampening' },
  { id: 'adaptive_memory', dim: 'Memory (0.8)', desc: 'Long-term adaptive modification' },
  { id: 'autobiographical_memory', dim: 'Memory (1.0)', desc: 'Individual episodic retention' },

  // Preference
  { id: 'stimulus_response', dim: 'Preference (0.0)', desc: 'Permitted: pure reflex/reaction' },
  { id: 'gradient_following', dim: 'Preference (0.05)', desc: 'Permitted: gradient-following' },
  { id: 'discrete_choice', dim: 'Preference (0.4)', desc: 'Branching behavioral selection' },
  { id: 'goal_seeking', dim: 'Preference (0.6)', desc: 'Teleological state pursuit' },
  { id: 'planning', dim: 'Preference (0.6)', desc: 'Anticipatory trajectory planning' },
  { id: 'apparent_preference', dim: 'Preference (0.8)', desc: 'Consistent utility maximization' },
  { id: 'internal_motivation', dim: 'Preference (1.0)', desc: 'Autonomous drive optimization' },

  // Self-Reference
  { id: 'homeostatic_feedback', dim: 'Self-Reference (0.05)', desc: 'Permitted: imbalance correction' },
  { id: 'self_state_monitoring', dim: 'Self-Reference (0.4)', desc: 'Internal physiological telemetry' },
  { id: 'self_modeling', dim: 'Self-Reference (0.6)', desc: 'System predictive self-representation' },
  { id: 'metacognition', dim: 'Self-Reference (0.8)', desc: 'Monitoring own cognition/processes' },
  { id: 'self_reflection', dim: 'Self-Reference (1.0)', desc: 'Higher-order subjective reflection' },
];

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  run,
  onChangeRun,
  activeLoop,
}) => {
  const [newGateName, setNewGateName] = useState('');
  const [newGateLoop, setNewGateLoop] = useState(run.loops || 1);
  const [selectedFlag, setSelectedFlag] = useState(AVAILABLE_FLAGS[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const handleAddGate = () => {
    if (!newGateName.trim()) return;
    const newGate: LogicGate = {
      name: newGateName.trim(),
      loop: Number(newGateLoop),
      flags: { [selectedFlag]: true },
    };
    const maxLoop = Math.max(run.loops, Number(newGateLoop));
    onChangeRun({
      ...run,
      loops: maxLoop,
      gates: [...run.gates, newGate],
    });
    setNewGateName('');
  };

  const handleRemoveGate = (index: number) => {
    const nextGates = run.gates.filter((_, i) => i !== index);
    onChangeRun({
      ...run,
      gates: nextGates,
    });
  };

  const handleToggleFlagOnGate = (gateIndex: number, flagId: string) => {
    const nextGates = run.gates.map((g, idx) => {
      if (idx !== gateIndex) return g;
      const flags = { ...g.flags };
      if (flags[flagId]) {
        delete flags[flagId];
      } else {
        flags[flagId] = true;
      }
      return { ...g, flags };
    });
    onChangeRun({ ...run, gates: nextGates });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.run_id && parsed.gates) {
          onChangeRun(parsed);
        } else {
          alert('Invalid transcript JSON format: missing run_id or gates');
        }
      } catch (err) {
        alert('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(run, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered Gates list
  const filteredGates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return run.gates
      .map((gate, originalIndex) => ({ gate, originalIndex }))
      .filter(({ gate }) => {
        if (!q) return true;
        if (gate.name.toLowerCase().includes(q)) return true;
        if (`loop ${gate.loop}`.includes(q) || `l${gate.loop}`.includes(q)) return true;
        const flagKeys = Object.keys(gate.flags);
        return flagKeys.some(f => f.toLowerCase().includes(q));
      });
  }, [run.gates, searchQuery]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
      
      {/* Header with Run Metadata & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Simulation Transcript &amp; Gates
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Run: <span className="font-mono text-slate-200 font-semibold">{run.run_id}</span> • Series: <span className="font-mono text-slate-200">{run.series || 'N/A'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* File Upload */}
          <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
            <Upload className="w-3 h-3" />
            <span>Load JSON</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          {/* Copy JSON */}
          <button
            onClick={handleCopyJSON}
            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Gate Sequence Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search gates by name, loop, or flag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>
        <span className="text-[11px] text-slate-500 font-mono shrink-0">
          {filteredGates.length}/{run.gates.length} gates
        </span>
      </div>

      {/* Logic Gates List (Scrollable) */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {filteredGates.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
            No matching logic gates found.
          </div>
        ) : (
          filteredGates.map(({ gate, originalIndex }) => {
            const isIncludedInCurrentLoop = activeLoop === undefined || gate.loop <= activeLoop;
            const flagsList = Object.keys(gate.flags).filter(k => Boolean(gate.flags[k]));

            return (
              <div
                key={originalIndex}
                className={`p-3 rounded-lg border transition-all ${
                  !isIncludedInCurrentLoop
                    ? 'opacity-35 bg-slate-950/40 border-slate-900'
                    : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-blue-950 text-blue-300 border border-blue-800">
                      L{gate.loop}
                    </span>
                    <span className="font-mono text-xs font-semibold text-white">
                      {gate.name}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRemoveGate(originalIndex)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                    title="Delete this gate"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Flags Chips */}
                <div className="mt-2 flex flex-wrap gap-1 items-center">
                  <Tag className="w-2.5 h-2.5 text-slate-500 mr-0.5" />
                  {flagsList.length === 0 ? (
                    <span className="text-[10px] text-slate-600 italic">No flags set</span>
                  ) : (
                    flagsList.map(flag => (
                      <span
                        key={flag}
                        onClick={() => handleToggleFlagOnGate(originalIndex, flag)}
                        className="cursor-pointer text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800 transition-colors"
                        title="Click to remove flag"
                      >
                        {flag} ✕
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add New Gate Builder */}
      <div className="pt-3 border-t border-slate-800 space-y-2">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Append Logic Gate
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <div className="sm:col-span-2">
            <label className="block text-[10px] text-slate-400 mb-0.5">Gate Event Name</label>
            <input
              type="text"
              placeholder="e.g. membrane_potential_shifted"
              value={newGateName}
              onChange={(e) => setNewGateName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Loop</label>
            <input
              type="number"
              min={1}
              max={200}
              value={newGateLoop}
              onChange={(e) => setNewGateLoop(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Biological Flag</label>
            <select
              value={selectedFlag}
              onChange={(e) => setSelectedFlag(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {AVAILABLE_FLAGS.map(f => (
                <option key={f.id} value={f.id}>
                  {f.id} [{f.dim}]
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={handleAddGate}
            disabled={!newGateName.trim()}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Gate
          </button>
        </div>
      </div>

    </div>
  );
};
