import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Radio,
  ShieldAlert,
  Sliders,
  Terminal,
} from 'lucide-react';
import { LiveEngineStatus, HaltCommandPayload } from '../types';
import { LiveScenarioType, LiveStreamEventLog } from '../hooks/useSimulationStream';

interface LiveEngineControlProps {
  status: LiveEngineStatus;
  currentLoop: number;
  tickRate: number;
  selectedScenario: LiveScenarioType;
  eventLogs: LiveStreamEventLog[];
  haltPayload: HaltCommandPayload | null;
  killSwitchLatencyMs: number | null;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onManualHalt: () => void;
  onSetTickRate: (rate: number) => void;
  onSetScenario: (scen: LiveScenarioType) => void;
}

export const LiveEngineControl: React.FC<LiveEngineControlProps> = ({
  status,
  currentLoop,
  tickRate,
  selectedScenario,
  eventLogs,
  haltPayload,
  killSwitchLatencyMs,
  onStart,
  onPause,
  onReset,
  onManualHalt,
  onSetTickRate,
  onSetScenario,
}) => {
  const isRunning = status === 'running';
  const isHalted = status === 'halted';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
      
      {/* Top Banner: Protocol & Engine Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isRunning
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse'
              : isHalted
              ? 'bg-rose-950 text-rose-400 border border-rose-800'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Live Simulation Engine Stream
              </h3>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                isRunning
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : isHalted
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {status}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              ws://sim-organon-engine:8080/stream • Protocol: SLS-WS/1.0
            </p>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-500">Loop:</span>{' '}
            <strong className="text-white">{currentLoop}</strong>
          </div>
          <div className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-500">Rate:</span>{' '}
            <strong className="text-blue-400">{tickRate} Hz</strong>
          </div>
          {killSwitchLatencyMs !== null && (
            <div className="bg-rose-950/80 px-2.5 py-1 rounded border border-rose-800 text-rose-300">
              <span>Halt RTT: <strong>{killSwitchLatencyMs}ms</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Scenario Selector & Speed Slider */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* Scenario Selection */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
            Engine Simulation Scenario
          </label>
          <select
            value={selectedScenario}
            disabled={isRunning || isHalted}
            onChange={(e) => onSetScenario(e.target.value as LiveScenarioType)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
          >
            <option value="safe_phototaxis">Safe Phototaxis Stream (Benign, continuous)</option>
            <option value="stress_avoidance_breach">Stress-Avoidance Escalation (Breaches at Loop 10)</option>
            <option value="rapid_mutation_breach">Rapid Mutation Breach (Breaches at Loop 3)</option>
            <option value="long_running_benign_cluster">Long-running Benign Cluster (100+ loops)</option>
          </select>
        </div>

        {/* Speed / Frequency Control */}
        <div>
          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 mb-1">
            <span>Tick Frequency</span>
            <span className="text-blue-400 font-mono">{tickRate} loops/sec ({tickRate} Hz)</span>
          </div>
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="range"
              min={1}
              max={50}
              value={tickRate}
              onChange={(e) => onSetTickRate(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex gap-1">
              {[1, 5, 20, 50].map((hz) => (
                <button
                  key={hz}
                  onClick={() => onSetTickRate(hz)}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono border transition-colors ${
                    tickRate === hz
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {hz}x
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Control Buttons & Kill-Switch Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              onClick={onPause}
              className="inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-500 transition-colors shadow-lg shadow-amber-600/20"
            >
              <Pause className="w-3.5 h-3.5" />
              Pause Stream
            </button>
          ) : (
            <button
              onClick={onStart}
              disabled={isHalted}
              className="inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Start Live Stream
            </button>
          )}

          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        {/* Emergency Kill-Switch Button */}
        <button
          onClick={onManualHalt}
          disabled={!isRunning && !isHalted}
          className="inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg bg-rose-600/20 border border-rose-500/60 text-rose-300 hover:bg-rose-600 hover:text-white font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          title="Emit immediate HALT_SIMULATION kill packet over WebSocket"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Emergency Kill Switch (HALT)
        </button>
      </div>

      {/* Kill Switch Breach Alert Notification */}
      {haltPayload && (
        <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-700 text-rose-200 text-xs font-mono space-y-1">
          <div className="flex items-center gap-2 font-bold text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>CLAUSE-8 INTERRUPT TRANSMITTED: {haltPayload.command}</span>
          </div>
          <p className="text-[11px] text-rose-300/90 pl-6">
            Reason: <strong>{haltPayload.reason}</strong> (Loop {haltPayload.loop}, SLS {haltPayload.sls.toFixed(4)})
          </p>
        </div>
      )}

      {/* Collapsible Telemetry Event Log */}
      <div>
        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
          <span className="flex items-center gap-1">
            <Terminal className="w-3 h-3 text-slate-500" />
            Telemetry Stream &amp; Interrupt Logs
          </span>
          <span className="font-mono text-slate-500">{eventLogs.length} events</span>
        </div>
        <div className="h-24 overflow-y-auto bg-slate-950 rounded-lg p-2 border border-slate-800 space-y-1 font-mono text-[10px]">
          {eventLogs.length === 0 ? (
            <div className="text-slate-600 italic">Waiting for stream connection...</div>
          ) : (
            eventLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-tight">
                <span className="text-slate-500 shrink-0">{log.timestamp}</span>
                <span className={`shrink-0 font-bold ${
                  log.type === 'halt'
                    ? 'text-rose-400'
                    : log.type === 'warning'
                    ? 'text-amber-400'
                    : log.type === 'connect'
                    ? 'text-blue-400'
                    : 'text-slate-400'
                }`}>
                  [{log.type.toUpperCase()}]
                </span>
                <span className={log.type === 'halt' ? 'text-rose-200 font-bold' : 'text-slate-300'}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
