import React from "react";
import { CropData, StressEvaluation } from "../types";
import { AlertTriangle, CheckCircle2, Volume2, ShieldAlert, Sparkles, Lightbulb, DollarSign, Shield, ArrowRight } from "lucide-react";

interface StressResultCardProps {
  evaluation: StressEvaluation;
  selectedCrop: CropData;
  onSpeak: () => void;
  isSpeaking: boolean;
  selectedLanguageName: string;
}

export const StressResultCard: React.FC<StressResultCardProps> = ({
  evaluation,
  selectedCrop,
  onSpeak,
  isSpeaking,
  selectedLanguageName,
}) => {
  const { score, level, reasons, solution, color, type } = evaluation;

  // Determine badge styling
  const badgeClass =
    level === "Healthy"
      ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-400"
      : level === "Moderate Stress"
      ? "border-amber-500/30 bg-amber-950/40 text-amber-400"
      : "border-rose-500/30 bg-rose-950/40 text-rose-400";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner"
            style={{ backgroundColor: `${color}15`, color: color }}
          >
            {level === "Healthy" ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : level === "Moderate Stress" ? (
              <AlertTriangle className="h-6 w-6" />
            ) : (
              <ShieldAlert className="h-6 w-6" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${badgeClass}`}>
                {level}
              </span>
              <span className="text-xs text-slate-400">
                Crop: <strong className="text-white">{selectedCrop.name}</strong>
              </span>
            </div>
            <h3 className="mt-1 font-outfit text-lg font-bold text-white sm:text-xl">
              {solution.title}
            </h3>
          </div>
        </div>

        {/* Big Stress Score & Voice Button */}
        <div className="flex items-center gap-4">
          <div className="flex items-baseline gap-1 text-right">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Stress Score
            </span>
            <span
              className="font-outfit text-4xl font-extrabold tracking-tight"
              style={{ color }}
            >
              {score}%
            </span>
          </div>

          <button
            id="speak-stress-report-btn"
            onClick={onSpeak}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-md ${
              isSpeaking
                ? "bg-rose-600 text-white hover:bg-rose-500 shadow-rose-950"
                : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-950"
            }`}
          >
            <Volume2 className={`h-4 w-4 ${isSpeaking ? "animate-pulse" : ""}`} />
            <span>{isSpeaking ? "Stop Voice" : `Hear in ${selectedLanguageName}`}</span>
          </button>
        </div>
      </div>

      {/* Primary Diagnosis & Factors */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Why detected & contributing reasons */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-4 lg:col-span-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <span className="text-amber-400">🔍</span>
            Telemetry Stress Diagnosis
          </div>
          <p className="mt-2 text-xs font-medium text-slate-300 leading-relaxed">
            {solution.problem}
          </p>

          <div className="mt-3.5 space-y-2 border-t border-slate-900 pt-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Contributing Factors:
            </div>
            {reasons.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span className="leading-snug">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3 Actionable Solutions */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-2">
          {/* Card 1: Immediate Action */}
          <div className="flex flex-col justify-between rounded-xl border border-blue-500/20 bg-blue-950/20 p-4 transition-all hover:border-blue-500/40">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                <Lightbulb className="h-4 w-4" />
                <span>Immediate Action</span>
              </div>
              <p className="mt-2 text-xs text-slate-200 leading-relaxed">
                {solution.recommended_action}
              </p>
            </div>
            <div className="mt-3 text-[10px] text-blue-300 font-medium">
              High Impact · Priority
            </div>
          </div>

          {/* Card 2: Low-Cost / Farmer Option */}
          <div className="flex flex-col justify-between rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 transition-all hover:border-amber-500/40">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <DollarSign className="h-4 w-4" />
                <span>Low-Cost / Organic</span>
              </div>
              <p className="mt-2 text-xs text-slate-200 leading-relaxed">
                {solution.low_cost_option}
              </p>
            </div>
            <div className="mt-3 text-[10px] text-amber-300 font-medium">
              Zero-to-Low Expense
            </div>
          </div>

          {/* Card 3: Prevention */}
          <div className="flex flex-col justify-between rounded-xl border border-purple-500/20 bg-purple-950/20 p-4 transition-all hover:border-purple-500/40">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400">
                <Shield className="h-4 w-4" />
                <span>Agronomic Prevention</span>
              </div>
              <p className="mt-2 text-xs text-slate-200 leading-relaxed">
                {solution.prevention}
              </p>
            </div>
            <div className="mt-3 text-[10px] text-purple-300 font-medium">
              Sustained Soil & Plant Health
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
