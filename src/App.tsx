import React, { useState, useRef, useEffect } from "react";
import { Header } from "./components/Header";
import { AudioVisualizer } from "./components/AudioVisualizer";
import { ScoreResult } from "./components/ScoreResult";
import { LoadingScreen } from "./components/LoadingScreen";
import { AudioScoreResult } from "./types";
import {
  Mic,
  Square,
  RotateCcw,
  Send,
  AlertCircle,
  Play,
  Pause,
  User,
  BookOpen,
  Volume2,
  Info,
  CheckCircle2,
} from "lucide-react";

export default function App() {
  // Form fields
  const [studentName, setStudentName] = useState("");
  const [activity, setActivity] = useState("");

  // Validation error state
  const [formErrors, setFormErrors] = useState<{ studentName?: string; activity?: string }>({});

  // Recording states: "idle" | "recording" | "recorded"
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "recorded">("idle");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>("audio/webm");

  // Playback preview state
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Microphone stream & recorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // UI status and error messages
  const [micError, setMicError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [autoStopNotice, setAutoStopNotice] = useState<string | null>(null);

  // AI Evaluation state
  const [isLoading, setIsLoading] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<AudioScoreResult | null>(null);

  // Clean up timer and media streams on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Formatter for timer: mm:ss
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start recording
  const startRecording = async () => {
    setMicError(null);
    setSubmitError(null);
    setAutoStopNotice(null);

    // Validate fields gently
    const errors: { studentName?: string; activity?: string } = {};
    if (!studentName.trim()) {
      errors.studentName = "Please enter student name.";
    }
    if (!activity.trim()) {
      errors.activity = "Please enter activity / topic.";
    }
    setFormErrors(errors);

    try {
      // Modern browser microphone request
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Select optimal supported MIME type for cross-platform (iOS Safari + Android Chrome)
      let selectedMimeType = "audio/webm";
      const candidateTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/aac",
        "audio/ogg",
      ];

      for (const t of candidateTypes) {
        if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
          selectedMimeType = t;
          break;
        }
      }

      setAudioMimeType(selectedMimeType);

      const recorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType ? selectedMimeType : undefined,
      });

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, {
          type: selectedMimeType || "audio/webm",
        });
        setAudioBlob(finalBlob);

        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        const newUrl = URL.createObjectURL(finalBlob);
        setAudioUrl(newUrl);
        setRecordingState("recorded");

        // Stop stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250); // Slice data every 250ms

      setRecordingDuration(0);
      setRecordingState("recording");

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => {
          const next = prev + 1;
          // 5 minutes max = 300 seconds
          if (next >= 300) {
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
              mediaRecorderRef.current.stop();
            }
            setAutoStopNotice("Maximum recording duration of 5 minutes reached. Recording automatically stopped.");
            return 300;
          }
          return next;
        });
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setMicError(
          "Microphone access is required to record your audio. Please allow microphone access and try again."
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setMicError("Microphone access is required to record your audio. Please connect a microphone and try again.");
      } else {
        setMicError("Microphone access is required to record your audio. Please allow microphone access and try again.");
      }
      setRecordingState("idle");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  // Retake recording
  const handleRetake = () => {
    if (isPlayingPreview && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    setRecordingState("idle");
    setSubmitError(null);
  };

  // Toggle playback preview
  const togglePreviewPlayback = () => {
    if (!previewAudioRef.current) return;
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current
        .play()
        .then(() => setIsPlayingPreview(true))
        .catch((e) => console.error("Playback error:", e));
    }
  };

  // Submit audio for AI Scoring
  const handleSubmitForScoring = async () => {
    // Validate inputs
    const errors: { studentName?: string; activity?: string } = {};
    if (!studentName.trim()) {
      errors.studentName = "Please enter the student name.";
    }
    if (!activity.trim()) {
      errors.activity = "Please enter the presentation activity or topic.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (!audioBlob) {
      setSubmitError("Please record your audio before requesting a score.");
      return;
    }

    if (recordingDuration < 2) {
      setSubmitError(
        "Your recording does not contain enough understandable speech for reliable scoring. Please record again."
      );
      return;
    }

    setSubmitError(null);
    setIsLoading(true);

    try {
      // Convert audio blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const res = reader.result as string;
          const base64 = res.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;

      const payload = {
        studentName: studentName.trim(),
        activity: activity.trim(),
        audioBase64,
        mimeType: audioMimeType,
        durationSeconds: recordingDuration,
      };

      const response = await fetch("/api/evaluate-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "We could not analyze your recording. Please try again.");
      }

      const scoreResult: AudioScoreResult = await response.json();
      setEvaluationResult(scoreResult);
    } catch (err: any) {
      console.error("AI scoring submission error:", err);
      setSubmitError("We could not analyze your recording. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to record again
  const handleRecordAgain = () => {
    setEvaluationResult(null);
    handleRetake();
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-start p-4 sm:p-6 md:py-10">
      <div className="w-full max-w-lg flex flex-col items-center">
        {/* Main Header */}
        <Header compact={!!evaluationResult || isLoading} />

        {/* Loading Screen */}
        {isLoading && (
          <LoadingScreen studentName={studentName} activity={activity} />
        )}

        {/* Result Screen */}
        {!isLoading && evaluationResult && (
          <ScoreResult
            result={evaluationResult}
            audioUrl={audioUrl}
            onRecordAgain={handleRecordAgain}
          />
        )}

        {/* Main Recording Form Screen */}
        {!isLoading && !evaluationResult && (
          <div className="w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 space-y-6">
            {/* Student & Activity Form Fields */}
            <div className="space-y-4">
              {/* Field 1: Student Name */}
              <div>
                <label
                  htmlFor="student-name"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5"
                >
                  <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Student Name
                </label>
                <input
                  id="student-name"
                  type="text"
                  value={studentName}
                  onChange={(e) => {
                    setStudentName(e.target.value);
                    if (formErrors.studentName) {
                      setFormErrors((prev) => ({ ...prev, studentName: undefined }));
                    }
                  }}
                  placeholder="Enter your name"
                  className={`w-full px-4 py-3.5 rounded-xl border text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                    formErrors.studentName
                      ? "border-red-500 bg-red-50/50 dark:bg-red-950/20 text-slate-900 dark:text-white"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:border-indigo-600"
                  }`}
                  disabled={recordingState === "recording"}
                />
                {formErrors.studentName && (
                  <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-1">
                    {formErrors.studentName}
                  </p>
                )}
              </div>

              {/* Field 2: Activity/Topic */}
              <div>
                <label
                  htmlFor="activity-topic"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Activity / Topic
                </label>
                <input
                  id="activity-topic"
                  type="text"
                  value={activity}
                  onChange={(e) => {
                    setActivity(e.target.value);
                    if (formErrors.activity) {
                      setFormErrors((prev) => ({ ...prev, activity: undefined }));
                    }
                  }}
                  placeholder="Enter your topic"
                  className={`w-full px-4 py-3.5 rounded-xl border text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                    formErrors.activity
                      ? "border-red-500 bg-red-50/50 dark:bg-red-950/20 text-slate-900 dark:text-white"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:border-indigo-600"
                  }`}
                  disabled={recordingState === "recording"}
                />
                {formErrors.activity && (
                  <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-1">
                    {formErrors.activity}
                  </p>
                )}
              </div>
            </div>

            {/* Auto Stop 5-Minute Notification if triggered */}
            {autoStopNotice && (
              <div
                id="auto-stop-notice"
                className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs sm:text-sm font-medium flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>{autoStopNotice}</span>
              </div>
            )}

            {/* RECORDING SECTION */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5" />
                  Recording Section
                </span>
                {/* Recording Status badge */}
                <div
                  id="recording-status"
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                    recordingState === "recording"
                      ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60"
                      : recordingState === "recorded"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      recordingState === "recording"
                        ? "bg-red-600 animate-ping"
                        : recordingState === "recorded"
                        ? "bg-emerald-600"
                        : "bg-slate-400"
                    }`}
                  />
                  {recordingState === "recording"
                    ? "Recording..."
                    : recordingState === "recorded"
                    ? "Recording complete"
                    : "Ready to record"}
                </div>
              </div>

              {/* Recording Timer Display */}
              <div className="text-center py-2">
                <div
                  id="recording-timer"
                  className={`text-4xl sm:text-5xl font-black tracking-tight tabular-nums ${
                    recordingState === "recording"
                      ? "text-red-600 dark:text-red-400 animate-pulse"
                      : recordingState === "recorded"
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 dark:text-slate-600"
                  }`}
                >
                  {formatTimer(recordingDuration)}
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {recordingState === "recording"
                    ? "Recording... Speak clearly into your phone microphone"
                    : recordingState === "recorded"
                    ? "Listen to your recording or submit for AI score"
                    : "Tap START RECORDING to begin (up to 5 minutes)"}
                </p>
              </div>

              {/* Live Audio Visualizer during recording */}
              <AudioVisualizer
                stream={streamRef.current}
                isRecording={recordingState === "recording"}
              />

              {/* RECORD & STOP Action Buttons */}
              <div className="space-y-3">
                {recordingState === "idle" && (
                  <button
                    type="button"
                    id="btn-record"
                    onClick={startRecording}
                    className="w-full py-5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-lg sm:text-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-indigo-500/30 transition-all transform active:scale-[0.98] cursor-pointer"
                  >
                    <span>🔴 START RECORDING</span>
                  </button>
                )}

                {recordingState === "recording" && (
                  <button
                    type="button"
                    id="btn-stop"
                    onClick={stopRecording}
                    className="w-full py-5 px-6 rounded-2xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold text-lg sm:text-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-red-500/30 transition-all transform active:scale-[0.98] cursor-pointer animate-pulse"
                  >
                    <span>⏹ STOP RECORDING</span>
                  </button>
                )}

                {/* Audio Playback Preview After Recording */}
                {recordingState === "recorded" && audioUrl && (
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4 text-indigo-600" />
                        Audio Playback
                      </span>
                      <span className="text-xs font-bold text-slate-500 tabular-nums">
                        {formatTimer(recordingDuration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        id="btn-preview-playback"
                        onClick={togglePreviewPlayback}
                        className="w-12 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 flex-shrink-0 cursor-pointer"
                        aria-label={isPlayingPreview ? "Pause audio" : "Play audio"}
                      >
                        {isPlayingPreview ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6 ml-0.5" />
                        )}
                      </button>

                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {isPlayingPreview ? "Playing presentation..." : "Listen to your recording"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Check clarity and volume before submitting
                        </p>
                      </div>
                    </div>

                    <audio
                      ref={previewAudioRef}
                      src={audioUrl}
                      onEnded={() => setIsPlayingPreview(false)}
                      className="hidden"
                    />

                    {/* Dual Action: [ 🔄 RECORD AGAIN ] and [ 🤖 GET AI SCORE ] */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        id="btn-record-again"
                        onClick={handleRetake}
                        className="w-full py-4 px-4 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <span>🔄 RECORD AGAIN</span>
                      </button>

                      <button
                        type="button"
                        id="btn-get-ai-score"
                        onClick={handleSubmitForScoring}
                        className="w-full py-4 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-500/25 transition-all transform active:scale-[0.98] cursor-pointer"
                      >
                        <span>🤖 GET AI SCORE</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Microphone Permission Error Message */}
              {micError && (
                <div
                  id="mic-error-message"
                  className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 flex items-start gap-3 text-xs sm:text-sm"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Microphone Permission Error</p>
                    <p className="mt-0.5">{micError}</p>
                  </div>
                </div>
              )}

              {/* Submission / AI Scoring Error Message */}
              {submitError && (
                <div
                  id="submit-error-message"
                  className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 flex items-start gap-3 text-xs sm:text-sm"
                >
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Submission Notice</p>
                    <p className="mt-0.5">{submitError}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Assessment Criteria Note for Students */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <Info className="w-3.5 h-3.5 text-indigo-500" />
                Scoring Categories (100 Points Total)
              </div>
              <p className="leading-relaxed">
                Evaluated on: <strong>Clarity</strong> (20 pts), <strong>Pronunciation</strong> (20 pts), <strong>Voice Quality</strong> (20 pts), <strong>Speaking Pace</strong> (20 pts), and <strong>Overall Delivery</strong> (20 pts).
              </p>
            </div>
          </div>
        )}

        {/* Footer info */}
        <footer className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
          AI Audio Scorer • Classroom Presentation Evaluation System
        </footer>
      </div>
    </div>
  );
}
