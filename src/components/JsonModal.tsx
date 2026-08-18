import React, { useState, useEffect } from 'react';
import { SimulationRun, SLSResult } from '../types';
import { X, Copy, Check, Save } from 'lucide-react';

interface JsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  run: SimulationRun;
  result: SLSResult;
  onApplyJson: (updated: SimulationRun) => void;
}

export const JsonModal: React.FC<JsonModalProps> = ({
  isOpen,
  onClose,
  run,
  result,
  onApplyJson,
}) => {
  const [tab, setTab] = useState<'input' | 'audit'>('input');
  const [rawText, setRawText] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (tab === 'input') {
      setRawText(JSON.stringify(run, null, 2));
    } else {
      setRawText(JSON.stringify(result, null, 2));
    }
    setErrorMsg(null);
  }, [tab, run, result, isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    try {
      const parsed = JSON.parse(rawText);
      if (!parsed.run_id || !Array.isArray(parsed.gates)) {
        throw new Error('JSON missing required "run_id" or "gates" array');
      }
      onApplyJson(parsed);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON format';
      setErrorMsg(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setTab('input')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  tab === 'input' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Simulation Transcript (Input)
              </button>
              <button
                onClick={() => setTab('audit')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  tab === 'audit' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                SLS Audit Record (Output)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 p-4 bg-slate-950 overflow-hidden flex flex-col">
          {errorMsg && (
            <div className="mb-2 p-2 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-mono">
              {errorMsg}
            </div>
          )}
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            readOnly={tab === 'audit'}
            className="flex-1 w-full bg-slate-950 text-slate-200 font-mono text-xs p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-blue-500 resize-none"
            spellCheck={false}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {tab === 'input' ? 'Edit input JSON and click Apply to re-score' : 'Read-only audit record output'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            {tab === 'input' && (
              <button
                onClick={handleApply}
                className="inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Apply JSON
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
