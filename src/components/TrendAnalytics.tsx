import React, { useState } from "react";
import { CropData, StressEvaluation } from "../types";
import { TrendingUp, AlertTriangle, Calendar, Clock, BarChart3 } from "lucide-react";

interface TrendAnalyticsProps {
  currentScore: number;
  selectedCrop: CropData;
  evaluation: StressEvaluation;
}

export const TrendAnalytics: React.FC<TrendAnalyticsProps> = ({
  currentScore,
  selectedCrop,
  evaluation,
}) => {
  const [timeframe, setTimeframe] = useState<"7d" | "24h">("7d");

  // Generate 7-day trend based on current score
  const sevenDayData = [
    { label: "Day -6", score: Math.max(10, Math.round(currentScore * 0.45)), moisture: selectedCrop.optimalMoisture.ideal + 6, temp: selectedCrop.optimalTemp.ideal - 2 },
    { label: "Day -5", score: Math.max(12, Math.round(currentScore * 0.55)), moisture: selectedCrop.optimalMoisture.ideal + 3, temp: selectedCrop.optimalTemp.ideal - 1 },
    { label: "Day -4", score: Math.max(15, Math.round(currentScore * 0.65)), moisture: selectedCrop.optimalMoisture.ideal, temp: selectedCrop.optimalTemp.ideal },
    { label: "Day -3", score: Math.max(18, Math.round(currentScore * 0.78)), moisture: selectedCrop.optimalMoisture.ideal - 4, temp: selectedCrop.optimalTemp.ideal + 1 },
    { label: "Day -2", score: Math.max(22, Math.round(currentScore * 0.88)), moisture: selectedCrop.optimalMoisture.ideal - 8, temp: selectedCrop.optimalTemp.ideal + 2 },
    { label: "Yesterday", score: Math.max(25, Math.round(currentScore * 0.94)), moisture: selectedCrop.optimalMoisture.ideal - 12, temp: selectedCrop.optimalTemp.ideal + 3 },
    { label: "Today (Now)", score: currentScore, moisture: selectedCrop.optimalMoisture.ideal - 15, temp: selectedCrop.optimalTemp.ideal + 4 },
  ];

  // 24-hour diurnal trend
  const twentyFourHourData = [
    { label: "00:00", score: Math.max(8, Math.round(currentScore * 0.6)), temp: 18, moisture: 64 },
    { label: "04:00", score: Math.max(8, Math.round(currentScore * 0.55)), temp: 17, moisture: 65 },
    { label: "08:00", score: Math.max(15, Math.round(currentScore * 0.7)), temp: 22, moisture: 62 },
    { label: "12:00", score: Math.max(28, Math.round(currentScore * 0.9)), temp: 31, moisture: 55 },
    { label: "15:00", score: currentScore, temp: 34, moisture: 49 },
    { label: "18:00", score: Math.max(22, Math.round(currentScore * 0.85)), temp: 27, moisture: 53 },
    { label: "21:00", score: Math.max(16, Math.round(currentScore * 0.72)), temp: 22, moisture: 58 },
  ];

  const activeData = timeframe === "7d" ? sevenDayData : twentyFourHourData;
  const isWorsening = activeData[activeData.length - 1].score > activeData[0].score && currentScore > 30;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
              <h3 className="font-outfit text-base font-bold text-white sm:text-lg">
                Crop Stress & Telemetry Historical Trend
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulated telemetry progression tracking field stress escalation for <strong className="text-slate-200">{selectedCrop.name}</strong>.
            </p>
          </div>

          {/* Timeframe switch */}
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-1">
            <button
              id="timeframe-7d-btn"
              onClick={() => setTimeframe("7d")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                timeframe === "7d" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              7-Day Trajectory
            </button>
            <button
              id="timeframe-24h-btn"
              onClick={() => setTimeframe("24h")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                timeframe === "24h" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              24-Hour Cycle
            </button>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="mt-6">
          <div className="relative h-64 w-full">
            {/* Threshold reference lines */}
            <div className="absolute top-[35%] left-0 right-0 border-b border-dashed border-rose-500/40 flex justify-end pr-2 text-[10px] text-rose-400">
              Critical Threshold (65%)
            </div>
            <div className="absolute top-[70%] left-0 right-0 border-b border-dashed border-amber-500/40 flex justify-end pr-2 text-[10px] text-amber-400">
              Moderate Threshold (30%)
            </div>

            {/* SVG graph container */}
            <svg viewBox="0 0 700 240" className="h-full w-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area */}
              {(() => {
                const points = activeData.map((d, i) => {
                  const x = 30 + (i * (640 / (activeData.length - 1)));
                  const y = 220 - (d.score * 2.0);
                  return `${x},${y}`;
                });
                const dArea = `M ${points[0]} L ${points.join(" L ")} L ${30 + 640},220 L 30,220 Z`;
                const dLine = `M ${points[0]} L ${points.join(" L ")}`;

                return (
                  <>
                    <path d={dArea} fill="url(#stressGrad)" />
                    <path d={dLine} fill="none" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" />
                    {activeData.map((d, i) => {
                      const x = 30 + (i * (640 / (activeData.length - 1)));
                      const y = 220 - (d.score * 2.0);
                      const ptColor = d.score >= 65 ? "#ef4444" : d.score >= 30 ? "#f59e0b" : "#22c55e";
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="5.5" fill={ptColor} stroke="#ffffff" strokeWidth="2" />
                          <text
                            x={x}
                            y={y - 10}
                            textAnchor="middle"
                            fill="#cbd5e1"
                            fontSize="11"
                            fontFamily="sans-serif"
                            fontWeight="bold"
                          >
                            {d.score}%
                          </text>
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>

          {/* X Axis Labels */}
          <div className="mt-4 flex justify-between px-4 text-xs text-slate-400 font-mono">
            {activeData.map((d, i) => (
              <span key={i} className="text-center">{d.label}</span>
            ))}
          </div>
        </div>

        {/* Warning Banner if trending up */}
        {isWorsening && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 to-rose-950/30 p-4 text-xs text-amber-200">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong className="text-white text-sm font-semibold">
                Early Agronomic Warning Notice:
              </strong>
              <p className="mt-1 leading-relaxed">
                Crop stress has climbed from {activeData[0].score}% to {currentScore}% over the tracking interval.
                If moisture depletion continues at this trajectory, permanent wilting point may be reached within 48 hours. Preventive irrigation or shading is recommended.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
