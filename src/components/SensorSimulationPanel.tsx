import React from "react";
import { CropData, SensorTelemetry } from "../types";
import { Droplets, Thermometer, Wind, Activity, RefreshCw, Zap, Sliders, Radio, ShieldCheck } from "lucide-react";

interface SensorSimulationPanelProps {
  telemetry: SensorTelemetry;
  selectedCrop: CropData;
  onUpdateTelemetry: (updated: Partial<SensorTelemetry>) => void;
  isLiveStreaming: boolean;
  onToggleLiveStream: () => void;
  onOpenHardwareModal: () => void;
  isRealHardwareConnected: boolean;
}

export const SensorSimulationPanel: React.FC<SensorSimulationPanelProps> = ({
  telemetry,
  selectedCrop,
  onUpdateTelemetry,
  isLiveStreaming,
  onToggleLiveStream,
  onOpenHardwareModal,
  isRealHardwareConnected,
}) => {
  // Preset scenarios tailored dynamically to current crop
  const applyPreset = (preset: "healthy" | "drought" | "heat" | "waterlogged" | "fungal" | "cold") => {
    switch (preset) {
      case "healthy":
        onUpdateTelemetry({
          soilMoisture: selectedCrop.optimalMoisture.ideal,
          temperature: selectedCrop.optimalTemp.ideal,
          humidity: selectedCrop.optimalHumidity.ideal,
          pH: 6.5,
        });
        break;
      case "drought":
        onUpdateTelemetry({
          soilMoisture: Math.max(10, selectedCrop.optimalMoisture.min - 22),
          temperature: Math.min(46, selectedCrop.optimalTemp.max + 5),
          humidity: Math.max(20, selectedCrop.optimalHumidity.min - 15),
        });
        break;
      case "heat":
        onUpdateTelemetry({
          soilMoisture: Math.max(25, selectedCrop.optimalMoisture.min - 8),
          temperature: Math.min(48, selectedCrop.optimalTemp.max + 8),
          humidity: Math.max(25, selectedCrop.optimalHumidity.min - 10),
        });
        break;
      case "waterlogged":
        onUpdateTelemetry({
          soilMoisture: Math.min(96, selectedCrop.optimalMoisture.max + 18),
          temperature: selectedCrop.optimalTemp.ideal,
          humidity: Math.min(92, selectedCrop.optimalHumidity.max + 12),
        });
        break;
      case "fungal":
        onUpdateTelemetry({
          soilMoisture: selectedCrop.optimalMoisture.ideal + 5,
          temperature: Math.max(22, Math.min(28, selectedCrop.optimalTemp.ideal)),
          humidity: Math.min(95, selectedCrop.optimalHumidity.max + 16),
        });
        break;
      case "cold":
        onUpdateTelemetry({
          soilMoisture: selectedCrop.optimalMoisture.ideal,
          temperature: Math.max(5, selectedCrop.optimalTemp.min - 9),
          humidity: selectedCrop.optimalHumidity.ideal,
        });
        break;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-emerald-400" />
            <h3 className="font-outfit text-base font-bold text-white sm:text-lg">
              Sensor Telemetry & Simulation Engine
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Test how <strong className="text-slate-200">{selectedCrop.name}</strong> reacts to microclimate swings or connect live IoT hardware.
          </p>
        </div>

        {/* Live Stream & Hardware toggles */}
        <div className="flex items-center gap-2">
          <button
            id="toggle-live-stream-btn"
            onClick={onToggleLiveStream}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              isLiveStreaming
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700"
            }`}
            title="Auto-fluctuate sensor readings every 3s to simulate real-world environment"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLiveStreaming ? "animate-spin text-emerald-200" : ""}`} />
            <span>{isLiveStreaming ? "Auto-Telemetry ON" : "Auto-Telemetry OFF"}</span>
          </button>

          <button
            id="open-hardware-bridge-btn"
            onClick={onOpenHardwareModal}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
              isRealHardwareConnected
                ? "border-emerald-500/60 bg-emerald-950/60 text-emerald-300"
                : "border-slate-700 bg-slate-800/80 text-slate-300 hover:border-emerald-500/40 hover:text-white"
            }`}
          >
            <Radio className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Connect Real Sensor</span>
          </button>
        </div>
      </div>

      {/* Quick Simulation Presets */}
      <div className="mt-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Simulation Presets (Demonstration Mode)
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <button
            id="preset-healthy-btn"
            onClick={() => applyPreset("healthy")}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-xs font-medium text-emerald-300 transition-all hover:bg-emerald-900/50 hover:border-emerald-400/60"
          >
            <span>🌿</span>
            <span>Optimal</span>
          </button>

          <button
            id="preset-drought-btn"
            onClick={() => applyPreset("drought")}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-xs font-medium text-amber-300 transition-all hover:bg-amber-900/50 hover:border-amber-400/60"
          >
            <span>💧</span>
            <span>Drought</span>
          </button>

          <button
            id="preset-heat-btn"
            onClick={() => applyPreset("heat")}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs font-medium text-rose-300 transition-all hover:bg-rose-900/50 hover:border-rose-400/60"
          >
            <span>🌡️</span>
            <span>Heatwave</span>
          </button>

          <button
            id="preset-waterlogged-btn"
            onClick={() => applyPreset("waterlogged")}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-950/30 px-3 py-2 text-xs font-medium text-blue-300 transition-all hover:bg-blue-900/50 hover:border-blue-400/60"
          >
            <span>🌊</span>
            <span>Waterlog</span>
          </button>

          <button
            id="preset-fungal-btn"
            onClick={() => applyPreset("fungal")}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-950/30 px-3 py-2 text-xs font-medium text-purple-300 transition-all hover:bg-purple-900/50 hover:border-purple-400/60"
          >
            <span>🍄</span>
            <span>Fungal Risk</span>
          </button>

          <button
            id="preset-cold-btn"
            onClick={() => applyPreset("cold")}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-3 py-2 text-xs font-medium text-cyan-300 transition-all hover:bg-cyan-900/50 hover:border-cyan-400/60"
          >
            <span>❄️</span>
            <span>Cold Shock</span>
          </button>
        </div>
      </div>

      {/* Interactive Telemetry Sliders */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Soil Moisture Slider */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                <Droplets className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-300">Soil Moisture</span>
                <div className="text-[10px] text-slate-400">
                  Ideal: {selectedCrop.optimalMoisture.min}% - {selectedCrop.optimalMoisture.max}%
                </div>
              </div>
            </div>
            <div className="font-outfit text-xl font-bold text-white">
              {telemetry.soilMoisture}%
            </div>
          </div>

          <div className="mt-4">
            <input
              id="slider-soil-moisture"
              type="range"
              min="0"
              max="100"
              step="1"
              value={telemetry.soilMoisture}
              onChange={(e) => onUpdateTelemetry({ soilMoisture: Number(e.target.value) })}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-blue-500 focus:outline-none"
            />
            <div className="mt-1.5 flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0% (Bone Dry)</span>
              <span className="text-emerald-400 font-medium">Optimal ({selectedCrop.optimalMoisture.ideal}%)</span>
              <span>100% (Saturated)</span>
            </div>
          </div>
        </div>

        {/* Temperature Slider */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                <Thermometer className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-300">Canopy Temperature</span>
                <div className="text-[10px] text-slate-400">
                  Ideal: {selectedCrop.optimalTemp.min}°C - {selectedCrop.optimalTemp.max}°C
                </div>
              </div>
            </div>
            <div className="font-outfit text-xl font-bold text-white">
              {telemetry.temperature}°C
            </div>
          </div>

          <div className="mt-4">
            <input
              id="slider-temperature"
              type="range"
              min="0"
              max="50"
              step="1"
              value={telemetry.temperature}
              onChange={(e) => onUpdateTelemetry({ temperature: Number(e.target.value) })}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-amber-500 focus:outline-none"
            />
            <div className="mt-1.5 flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0°C (Frost)</span>
              <span className="text-emerald-400 font-medium">Comfort ({selectedCrop.optimalTemp.ideal}°C)</span>
              <span>50°C (Extreme)</span>
            </div>
          </div>
        </div>

        {/* Relative Humidity Slider */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/15 text-teal-400">
                <Wind className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-300">Relative Humidity</span>
                <div className="text-[10px] text-slate-400">
                  Ideal: {selectedCrop.optimalHumidity.min}% - {selectedCrop.optimalHumidity.max}%
                </div>
              </div>
            </div>
            <div className="font-outfit text-xl font-bold text-white">
              {telemetry.humidity}%
            </div>
          </div>

          <div className="mt-4">
            <input
              id="slider-humidity"
              type="range"
              min="0"
              max="100"
              step="1"
              value={telemetry.humidity}
              onChange={(e) => onUpdateTelemetry({ humidity: Number(e.target.value) })}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-teal-500 focus:outline-none"
            />
            <div className="mt-1.5 flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0% (Arid)</span>
              <span className="text-emerald-400 font-medium">Optimal ({selectedCrop.optimalHumidity.ideal}%)</span>
              <span>100% (Misty)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
