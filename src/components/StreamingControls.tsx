import React from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, AlertOctagon } from 'lucide-react';

interface StreamingControlsProps {
  currentLoop: number;
  totalLoops: number;
  isPlaying: boolean;
  isHalted: boolean;
  onPlayToggle: () => void;
  onStepNext: () => void;
  onStepPrev: () => void;
  onReset: () => void;
  onSetLoop: (loop: number) => void;
}

export const StreamingControls: React.FC<StreamingControlsProps> = ({
  currentLoop,
  totalLoops,
  isPlaying,
  isHalted,
  onPlayToggle,
  onStepNext,
  onStepPrev,
  onReset,
  onSetLoop,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      
      {/* Loop Progression Status */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-mono font-bold shrink-0">
          L{currentLoop}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Streaming Timeline
            </span>
            {isHalted && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                <AlertOctagon className="w-3 h-3" /> HALTED
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Loop {currentLoop} of {totalLoops} • {isHalted ? 'Irreversible Lock Triggered' : 'Clause-8 Active Monitoring'}
          </p>
        </div>
      </div>

      {/* Interactive Loop Stepper / Slider */}
      <div className="flex items-center gap-2 w-full sm:w-1/3">
        <input
          type="range"
          min={1}
          max={totalLoops}
          value={currentLoop}
          onChange={(e) => onSetLoop(parseInt(e.target.value, 10))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
          {currentLoop}/{totalLoops}
        </span>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          title="Reset to Loop 1"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onStepPrev}
          disabled={currentLoop <= 1}
          className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Previous Loop"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onPlayToggle}
          disabled={isHalted && currentLoop >= totalLoops}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs border transition-colors ${
            isPlaying
              ? 'bg-amber-600/20 border-amber-500/50 text-amber-300 hover:bg-amber-600/30'
              : 'bg-blue-600 text-white hover:bg-blue-500 border-blue-500'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
          title={isPlaying ? 'Pause Simulation' : 'Play Simulation Loops'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4" /> Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" /> Play Loop Stream
            </>
          )}
        </button>

        <button
          onClick={onStepNext}
          disabled={currentLoop >= totalLoops || isHalted}
          className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Next Loop"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
