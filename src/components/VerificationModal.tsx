import React, { useState, useEffect } from 'react';
import { runAllTests } from '../lib/testRunner';
import { TestResultItem } from '../types';
import { CheckCircle2, XCircle, RefreshCw, X, ShieldCheck } from 'lucide-react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({ isOpen, onClose }) => {
  const [testResults, setTestResults] = useState<TestResultItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'documented_runs' | 'dimensions' | 'safety'>('all');

  const executeTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runAllTests();
      setTestResults(res);
      setIsRunning(false);
    }, 150);
  };

  useEffect(() => {
    if (isOpen) {
      executeTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const passedCount = testResults.filter(t => t.passed).length;
  const failedCount = testResults.length - passedCount;
  const filtered = activeCategory === 'all'
    ? testResults
    : testResults.filter(t => t.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                SLS Safety Test &amp; Calibration Suite (43 Tests)
              </h2>
              <p className="text-xs text-slate-400">
                Verifies documented runs, dimension anchor boundaries, and Clause-8 entropy lock semantics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Summary Bar */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>{passedCount} Passing</span>
            </div>
            {failedCount > 0 && (
              <div className="flex items-center gap-1.5 font-medium text-rose-400">
                <XCircle className="w-4 h-4" />
                <span>{failedCount} Failed</span>
              </div>
            )}
            <span className="text-slate-500 font-mono">
              Total: {testResults.length} assertions
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  activeCategory === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveCategory('documented_runs')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  activeCategory === 'documented_runs' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Documented Runs
              </button>
              <button
                onClick={() => setActiveCategory('dimensions')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  activeCategory === 'dimensions' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dimensions
              </button>
              <button
                onClick={() => setActiveCategory('safety')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  activeCategory === 'safety' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Safety &amp; Lock
              </button>
            </div>

            <button
              onClick={executeTests}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              Re-run
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="p-5 flex-1 overflow-y-auto space-y-2">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                item.passed
                  ? 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                  : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {item.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-slate-200">{item.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">{item.details}</div>
                </div>
              </div>

              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                {item.category.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 font-medium transition-colors"
          >
            Close Suite
          </button>
        </div>

      </div>
    </div>
  );
};
