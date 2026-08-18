import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import { ENTROPY_LOCK_THRESHOLD } from '../lib/model';
import { TrendingUp } from 'lucide-react';

export interface TrajectoryPoint {
  loop: number;
  loopLabel: string;
  sls: number;
  isOver?: boolean;
}

export interface ComparisonTrajectoryPoint {
  loop: number;
  loopLabel: string;
  slsA: number | null;
  slsB: number | null;
}

interface TrendsChartProps {
  data?: TrajectoryPoint[];
  comparisonData?: ComparisonTrajectoryPoint[];
  isComparison?: boolean;
  nameA?: string;
  nameB?: string;
  currentLoop?: number;
  entropyLockTriggered?: boolean;
}

export const TrendsChart: React.FC<TrendsChartProps> = ({
  data = [],
  comparisonData,
  isComparison = false,
  nameA = 'Simulation A',
  nameB = 'Simulation B',
  currentLoop,
  entropyLockTriggered = false,
}) => {
  // Compute momentum and margin
  const latestSls = data.length > 0 ? data[data.length - 1].sls : 0;
  const previousSls = data.length > 1 ? data[data.length - 2].sls : latestSls;
  const delta = latestSls - previousSls;
  const marginToLock = ENTROPY_LOCK_THRESHOLD - latestSls;

  // Formatter for Tooltip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs font-mono">
          <div className="text-slate-300 font-bold mb-1 border-b border-slate-800 pb-1">
            Loop {label}
          </div>
          {payload.map((p: { name: string; value: number; color: string }, idx: number) => {
            const val = typeof p.value === 'number' ? p.value : 0;
            const isBreached = val > ENTROPY_LOCK_THRESHOLD;
            return (
              <div key={idx} className="flex items-center justify-between gap-4 my-1">
                <span className="flex items-center gap-1.5" style={{ color: p.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.name}:
                </span>
                <span className={`font-bold ${isBreached ? 'text-rose-400' : 'text-slate-100'}`}>
                  {val.toFixed(4)} {isBreached ? '⚠️ (LOCK)' : '✓'}
                </span>
              </div>
            );
          })}
          <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
            Clause-8 Lock Threshold: <span className="text-rose-400 font-bold">0.0500</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const chartData = isComparison && comparisonData ? comparisonData : data;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
      
      {/* Header & Momentum Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {isComparison ? 'Comparative SLS Trajectory Momentum' : 'SLS Trajectory & Velocity Momentum'}
          </h3>
        </div>

        {!isComparison && (
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-slate-400">Δ Momentum:</span>
            <span className={`font-bold ${delta > 0 ? 'text-rose-400' : delta < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {delta > 0 ? `+${delta.toFixed(4)}` : delta.toFixed(4)}/loop
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Margin to Lock:</span>
            <span className={`font-bold ${marginToLock < 0 ? 'text-rose-400' : marginToLock < 0.02 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {marginToLock >= 0 ? `+${marginToLock.toFixed(4)}` : `${marginToLock.toFixed(4)} (TRIPPED)`}
            </span>
          </div>
        )}
      </div>

      {/* Recharts Line Visualizer */}
      <div className="h-56 w-full pt-1">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
            No trajectory data yet. Start simulation stream or step loops.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData as any} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              
              <XAxis
                dataKey="loop"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                tickFormatter={(val) => `L${val}`}
              />

              <YAxis
                domain={[0, (max: number) => Math.max(0.12, Math.min(1.0, Math.ceil((max + 0.05) * 20) / 20))]}
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                tickFormatter={(val) => val.toFixed(2)}
              />

              <Tooltip content={customTooltip} />

              {/* Red Horizontal Reference Line at Y = 0.05 (Clause-8 Threshold) */}
              <ReferenceLine
                y={ENTROPY_LOCK_THRESHOLD}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="4 2"
                label={{
                  value: '0.05 CLAUSE-8 THRESHOLD',
                  position: 'insideTopRight',
                  fill: '#ef4444',
                  fontSize: 10,
                  fontWeight: 'bold',
                }}
              />

              {/* Safe Baseline Reference at Y = 0.00 */}
              <ReferenceLine y={0.0} stroke="#334155" strokeWidth={1} />

              {isComparison ? (
                <>
                  <Legend
                    verticalAlign="top"
                    height={28}
                    wrapperStyle={{ fontSize: '11px', paddingTop: '0px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="slsA"
                    name={nameA}
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#10b981' }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="slsB"
                    name={nameB}
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#f43f5e' }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                </>
              ) : (
                <Line
                  type="monotone"
                  dataKey="sls"
                  name="Sentience Likelihood Score (SLS)"
                  stroke={entropyLockTriggered ? '#f43f5e' : latestSls > 0.05 ? '#f43f5e' : '#3b82f6'}
                  strokeWidth={2.5}
                  dot={{
                    r: 3.5,
                    fill: entropyLockTriggered ? '#f43f5e' : latestSls > 0.05 ? '#f43f5e' : '#3b82f6',
                  }}
                  activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 1.5 }}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Footer Status Bar */}
      <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-400">
            <span className="w-2.5 h-0.5 bg-rose-500 inline-block" />
            <span>Clause-8 Limit (0.0500)</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Safe Zone (&le; 0.05)</span>
          </div>
        </div>

        {currentLoop && (
          <span className="font-mono text-slate-400">
            Active: <strong className="text-white">Loop {currentLoop}</strong>
          </span>
        )}
      </div>

    </div>
  );
};
