import React, { useEffect, useState } from "react";
import { Sparkles, AudioWaveform, BrainCircuit, Check } from "lucide-react";

interface LoadingScreenProps {
  studentName: string;
  activity: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  studentName,
  activity,
}) => {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    { label: "Transcribing student's spoken words...", desc: "Converting speech into verbatim text for content analysis" },
    { label: "Analyzing content & product knowledge...", desc: "Evaluating topic features, benefits, and factual understanding" },
    { label: "Assessing persuasiveness & organization...", desc: "Examining arguments, presentation structure, and engagement" },
    { label: "Synthesizing scores & content observations...", desc: "Computing 100-point content-based score and actionable feedback" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2400);

    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center space-y-6">
      {/* Animated AI processing icon */}
      <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
        <div className="absolute inset-2 rounded-full bg-indigo-500/10 animate-pulse" />
        <div className="relative w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
          <BrainCircuit className="w-8 h-8 animate-pulse" />
        </div>
      </div>

      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
          Analyzing your audio...
        </h2>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
          Please wait while AI evaluates your performance.
        </p>
        <div className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 py-1 px-3 rounded-full inline-block">
          {studentName} • {activity}
        </div>
      </div>

      {/* Dynamic Progress Steps */}
      <div className="space-y-3 text-left pt-2">
        {steps.map((step, idx) => {
          const isDone = idx < stepIndex;
          const isCurrent = idx === stepIndex;

          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-all duration-300 ${
                isCurrent
                  ? "bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800"
                  : isDone
                  ? "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-80"
                  : "bg-transparent border-transparent opacity-40"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                      ? "bg-indigo-600 text-white animate-spin"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : isCurrent ? "✦" : idx + 1}
                </div>
                <div>
                  <p className={`text-xs font-semibold ${isCurrent ? "text-indigo-900 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"}`}>
                    {step.label}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {step.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2">
        <p className="text-xs text-slate-400 italic">
          High-precision multimodal audio scoring in progress. This takes about 5–10 seconds.
        </p>
      </div>
    </div>
  );
};
