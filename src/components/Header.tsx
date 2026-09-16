import React from "react";
import { Mic, Sparkles } from "lucide-react";

interface HeaderProps {
  compact?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ compact = false }) => {
  return (
    <header className="w-full text-center mb-6">
      <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 text-slate-200 text-xs font-medium tracking-wide mb-3 border border-slate-700 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Oral Speech & Presentation Assessment</span>
      </div>

      <div className="flex items-center justify-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
          <Mic className="w-5 h-5" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">
          AI AUDIO SCORER
        </h1>
      </div>

      {!compact && (
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed px-4">
          Record your presentation and receive your AI-generated audio score.
        </p>
      )}
    </header>
  );
};
