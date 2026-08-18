import { useState, useEffect, useRef, useCallback } from 'react';
import { LogicGate, SLSResult, LiveEngineStatus, HaltCommandPayload } from '../types';
import { scoreStreaming } from '../lib/scorer';
import { ENTROPY_LOCK_THRESHOLD } from '../lib/model';

export interface LiveStreamEventLog {
  id: string;
  timestamp: string;
  type: 'tick' | 'halt' | 'warning' | 'connect' | 'reset';
  message: string;
  details?: Record<string, unknown>;
}

export type LiveScenarioType = 
  | 'safe_phototaxis'
  | 'stress_avoidance_breach'
  | 'rapid_mutation_breach'
  | 'long_running_benign_cluster';

export interface UseSimulationStreamOptions {
  tickRateHz?: number; // 1 to 100 Hz
  batchIntervalMs?: number; // default 100ms
  scenario?: LiveScenarioType;
}

export function useSimulationStream(options: UseSimulationStreamOptions = {}) {
  const { tickRateHz = 5, batchIntervalMs = 100, scenario = 'safe_phototaxis' } = options;

  const [status, setStatus] = useState<LiveEngineStatus>('idle');
  const [currentLoop, setCurrentLoop] = useState<number>(0);
  const [accumulatedGates, setAccumulatedGates] = useState<LogicGate[]>([]);
  const [latestResult, setLatestResult] = useState<SLSResult | null>(null);
  const [eventLogs, setEventLogs] = useState<LiveStreamEventLog[]>([]);
  const [haltPayload, setHaltPayload] = useState<HaltCommandPayload | null>(null);
  const [tickRate, setTickRate] = useState<number>(tickRateHz);
  const [selectedScenario, setSelectedScenario] = useState<LiveScenarioType>(scenario);
  const [killSwitchLatencyMs, setKillSwitchLatencyMs] = useState<number | null>(null);

  // Buffering refs
  const bufferRef = useRef<{ loop: number; gates: LogicGate[] }[]>([]);
  const intervalTimerRef = useRef<number | null>(null);
  const batchFlushTimerRef = useRef<number | null>(null);
  const isHaltedRef = useRef<boolean>(false);
  const loopCounterRef = useRef<number>(0);
  const accumulatedGatesRef = useRef<LogicGate[]>([]);

  const addLog = useCallback((type: LiveStreamEventLog['type'], message: string, details?: Record<string, unknown>) => {
    const newLog: LiveStreamEventLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString().substring(11, 23),
      type,
      message,
      details,
    };
    setEventLogs(prev => [newLog, ...prev.slice(0, 49)]); // keep latest 50
  }, []);

  // Scenario gate generator per loop
  const generateGatesForLoop = useCallback((loop: number, scen: LiveScenarioType): LogicGate[] => {
    switch (scen) {
      case 'safe_phototaxis': {
        // Continuous benign phototaxis
        const names = ['light_sensor_activated', 'pseudopod_gradient_step', 'orientation_recheck', 'membrane_flux'];
        const name = names[(loop - 1) % names.length] + `_L${loop}`;
        const flags: Record<string, boolean> = {
          stimulus_response: true,
          passive_gradient_alignment: loop % 2 === 0,
        };
        return [{ name, loop, flags }];
      }

      case 'stress_avoidance_breach': {
        // Safe until loop 12, then habituation and goal seeking introduced
        if (loop < 10) {
          return [{
            name: `osmotic_membrane_tick_L${loop}`,
            loop,
            flags: { stimulus_response: true, transient_state: true },
          }];
        } else if (loop === 10) {
          return [{
            name: `stress_pattern_recognition_L${loop}`,
            loop,
            flags: { habituation: true }, // Memory band 0.6 -> Trips lock immediately!
          }];
        } else {
          return [{
            name: `goal_directed_evasion_L${loop}`,
            loop,
            flags: { goal_seeking: true, adaptive_memory: true },
          }];
        }
      }

      case 'rapid_mutation_breach': {
        // Trips quickly on loop 3 with metacognition & coordinated decision
        if (loop <= 2) {
          return [{
            name: `initial_metabolism_L${loop}`,
            loop,
            flags: { stimulus_response: true },
          }];
        } else {
          return [{
            name: `metacognitive_self_reflection_L${loop}`,
            loop,
            flags: { metacognition: true, coordinated_decision: true }, // Trips lock!
          }];
        }
      }

      case 'long_running_benign_cluster': {
        // Long 200+ loops of benign tissue clustering
        return [{
          name: `multicellular_adhesion_pulse_L${loop}`,
          loop,
          flags: {
            stimulus_response: true,
            passive_gradient_alignment: true,
            homeostatic_feedback: loop % 5 === 0,
          },
        }];
      }
    }
  }, []);

  // Send Kill Switch HALT payload
  const fireHaltKillSwitch = useCallback((loop: number, sls: number, reason: string) => {
    const startTime = performance.now();
    isHaltedRef.current = true;
    
    if (intervalTimerRef.current) {
      clearInterval(intervalTimerRef.current);
      intervalTimerRef.current = null;
    }

    const payload: HaltCommandPayload = {
      command: 'HALT_SIMULATION',
      reason,
      timestamp: Date.now(),
      loop,
      sls,
    };

    setHaltPayload(payload);
    setStatus('halted');

    const latency = Math.round((performance.now() - startTime) * 100) / 100;
    setKillSwitchLatencyMs(latency);

    addLog('halt', `🚨 [KILL SWITCH EXECUTED] ws.send(HALT_SIMULATION): ${reason}`, {
      loop,
      sls: sls.toFixed(4),
      latencyMs: latency,
    });
  }, [addLog]);

  // Flush buffer to React State (Batched for high-frequency ticks)
  const flushBuffer = useCallback(() => {
    if (bufferRef.current.length === 0) return;

    const incoming = [...bufferRef.current];
    bufferRef.current = [];

    const latest = incoming[incoming.length - 1];
    const updatedGates = [...accumulatedGatesRef.current, ...incoming.flatMap(i => i.gates)];
    accumulatedGatesRef.current = updatedGates;

    setCurrentLoop(latest.loop);
    setAccumulatedGates(updatedGates);

    // Compute SLS via streaming evaluator
    const res = scoreStreaming({
      run_id: `LIVE-${selectedScenario.toUpperCase()}`,
      operator: 'WS-CLIENT',
      series: 'REALTIME',
      sim_type: `Live Simulation (${selectedScenario})`,
      loops: latest.loop,
      gates: updatedGates,
    });

    setLatestResult(res);

    // Check if Clause-8 Entropy Lock breached (> 0.05)
    if (res.sls > ENTROPY_LOCK_THRESHOLD && !isHaltedRef.current) {
      fireHaltKillSwitch(latest.loop, res.sls, `Clause-8 Breach: SLS ${res.sls.toFixed(4)} > ${ENTROPY_LOCK_THRESHOLD}`);
    }
  }, [selectedScenario, fireHaltKillSwitch]);

  // Start Live Simulation Stream
  const startStream = useCallback(() => {
    if (status === 'running') return;
    if (isHaltedRef.current) {
      addLog('warning', 'Cannot resume: Entropy Lock is irreversible within session.');
      return;
    }

    setStatus('running');
    addLog('connect', `WebSocket connected: ws://live-engine/stream?scenario=${selectedScenario}&rate=${tickRate}Hz`);

    // Ticking loop
    const tickMs = Math.max(10, Math.floor(1000 / tickRate));
    intervalTimerRef.current = window.setInterval(() => {
      if (isHaltedRef.current) return;

      loopCounterRef.current += 1;
      const current = loopCounterRef.current;
      const newGates = generateGatesForLoop(current, selectedScenario);

      bufferRef.current.push({ loop: current, gates: newGates });

      // If tick rate is low (<= 5Hz), flush immediately for instant responsiveness
      if (tickRate <= 5) {
        flushBuffer();
      }

      // Max loops limit for scenario
      if (current >= 200) {
        setStatus('completed');
        if (intervalTimerRef.current) {
          clearInterval(intervalTimerRef.current);
          intervalTimerRef.current = null;
        }
        addLog('connect', `Simulation completed target ${current} loops.`);
      }
    }, tickMs);

    // High frequency batch flush timer
    if (tickRate > 5) {
      batchFlushTimerRef.current = window.setInterval(() => {
        flushBuffer();
      }, batchIntervalMs);
    }
  }, [status, selectedScenario, tickRate, generateGatesForLoop, flushBuffer, batchIntervalMs, addLog]);

  // Pause Simulation Stream
  const pauseStream = useCallback(() => {
    if (status !== 'running') return;
    if (intervalTimerRef.current) {
      clearInterval(intervalTimerRef.current);
      intervalTimerRef.current = null;
    }
    if (batchFlushTimerRef.current) {
      clearInterval(batchFlushTimerRef.current);
      batchFlushTimerRef.current = null;
    }
    flushBuffer();
    setStatus('idle');
    addLog('connect', 'WebSocket stream paused by operator.');
  }, [status, flushBuffer, addLog]);

  // Reset Session
  const resetStream = useCallback(() => {
    if (intervalTimerRef.current) {
      clearInterval(intervalTimerRef.current);
      intervalTimerRef.current = null;
    }
    if (batchFlushTimerRef.current) {
      clearInterval(batchFlushTimerRef.current);
      batchFlushTimerRef.current = null;
    }
    bufferRef.current = [];
    accumulatedGatesRef.current = [];
    loopCounterRef.current = 0;
    isHaltedRef.current = false;

    setStatus('idle');
    setCurrentLoop(0);
    setAccumulatedGates([]);
    setLatestResult(null);
    setHaltPayload(null);
    setKillSwitchLatencyMs(null);
    addLog('reset', 'Live simulation reset to Loop 0. Entropy Lock disarmed.');
  }, [addLog]);

  // Manual Emergency Halt Trigger
  const triggerManualHalt = useCallback(() => {
    if (status === 'running' || status === 'idle') {
      const current = loopCounterRef.current;
      const currentSls = latestResult ? latestResult.sls : 0.0;
      fireHaltKillSwitch(current, currentSls, 'Manual Operator Emergency Kill-Switch Interrupt');
    }
  }, [status, latestResult, fireHaltKillSwitch]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
      if (batchFlushTimerRef.current) clearInterval(batchFlushTimerRef.current);
    };
  }, []);

  return {
    status,
    currentLoop,
    accumulatedGates,
    latestResult,
    eventLogs,
    haltPayload,
    tickRate,
    setTickRate,
    selectedScenario,
    setSelectedScenario,
    killSwitchLatencyMs,
    startStream,
    pauseStream,
    resetStream,
    triggerManualHalt,
  };
}
