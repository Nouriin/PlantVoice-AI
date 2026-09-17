import React from "react";
import { Volume2, VolumeX, Pause, Play, Square, FastForward } from "lucide-react";
import { VoiceAssistant } from "../utils/speechSynthesis";

interface VoicePlayerProps {
  isSpeaking: boolean;
  isPaused: boolean;
  currentText: string;
  languageName: string;
  onStop: () => void;
  onPauseToggle: () => void;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({
  isSpeaking,
  isPaused,
  currentText,
  languageName,
  onStop,
  onPauseToggle,
}) => {
  if (!isSpeaking) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-2xl rounded-2xl border border-emerald-500/40 bg-slate-950/95 p-3.5 shadow-2xl shadow-emerald-950/80 backdrop-blur-xl sm:bottom-6">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Wave animation & text */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <Volume2 className="h-5 w-5 animate-pulse" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                PlantVoice Narration ({languageName})
              </span>
              {/* Sound wave bars */}
              <div className="flex items-center gap-0.5">
                <span className="h-2 w-0.5 animate-[pulse_0.6s_ease-in-out_infinite] bg-emerald-400"></span>
                <span className="h-3.5 w-0.5 animate-[pulse_0.8s_ease-in-out_infinite] bg-emerald-400"></span>
                <span className="h-2.5 w-0.5 animate-[pulse_0.5s_ease-in-out_infinite] bg-emerald-400"></span>
                <span className="h-4 w-0.5 animate-[pulse_0.7s_ease-in-out_infinite] bg-emerald-400"></span>
                <span className="h-2 w-0.5 animate-[pulse_0.6s_ease-in-out_infinite] bg-emerald-400"></span>
              </div>
            </div>
            <p className="truncate text-xs text-slate-300">
              {currentText || "Playing spoken agronomic guidance..."}
            </p>
          </div>
        </div>

        {/* Right: Audio control buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="voice-pause-btn"
            onClick={onPauseToggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>

          <button
            id="voice-stop-btn"
            onClick={onStop}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-300 hover:bg-rose-900"
            title="Stop Speech"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
