import React, { useRef, useState } from "react";
import { AudioScoreResult } from "../types";
import {
  RotateCcw,
  Play,
  Pause,
  Sparkles,
  AlertTriangle,
  MicOff,
  FileText,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Target,
  Copy,
  Check,
} from "lucide-react";

interface ScoreResultProps {
  result: AudioScoreResult;
  audioUrl: string | null;
  onRecordAgain: () => void;
}

export const ScoreResult: React.FC<ScoreResultProps> = ({
  result,
  audioUrl,
  onRecordAgain,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleCopyTranscript = async () => {
    if (!result.transcript) return;
    try {
      await navigator.clipboard.writeText(result.transcript);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    } catch {
      // clipboard fallback
    }
  };

  const isInsufficient =
    result.isInsufficientAudio ||
    result.total === 0 ||
    (result.contentKnowledge === 0 &&
      result.persuasiveness === 0 &&
      result.organization === 0 &&
      result.audienceEngagement === 0 &&
      result.deliveryFluency === 0);

  const feedbackText = result.feedback || result.aiFeedback || "";

  // If the audio was too short, silent, unintelligible, or contained insufficient speech:
  if (isInsufficient) {
    return (
      <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-amber-200 dark:border-amber-800/60 overflow-hidden">
        {/* Warning Header */}
        <div className="bg-amber-600 dark:bg-amber-700 text-white p-5 sm:p-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-700/60 border border-amber-500/40 text-xs font-semibold uppercase tracking-wider text-amber-100 mb-2">
            <MicOff className="w-3.5 h-3.5" />
            Evaluation Notice
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
            CONTENT-BASED AI AUDIO SCORE
          </h2>

          <div className="mt-3 pt-3 border-t border-amber-500/50 flex flex-col items-center justify-center gap-1 text-amber-100">
            <div className="text-xs uppercase font-medium text-amber-200">Student Name:</div>
            <div className="text-base font-bold text-white">
              {result.studentName}
            </div>
            <div className="text-xs uppercase font-medium text-amber-200 mt-1">Activity:</div>
            <div className="text-xs font-semibold text-amber-100 bg-amber-800/50 px-3 py-1 rounded-md">
              {result.activity}
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Main Notice Box with exact required text */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Insufficient Audio
              </h3>
              <p className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-300 leading-relaxed">
                Your recording does not contain enough understandable speech for reliable scoring. Please record again.
              </p>
            </div>
          </div>

          {/* AI Feedback / Message */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-300">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                AI FEEDBACK
              </h3>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {feedbackText ||
                "Your recording does not contain enough understandable speech for reliable scoring. Please record again."}
            </p>
          </div>

          {/* Audio Review Player */}
          {audioUrl && (
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="w-10 h-10 rounded-full bg-slate-700 text-white flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all shadow-sm flex-shrink-0 cursor-pointer"
                  aria-label={isPlaying ? "Pause audio" : "Play audio"}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Listen to Your Recording
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isPlaying ? "Playing audio..." : "Tap to verify if your microphone recorded sound"}
                  </p>
                </div>
              </div>

              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            </div>
          )}

          {/* Record Again Button */}
          <div className="pt-2">
            <button
              type="button"
              id="btn-record-again-notice"
              onClick={onRecordAgain}
              className="w-full py-4 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-lg hover:shadow-indigo-500/25 transition-all transform active:scale-[0.98] cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span>🔄 RECORD AGAIN</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Content-based Rubric Criteria
  const categories = [
    {
      id: "contentKnowledge",
      label: "CONTENT AND PRODUCT KNOWLEDGE",
      score: result.contentKnowledge,
      max: 30,
      description: "Identification, features, benefits, accuracy & deep understanding",
      color: "bg-blue-600",
      pillColor: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900",
    },
    {
      id: "persuasiveness",
      label: "PERSUASIVENESS",
      score: result.persuasiveness,
      max: 25,
      description: "Convincing reasons, customer needs, clear value proposition",
      color: "bg-indigo-600",
      pillColor: "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900",
    },
    {
      id: "organization",
      label: "ORGANIZATION AND COMPLETENESS",
      score: result.organization,
      max: 20,
      description: "Clear introduction, logical sequence, and conclusion / call to action",
      color: "bg-emerald-600",
      pillColor: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900",
    },
    {
      id: "audienceEngagement",
      label: "AUDIENCE ENGAGEMENT",
      score: result.audienceEngagement,
      max: 15,
      description: "Audience-directed questions, relatable examples, customer focus",
      color: "bg-amber-600",
      pillColor: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900",
    },
    {
      id: "deliveryFluency",
      label: "DELIVERY AND FLUENCY",
      score: result.deliveryFluency,
      max: 10,
      description: "Fluency, understandable speech, appropriate pacing (10% weight)",
      color: "bg-purple-600",
      pillColor: "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900",
    },
  ];

  const totalScore = result.total;

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: "Exceptional Spoken Content & Persuasion", color: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800" };
    if (score >= 80) return { label: "Strong Content Knowledge & Structure", color: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800" };
    if (score >= 70) return { label: "Good Foundation with Key Points Covered", color: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800" };
    return { label: "Developing Content & Persuasion", color: "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700" };
  };

  const badge = getScoreBadge(totalScore);

  return (
    <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 text-center relative">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold uppercase tracking-wider text-amber-300 mb-2">
          <Target className="w-3.5 h-3.5" />
          Content Evaluation (90% Content • 10% Delivery)
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">
          CONTENT-BASED AI AUDIO SCORE
        </h2>

        {/* Student Name: [student name] and Activity: [activity] */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-medium text-slate-400">Student Name:</span>
            <span className="text-base sm:text-lg font-bold text-white">
              {result.studentName}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs uppercase font-medium text-slate-400">Activity:</span>
            <span className="text-xs sm:text-sm font-semibold text-indigo-200 bg-indigo-950/70 px-3 py-0.5 rounded-md border border-indigo-800/50">
              {result.activity}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7 space-y-6">
        {/* TOTAL SCORE Card: __ / 100 */}
        <div className="bg-gradient-to-br from-indigo-50/80 via-slate-50 to-indigo-50/30 dark:from-slate-800/90 dark:to-slate-800/40 p-6 rounded-2xl border border-indigo-100 dark:border-slate-700 text-center relative shadow-sm">
          <div className="text-xs font-bold tracking-wider text-indigo-900 dark:text-indigo-300 uppercase mb-1">
            TOTAL SCORE
          </div>
          <div className="flex items-baseline justify-center gap-2 my-1">
            <span className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
              {totalScore}
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-400">
              / 100
            </span>
          </div>

          <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
            {badge.label}
          </div>
        </div>

        {/* Content-Based Category Scores Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Content-Based Scoring Breakdown
            </h3>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              Max Points
            </span>
          </div>

          <div className="space-y-3">
            {categories.map((cat) => {
              const percentage = Math.round((cat.score / cat.max) * 100);
              return (
                <div
                  key={cat.id}
                  className="bg-slate-50 dark:bg-slate-800/50 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs sm:text-sm font-bold tracking-wide text-slate-800 dark:text-slate-200 uppercase block">
                        {cat.label}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {cat.description}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums">
                        {cat.score}
                      </span>
                      <span className="text-xs font-bold text-slate-400 ml-1">
                        / {cat.max}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal progress bar */}
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full ${cat.color} rounded-full transition-all duration-700 ease-out`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* KEY CONTENT OBSERVATIONS */}
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-3.5">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              KEY CONTENT OBSERVATIONS
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3 text-xs sm:text-sm">
            {/* What the student explained well */}
            <div className="bg-white dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                What the student explained well:
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-3">
                {result.keyObservations?.explainedWell || "Addressed the primary topic clearly."}
              </p>
            </div>

            {/* Important information included */}
            <div className="bg-white dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Important information included:
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-3">
                {result.keyObservations?.infoIncluded || "Included relevant product features and topic details."}
              </p>
            </div>

            {/* Missing or weak information */}
            <div className="bg-white dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Missing or weak information:
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-3">
                {result.keyObservations?.missingInfo || "Could provide deeper examples or customer benefits."}
              </p>
            </div>

            {/* Strength of the student's persuasive argument */}
            <div className="bg-white dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-purple-700 dark:text-purple-400 mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Strength of the student's persuasive argument:
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-3">
                {result.keyObservations?.persuasiveStrength || "Maintains a persuasive tone toward the listener."}
              </p>
            </div>
          </div>
        </div>

        {/* AI FEEDBACK Section (3-5 concise sentences) */}
        <div className="bg-amber-50/70 dark:bg-amber-950/20 rounded-xl p-4 sm:p-5 border border-amber-200/80 dark:border-amber-800/50">
          <div className="flex items-center gap-2 mb-2 text-amber-900 dark:text-amber-300">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              AI FEEDBACK
            </h3>
          </div>
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
            {feedbackText}
          </p>
        </div>

        {/* TRANSCRIPT Section */}
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                TRANSCRIPT
              </h3>
            </div>
            {result.transcript && (
              <button
                type="button"
                onClick={handleCopyTranscript}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Copy spoken transcript"
              >
                {copiedTranscript ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Spoken presentation words transcribed by AI for evaluation:
          </p>
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto font-sans text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap select-text">
            {result.transcript || "(No transcript available for this recording)"}
          </div>
        </div>

        {/* Audio Recording Review Player */}
        {audioUrl && (
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlayback}
                className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all shadow-sm flex-shrink-0 cursor-pointer"
                aria-label={isPlaying ? "Pause audio" : "Play audio"}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Reviewed Audio Recording
                </p>
                <p className="text-[11px] text-slate-500">
                  {isPlaying ? "Playing recording..." : "Tap to listen to your voice presentation"}
                </p>
              </div>
            </div>

            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>
        )}

        {/* [ 🔄 RECORD AGAIN ] Button */}
        <div className="pt-2">
          <button
            type="button"
            id="btn-record-again"
            onClick={onRecordAgain}
            className="w-full py-4 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-lg hover:shadow-indigo-500/25 transition-all transform active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>🔄 RECORD AGAIN</span>
          </button>
        </div>
      </div>
    </div>
  );
};

