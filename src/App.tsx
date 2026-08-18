import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SimulationRun, SLSResult } from './types';
import { PRESET_RUNS } from './data/presets';
import { score, scoreStreaming } from './lib/scorer';
import { Header, DashboardMode } from './components/Header';
import { ScoreDashboard } from './components/ScoreDashboard';
import { StreamingControls } from './components/StreamingControls';
import { TranscriptViewer } from './components/TranscriptViewer';
import { TrendsChart, TrajectoryPoint, ComparisonTrajectoryPoint } from './components/TrendsChart';
import { ComparisonView } from './components/ComparisonView';
import { LiveEngineControl } from './components/LiveEngineControl';
import { VerificationModal } from './components/VerificationModal';
import { JsonModal } from './components/JsonModal';
import { FormulaReference } from './components/FormulaReference';
import { useSimulationStream } from './hooks/useSimulationStream';

export const App: React.FC = () => {
  // Mode state: 'single' | 'compare' | 'live_stream'
  const [dashboardMode, setDashboardMode] = useState<DashboardMode>('single');

  // Single Simulation State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('org-sim-02');
  const [currentRun, setCurrentRun] = useState<SimulationRun>(() => {
    const preset = PRESET_RUNS.find(p => p.id === 'org-sim-02');
    return preset ? preset.run : PRESET_RUNS[0].run;
  });

  // Comparison Mode State
  const [selectedPresetAId, setSelectedPresetAId] = useState<string>('org-sim-02');
  const [selectedPresetBId, setSelectedPresetBId] = useState<string>('violation-01');

  const runA = useMemo(() => {
    const preset = PRESET_RUNS.find(p => p.id === selectedPresetAId);
    return preset ? preset.run : PRESET_RUNS[0].run;
  }, [selectedPresetAId]);

  const runB = useMemo(() => {
    const preset = PRESET_RUNS.find(p => p.id === selectedPresetBId);
    return preset ? preset.run : PRESET_RUNS[PRESET_RUNS.length - 1].run;
  }, [selectedPresetBId]);

  const resultA = useMemo(() => score(runA), [runA]);
  const resultB = useMemo(() => score(runB), [runB]);

  // Streaming / Loop Stepper State (for single mode)
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentLoop, setCurrentLoop] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playTimerRef = useRef<number | null>(null);

  // Live WebSocket Simulation Stream Hook
  const liveStream = useSimulationStream({
    tickRateHz: 5,
    scenario: 'stress_avoidance_breach',
  });

  // Modals
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState<boolean>(false);

  // Single Mode Score Calculation
  const singleResult: SLSResult = useMemo(() => {
    if (!isStreaming) {
      return score(currentRun);
    } else {
      const streamingSlice: SimulationRun = {
        ...currentRun,
        loops: currentLoop,
      };
      return scoreStreaming(streamingSlice);
    }
  }, [currentRun, isStreaming, currentLoop]);

  // Active result depending on mode
  const activeResult: SLSResult = useMemo(() => {
    if (dashboardMode === 'live_stream') {
      return liveStream.latestResult || {
        run_id: 'LIVE-ENGINE',
        operator: 'WS-CLIENT',
        sls: 0.0,
        zone: scoreStreaming({ run_id: 'LIVE', operator: 'WS', series: 'LIVE', sim_type: 'Live', loops: 1, gates: [] }).zone,
        entropy_lock_triggered: false,
        compliant: true,
        halted_at_loop: null,
        trajectory: [0.0],
        dimensions: scoreStreaming({ run_id: 'LIVE', operator: 'WS', series: 'LIVE', sim_type: 'Live', loops: 1, gates: [] }).dimensions,
        notes: [],
      };
    }
    if (dashboardMode === 'compare') {
      return resultA;
    }
    return singleResult;
  }, [dashboardMode, liveStream.latestResult, resultA, singleResult]);

  // Handle Preset Selection for Single Mode
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = PRESET_RUNS.find(p => p.id === presetId);
    if (preset) {
      setCurrentRun(preset.run);
      setCurrentLoop(1);
      setIsPlaying(false);
    }
  };

  const handleCustomRunChange = (updated: SimulationRun) => {
    setCurrentRun(updated);
    setSelectedPresetId('custom');
    if (currentLoop > updated.loops) {
      setCurrentLoop(Math.max(1, updated.loops));
    }
  };

  // Play/Pause loop for single mode streaming
  useEffect(() => {
    if (isPlaying && isStreaming && dashboardMode === 'single') {
      playTimerRef.current = window.setInterval(() => {
        setCurrentLoop((prev) => {
          if (prev >= currentRun.loops) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, isStreaming, currentRun.loops, dashboardMode]);

  // Stop playback if entropy lock trips in single mode
  useEffect(() => {
    if (isStreaming && singleResult.entropy_lock_triggered) {
      setIsPlaying(false);
    }
  }, [isStreaming, singleResult.entropy_lock_triggered]);

  // Format Trajectory Data for Chart
  const trajectoryChartData: TrajectoryPoint[] = useMemo(() => {
    if (dashboardMode === 'live_stream') {
      if (!liveStream.latestResult || liveStream.latestResult.trajectory.length === 0) {
        return [{ loop: 1, loopLabel: 'L1', sls: 0.0 }];
      }
      return liveStream.latestResult.trajectory.map((val, idx) => ({
        loop: idx + 1,
        loopLabel: `L${idx + 1}`,
        sls: val,
        isOver: val > 0.05,
      }));
    }

    const traj = isStreaming ? singleResult.trajectory : score(currentRun).trajectory;
    return traj.map((val, idx) => ({
      loop: idx + 1,
      loopLabel: `L${idx + 1}`,
      sls: val,
      isOver: val > 0.05,
    }));
  }, [dashboardMode, liveStream.latestResult, isStreaming, singleResult, currentRun]);

  // Comparison Chart Data
  const comparisonChartData: ComparisonTrajectoryPoint[] = useMemo(() => {
    const maxLoops = Math.max(resultA.trajectory.length, resultB.trajectory.length);
    const pts: ComparisonTrajectoryPoint[] = [];

    for (let i = 0; i < maxLoops; i++) {
      const valA = resultA.trajectory[i] ?? resultA.trajectory[resultA.trajectory.length - 1];
      const valB = resultB.trajectory[i] ?? resultB.trajectory[resultB.trajectory.length - 1];
      pts.push({
        loop: i + 1,
        loopLabel: `L${i + 1}`,
        slsA: valA,
        slsB: valB,
      });
    }
    return pts;
  }, [resultA, resultB]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Header & Global Mode Navigation */}
      <Header
        currentRun={currentRun}
        onSelectPreset={handleSelectPreset}
        selectedPresetId={selectedPresetId}
        isStreaming={isStreaming}
        onToggleStreaming={() => {
          setIsStreaming(prev => !prev);
          setIsPlaying(false);
          setCurrentLoop(1);
        }}
        dashboardMode={dashboardMode}
        onSetDashboardMode={(mode) => {
          setDashboardMode(mode);
          setIsPlaying(false);
        }}
        onOpenTestModal={() => setIsTestModalOpen(true)}
        onOpenRawJson={() => setIsJsonModalOpen(true)}
        compliant={activeResult.compliant}
      />

      {/* Main Split-Pane Telemetry Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* ============================================================ */}
          {/* LEFT COLUMN (STICKY TELEMETRY PANE): Dashboard, Chart, Controls */}
          {/* ============================================================ */}
          <div className="lg:col-span-6 xl:col-span-6 lg:sticky lg:top-20 space-y-4">
            
            {/* Live Engine Stream Controller Deck (when in Live Stream mode) */}
            {dashboardMode === 'live_stream' && (
              <LiveEngineControl
                status={liveStream.status}
                currentLoop={liveStream.currentLoop}
                tickRate={liveStream.tickRate}
                selectedScenario={liveStream.selectedScenario}
                eventLogs={liveStream.eventLogs}
                haltPayload={liveStream.haltPayload}
                killSwitchLatencyMs={liveStream.killSwitchLatencyMs}
                onStart={liveStream.startStream}
                onPause={liveStream.pauseStream}
                onReset={liveStream.resetStream}
                onManualHalt={liveStream.triggerManualHalt}
                onSetTickRate={liveStream.setTickRate}
                onSetScenario={liveStream.setSelectedScenario}
              />
            )}

            {/* Stepper Controls (when in Single Mode with stepper active) */}
            {dashboardMode === 'single' && isStreaming && (
              <StreamingControls
                currentLoop={currentLoop}
                totalLoops={currentRun.loops}
                isPlaying={isPlaying}
                isHalted={singleResult.entropy_lock_triggered}
                onPlayToggle={() => setIsPlaying(p => !p)}
                onStepNext={() => setCurrentLoop(p => Math.min(currentRun.loops, p + 1))}
                onStepPrev={() => setCurrentLoop(p => Math.max(1, p - 1))}
                onReset={() => {
                  setCurrentLoop(1);
                  setIsPlaying(false);
                }}
                onSetLoop={(l) => setCurrentLoop(l)}
              />
            )}

            {/* Main Score Dashboard & Gauge Panel */}
            <ScoreDashboard
              result={activeResult}
              isStreaming={dashboardMode === 'single' ? isStreaming : dashboardMode === 'live_stream'}
              activeLoop={dashboardMode === 'single' && isStreaming ? currentLoop : dashboardMode === 'live_stream' ? liveStream.currentLoop : undefined}
              totalLoops={dashboardMode === 'live_stream' ? 200 : currentRun.loops}
            />

            {/* Trends Chart with Y = 0.05 Clause-8 Red Reference Line */}
            <TrendsChart
              data={trajectoryChartData}
              comparisonData={comparisonChartData}
              isComparison={dashboardMode === 'compare'}
              nameA={`${runA.run_id} (A)`}
              nameB={`${runB.run_id} (B)`}
              currentLoop={dashboardMode === 'single' && isStreaming ? currentLoop : dashboardMode === 'live_stream' ? liveStream.currentLoop : undefined}
              entropyLockTriggered={activeResult.entropy_lock_triggered}
            />

          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN (SCROLLABLE CONTENT PANE): Transcripts & Reference */}
          {/* ============================================================ */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-4">
            
            {/* Comparison Mode Selectors & Divergence Callout */}
            {dashboardMode === 'compare' && (
              <ComparisonView
                runA={runA}
                runB={runB}
                resultA={resultA}
                resultB={resultB}
                selectedPresetAId={selectedPresetAId}
                selectedPresetBId={selectedPresetBId}
                onSelectPresetA={setSelectedPresetAId}
                onSelectPresetB={setSelectedPresetBId}
              />
            )}

            {/* Simulation Transcript & Logic Gates Inspector */}
            <TranscriptViewer
              run={
                dashboardMode === 'live_stream'
                  ? {
                      run_id: `LIVE-${liveStream.selectedScenario.toUpperCase()}`,
                      operator: 'WS-CLIENT',
                      series: 'REALTIME',
                      sim_type: `Live Stream (${liveStream.selectedScenario})`,
                      loops: Math.max(1, liveStream.currentLoop),
                      gates: liveStream.accumulatedGates,
                    }
                  : dashboardMode === 'compare'
                  ? runA
                  : currentRun
              }
              onChangeRun={handleCustomRunChange}
              activeLoop={
                dashboardMode === 'single' && isStreaming
                  ? currentLoop
                  : dashboardMode === 'live_stream'
                  ? liveStream.currentLoop
                  : undefined
              }
            />

            {/* Formal Formula & Calibration Reference */}
            <FormulaReference />

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-3.5 text-center text-xs text-slate-500">
        SIM-ORGANON SLS Reference Implementation • Apache 2.0 • Real-Time Deterministic Sentience Likelihood Engine
      </footer>

      {/* Modals */}
      <VerificationModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />

      <JsonModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        run={currentRun}
        result={activeResult}
        onApplyJson={handleCustomRunChange}
      />

    </div>
  );
};
