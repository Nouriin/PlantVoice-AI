import React, { useState, useEffect, useCallback, useMemo } from "react";
import { CropData, SensorTelemetry } from "./types";
import { CROPS_DATABASE } from "./data/cropsDatabase";
import { evaluateCropStress, generateSpokenScript } from "./utils/stressEngine";
import { VoiceAssistant, SUPPORTED_LANGUAGES } from "./utils/speechSynthesis";
import { Navbar } from "./components/Navbar";
import { CropSearchBar } from "./components/CropSearchBar";
import { SensorSimulationPanel } from "./components/SensorSimulationPanel";
import { StressResultCard } from "./components/StressResultCard";
import { LeafDiagnosisTab } from "./components/LeafDiagnosisTab";
import { TrendAnalytics } from "./components/TrendAnalytics";
import { RealSensorModal } from "./components/RealSensorModal";
import { VoicePlayer } from "./components/VoicePlayer";
import { Droplets, Thermometer, Wind, Activity, Radio, Cpu, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, HeartHandshake } from "lucide-react";

export default function App() {
  // Crop state — default to Tomato or first crop
  const [allCrops, setAllCrops] = useState<CropData[]>(CROPS_DATABASE);
  const [selectedCrop, setSelectedCrop] = useState<CropData>(() => {
    return CROPS_DATABASE.find((c) => c.id === "tomato") || CROPS_DATABASE[0];
  });

  // Language state
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");

  // Navigation tab
  const [activeTab, setActiveTab] = useState<"dashboard" | "leaf-diagnosis" | "trends" | "hardware">("dashboard");

  // Sensor Telemetry state
  const [telemetry, setTelemetry] = useState<SensorTelemetry>({
    soilMoisture: 64,
    temperature: 25,
    humidity: 62,
    pH: 6.5,
    lightLux: 4500,
    deviceId: "SIM-FIELD-NODE",
    battery: 98,
    timestamp: new Date().toISOString(),
  });

  // Simulation & Hardware states
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [isRealHardwareConnected, setIsRealHardwareConnected] = useState(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);

  // Voice state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSpeechText, setCurrentSpeechText] = useState("");

  // Register voice state listener
  useEffect(() => {
    VoiceAssistant.setCallback((speaking, paused) => {
      setIsSpeaking(speaking);
      setIsPaused(paused);
    });
  }, []);

  // Poll backend for real IoT hardware updates if active
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/sensor-data");
        if (res.ok) {
          const data = await res.json();
          if (data.latest && data.latest.deviceId !== "SIM-SENSOR-01" && data.latest.deviceId !== "SIM-FIELD-NODE") {
            setIsRealHardwareConnected(true);
            // If real hardware is connected, update telemetry from backend!
            setTelemetry(data.latest);
          }
        }
      } catch (e) {
        // Silently ignore during offline preview
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Live Auto-Telemetry Simulation effect (random micro-fluctuations every 3.5 seconds)
  useEffect(() => {
    if (!isLiveStreaming) return;

    const streamInterval = setInterval(() => {
      setTelemetry((prev) => {
        // Micro fluctuation: moisture ±1%, temp ±0.4°C, hum ±1.5%
        const deltaM = (Math.random() - 0.48) * 1.8;
        const deltaT = (Math.random() - 0.48) * 0.8;
        const deltaH = (Math.random() - 0.48) * 2.2;

        const nextM = Math.max(5, Math.min(98, Math.round(prev.soilMoisture + deltaM)));
        const nextT = Math.max(10, Math.min(48, Math.round((prev.temperature + deltaT) * 10) / 10));
        const nextH = Math.max(15, Math.min(98, Math.round(prev.humidity + deltaH)));

        return {
          ...prev,
          soilMoisture: nextM,
          temperature: nextT,
          humidity: nextH,
          timestamp: new Date().toISOString(),
        };
      });
    }, 3500);

    return () => clearInterval(streamInterval);
  }, [isLiveStreaming]);

  // Evaluate stress against currently selected crop
  const stressEvaluation = useMemo(() => {
    return evaluateCropStress(selectedCrop, telemetry);
  }, [selectedCrop, telemetry]);

  // Language display name
  const currentLangOption = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];
  }, [selectedLanguage]);

  // Handle Voice Narration
  const handleSpeakReport = useCallback(() => {
    if (isSpeaking) {
      VoiceAssistant.stop();
      return;
    }

    const script = generateSpokenScript(selectedCrop, stressEvaluation, selectedLanguage);
    setCurrentSpeechText(script);
    VoiceAssistant.speak(script, selectedLanguage, 0.95, 1.0);
  }, [isSpeaking, selectedCrop, stressEvaluation, selectedLanguage]);

  // Speak arbitrary text (used by Leaf Diagnosis)
  const handleSpeakCustom = useCallback((text: string) => {
    setCurrentSpeechText(text);
    VoiceAssistant.speak(text, selectedLanguage, 0.95, 1.0);
  }, [selectedLanguage]);

  const handleStopSpeaking = useCallback(() => {
    VoiceAssistant.stop();
  }, []);

  const handlePauseToggle = useCallback(() => {
    if (isPaused) {
      VoiceAssistant.resume();
    } else {
      VoiceAssistant.pause();
    }
  }, [isPaused]);

  // Add custom AI generated crop to local catalog
  const handleAddCustomCrop = useCallback((newCrop: CropData) => {
    setAllCrops((prev) => [newCrop, ...prev]);
  }, []);

  // Simulate real hardware packet to test real-world IoT transition
  const handleSimulateHardwarePacket = async () => {
    try {
      const payload = {
        deviceId: "ESP32-FIELD-NODE-9B",
        soilMoisture: 52.4,
        temperature: 28.6,
        humidity: 65.2,
        pH: 6.4,
        battery: 94,
      };

      const res = await fetch("/api/sensor-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsRealHardwareConnected(true);
        setTelemetry({
          ...payload,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error(err);
      // Fallback update in state
      setIsRealHardwareConnected(true);
      setTelemetry((prev) => ({
        ...prev,
        deviceId: "ESP32-FIELD-NODE-9B",
        soilMoisture: 52,
        temperature: 28.5,
        humidity: 65,
        timestamp: new Date().toISOString(),
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Navigation */}
      <Navbar
        selectedCrop={selectedCrop}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isRealHardwareConnected={isRealHardwareConnected}
        onOpenHardwareModal={() => setIsHardwareModalOpen(true)}
        isSpeaking={isSpeaking}
        onStopSpeaking={handleStopSpeaking}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Universal Crop Search Bar (Pinned at top across all views) */}
        <CropSearchBar
          selectedCrop={selectedCrop}
          onSelectCrop={setSelectedCrop}
          allCrops={allCrops}
          onAddCustomCrop={handleAddCustomCrop}
        />

        {/* Tab 1: Field Dashboard */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {/* Metric 1: Health Status */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 text-center backdrop-blur-sm transition-all hover:border-slate-700">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Crop Status
                </div>
                <div
                  className="mt-1 font-outfit text-base sm:text-lg font-bold truncate"
                  style={{ color: stressEvaluation.color }}
                >
                  {stressEvaluation.level}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {selectedCrop.name}
                </div>
              </div>

              {/* Metric 2: Soil Moisture */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 text-center backdrop-blur-sm transition-all hover:border-slate-700">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1">
                  <Droplets className="h-3 w-3 text-blue-400" />
                  Soil Moisture
                </div>
                <div className="mt-1 font-outfit text-xl sm:text-2xl font-bold text-white">
                  {telemetry.soilMoisture}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Ideal: {selectedCrop.optimalMoisture.ideal}%
                </div>
              </div>

              {/* Metric 3: Temperature */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 text-center backdrop-blur-sm transition-all hover:border-slate-700">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1">
                  <Thermometer className="h-3 w-3 text-amber-400" />
                  Canopy Temp
                </div>
                <div className="mt-1 font-outfit text-xl sm:text-2xl font-bold text-white">
                  {telemetry.temperature}°C
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Ideal: {selectedCrop.optimalTemp.ideal}°C
                </div>
              </div>

              {/* Metric 4: Relative Humidity */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 text-center backdrop-blur-sm transition-all hover:border-slate-700">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1">
                  <Wind className="h-3 w-3 text-teal-400" />
                  Humidity
                </div>
                <div className="mt-1 font-outfit text-xl sm:text-2xl font-bold text-white">
                  {telemetry.humidity}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Ideal: {selectedCrop.optimalHumidity.ideal}%
                </div>
              </div>

              {/* Metric 5: Stress Score */}
              <div className="col-span-2 sm:col-span-1 rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 text-center backdrop-blur-sm transition-all hover:border-slate-700">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1">
                  <Activity className="h-3 w-3 text-emerald-400" />
                  Stress Score
                </div>
                <div
                  className="mt-1 font-outfit text-xl sm:text-2xl font-bold"
                  style={{ color: stressEvaluation.color }}
                >
                  {stressEvaluation.score}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Threshold: 30% / 65%
                </div>
              </div>
            </div>

            {/* Stress Evaluation & Solution Card */}
            <StressResultCard
              evaluation={stressEvaluation}
              selectedCrop={selectedCrop}
              onSpeak={handleSpeakReport}
              isSpeaking={isSpeaking}
              selectedLanguageName={currentLangOption.nativeName}
            />

            {/* Sensor Simulation & Hardware Control Panel */}
            <SensorSimulationPanel
              telemetry={telemetry}
              selectedCrop={selectedCrop}
              onUpdateTelemetry={(updated) => setTelemetry((prev) => ({ ...prev, ...updated }))}
              isLiveStreaming={isLiveStreaming}
              onToggleLiveStream={() => setIsLiveStreaming((prev) => !prev)}
              onOpenHardwareModal={() => setIsHardwareModalOpen(true)}
              isRealHardwareConnected={isRealHardwareConnected}
            />

            {/* Historical Trend Preview */}
            <TrendAnalytics
              currentScore={stressEvaluation.score}
              selectedCrop={selectedCrop}
              evaluation={stressEvaluation}
            />
          </div>
        )}

        {/* Tab 2: Leaf Diagnosis */}
        {activeTab === "leaf-diagnosis" && (
          <LeafDiagnosisTab
            selectedCrop={selectedCrop}
            selectedLanguage={selectedLanguage}
            selectedLanguageName={currentLangOption.nativeName}
            isSpeaking={isSpeaking}
            onStartSpeaking={handleSpeakCustom}
            onStopSpeaking={handleStopSpeaking}
          />
        )}

        {/* Tab 3: Detailed Stress Analytics */}
        {activeTab === "trends" && (
          <div className="space-y-6">
            <TrendAnalytics
              currentScore={stressEvaluation.score}
              selectedCrop={selectedCrop}
              evaluation={stressEvaluation}
            />

            {/* Agronomic Risk Breakdown */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl">
              <h3 className="font-outfit text-base font-bold text-white mb-3">
                Physiological Tolerance Profile: {selectedCrop.name}
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                    Known Stress Vulnerabilities
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {selectedCrop.vulnerabilities.map((v, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">
                    Common Leaf Pathologies
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {selectedCrop.commonDiseases.map((d, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
                    Agronomic Recommendation
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedCrop.quickTip}
                  </p>
                  <div className="mt-3 text-[11px] text-slate-400">
                    Optimal Soil pH: <strong className="text-slate-200">{selectedCrop.optimalPh}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Real Sensor Hardware Bridge */}
        {activeTab === "hardware" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-outfit text-lg font-bold text-white">
                  Real-World IoT Sensor Integration Center
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Deploy real physical soil moisture, temperature, and humidity nodes directly into agricultural soil.
                </p>
              </div>

              <button
                id="open-modal-from-tab-btn"
                onClick={() => setIsHardwareModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-emerald-500"
              >
                <Cpu className="h-4 w-4" />
                View ESP32 Wiring & Firmware
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-center">
                <div className="text-2xl mb-1">📡</div>
                <div className="text-xs font-bold text-white">1. Connect Microcontroller</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Connect ESP32 / Arduino to Capacitive Soil Moisture v1.2 and DHT22 / SHT31.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-center">
                <div className="text-2xl mb-1">⚡</div>
                <div className="text-xs font-bold text-white">2. Transmit Telemetry</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Firmware sends HTTP POST JSON requests to <code className="text-emerald-400">/api/sensor-data</code>.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-center">
                <div className="text-2xl mb-1">🔊</div>
                <div className="text-xs font-bold text-white">3. PlantVoice Speaks</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  App computes stress against your searched crop and speaks instructions aloud to farmers.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4">
              <div>
                <span className="text-xs font-semibold text-emerald-400">Ready to test packet?</span>
                <p className="text-xs text-slate-300">
                  Click below to simulate an incoming HTTP telemetry packet from an active ESP32 field node.
                </p>
              </div>
              <button
                id="simulate-packet-tab-btn"
                onClick={handleSimulateHardwarePacket}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md"
              >
                Send Mock IoT Packet
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Voice Player */}
      <VoicePlayer
        isSpeaking={isSpeaking}
        isPaused={isPaused}
        currentText={currentSpeechText}
        languageName={currentLangOption.name}
        onStop={handleStopSpeaking}
        onPauseToggle={handlePauseToggle}
      />

      {/* Hardware Modal */}
      <RealSensorModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
        telemetry={telemetry}
        isRealHardwareConnected={isRealHardwareConnected}
        onSimulateHardwarePacket={handleSimulateHardwarePacket}
      />

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4">
          <p>
            🌱 <strong className="text-slate-400">PlantVoice AI</strong> — Intelligent Crop Health & Sensor Assistant · Built for Farmers
          </p>
          <p className="mt-1 text-[11px] text-slate-600">
            Universal search across 75+ agricultural crops · Real-time agronomic threshold simulation · Gemini leaf pathology inspection · Multilingual Web Speech
          </p>
        </div>
      </footer>
    </div>
  );
}
