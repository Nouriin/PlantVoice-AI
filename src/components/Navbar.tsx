import React from "react";
import { CropData, LanguageOption } from "../types";
import { SUPPORTED_LANGUAGES, VoiceAssistant } from "../utils/speechSynthesis";
import { Cpu, Globe, Volume2, VolumeX, Radio, Sparkles, ChevronDown } from "lucide-react";

interface NavbarProps {
  selectedCrop: CropData;
  selectedLanguage: string;
  onLanguageChange: (langCode: string) => void;
  activeTab: "dashboard" | "leaf-diagnosis" | "trends" | "hardware";
  onTabChange: (tab: "dashboard" | "leaf-diagnosis" | "trends" | "hardware") => void;
  isRealHardwareConnected: boolean;
  onOpenHardwareModal: () => void;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedCrop,
  selectedLanguage,
  onLanguageChange,
  activeTab,
  onTabChange,
  isRealHardwareConnected,
  onOpenHardwareModal,
  isSpeaking,
  onStopSpeaking,
}) => {
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-900/40 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 shadow-md shadow-emerald-950/50">
            <span className="text-xl">🌱</span>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-outfit text-lg font-bold tracking-tight text-white sm:text-xl">
                PlantVoice <span className="text-emerald-400">AI</span>
              </span>
              <span className="hidden rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 md:inline-block">
                Agronomic Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Predict · Diagnose · Solve · Speak</p>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="hidden items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/80 p-1 md:flex">
          <button
            id="tab-dashboard-btn"
            onClick={() => onTabChange("dashboard")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "dashboard"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            🎛️ Field Dashboard
          </button>
          <button
            id="tab-leaf-btn"
            onClick={() => onTabChange("leaf-diagnosis")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "leaf-diagnosis"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            📷 Leaf Diagnosis
          </button>
          <button
            id="tab-trends-btn"
            onClick={() => onTabChange("trends")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "trends"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            📈 Stress Analytics
          </button>
          <button
            id="tab-hardware-btn"
            onClick={() => onTabChange("hardware")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "hardware"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            IoT Sensor Bridge
          </button>
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active crop quick badge */}
          <div className="hidden items-center gap-1.5 rounded-lg border border-emerald-800/40 bg-emerald-950/30 px-2.5 py-1 text-xs text-emerald-200 lg:flex">
            <span>{selectedCrop.emoji}</span>
            <span className="font-semibold text-white">{selectedCrop.name}</span>
          </div>

          {/* Voice status */}
          {isSpeaking && (
            <button
              id="voice-stop-navbar-btn"
              onClick={onStopSpeaking}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-950/40 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-900/60"
              title="Stop voice playback"
            >
              <VolumeX className="h-3.5 w-3.5 animate-pulse" />
              <span className="hidden sm:inline">Speaking...</span>
            </button>
          )}

          {/* Hardware Connection Badge */}
          <button
            id="hardware-bridge-badge-btn"
            onClick={onOpenHardwareModal}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
              isRealHardwareConnected
                ? "border-emerald-500/50 bg-emerald-950/50 text-emerald-300 shadow-sm shadow-emerald-500/10"
                : "border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700 hover:bg-slate-800"
            }`}
            title="Configure real IoT sensor hardware bridge"
          >
            <Radio className={`h-3.5 w-3.5 ${isRealHardwareConnected ? "text-emerald-400 animate-pulse" : "text-amber-400"}`} />
            <span className="hidden sm:inline">
              {isRealHardwareConnected ? "IoT Node Active" : "Sensor Demo Mode"}
            </span>
          </button>

          {/* Language Selector */}
          <div className="relative">
            <select
              id="language-select-dropdown"
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="cursor-pointer appearance-none rounded-lg border border-slate-800 bg-slate-900 py-1.5 pl-8 pr-7 text-xs font-medium text-slate-200 outline-none transition-colors hover:border-slate-700 focus:border-emerald-500"
              aria-label="Select Voice and Guidance Language"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
                  {lang.flag} {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
            <Globe className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="flex border-t border-slate-900 bg-slate-950 px-2 py-1.5 md:hidden">
        <button
          onClick={() => onTabChange("dashboard")}
          className={`flex-1 rounded-md py-1.5 text-center text-xs font-medium ${
            activeTab === "dashboard" ? "bg-emerald-600/30 text-emerald-300" : "text-slate-400"
          }`}
        >
          🎛️ Dashboard
        </button>
        <button
          onClick={() => onTabChange("leaf-diagnosis")}
          className={`flex-1 rounded-md py-1.5 text-center text-xs font-medium ${
            activeTab === "leaf-diagnosis" ? "bg-emerald-600/30 text-emerald-300" : "text-slate-400"
          }`}
        >
          📷 Leaf
        </button>
        <button
          onClick={() => onTabChange("trends")}
          className={`flex-1 rounded-md py-1.5 text-center text-xs font-medium ${
            activeTab === "trends" ? "bg-emerald-600/30 text-emerald-300" : "text-slate-400"
          }`}
        >
          📈 Trends
        </button>
        <button
          onClick={() => onTabChange("hardware")}
          className={`flex-1 rounded-md py-1.5 text-center text-xs font-medium ${
            activeTab === "hardware" ? "bg-emerald-600/30 text-emerald-300" : "text-slate-400"
          }`}
        >
          🔌 IoT
        </button>
      </div>
    </header>
  );
};
