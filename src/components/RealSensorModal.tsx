import React, { useState } from "react";
import { Cpu, X, Copy, Check, Radio, Terminal, Server, Wifi, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { SensorTelemetry } from "../types";

interface RealSensorModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: SensorTelemetry;
  isRealHardwareConnected: boolean;
  onSimulateHardwarePacket: () => void;
}

export const RealSensorModal: React.FC<RealSensorModalProps> = ({
  isOpen,
  onClose,
  telemetry,
  isRealHardwareConnected,
  onSimulateHardwarePacket,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "code" | "schema">("overview");

  if (!isOpen) return null;

  const sampleArduinoCode = `/*
 * PlantVoice AI — ESP32 Field Node Telemetry Publisher
 * Hardware: ESP32 + Capacitive Soil Moisture Sensor + DHT22 / SHT31
 */
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "DHT.h"

#define DHTPIN 4
#define DHTTYPE DHT22
#define SOIL_PIN 34 // Analog ADC1 pin

const char* ssid = "YOUR_FARM_WIFI";
const char* password = "WIFI_PASSWORD";
const char* serverEndpoint = "https://YOUR_APP_URL/api/sensor-data";

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected! IP: " + WiFi.localIP().toString());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverEndpoint);
    http.addHeader("Content-Type", "application/json");

    // Read real sensor probes
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();
    int rawSoil = analogRead(SOIL_PIN);
    // Calibrate 0-100% moisture for capacitive sensor
    float soilMoisture = map(rawSoil, 3200, 1400, 0, 100);
    soilMoisture = constrain(soilMoisture, 0.0, 100.0);

    StaticJsonDocument<200> doc;
    doc["deviceId"] = "ESP32-NODE-FIELD-01";
    doc["soilMoisture"] = soilMoisture;
    doc["temperature"] = temp;
    doc["humidity"] = hum;
    doc["pH"] = 6.6;
    doc["battery"] = 96;

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);
    Serial.println("Telemetry dispatched. HTTP response: " + String(httpResponseCode));
    http.end();
  }
  // Transmit telemetry every 15 seconds
  delay(15000);
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleArduinoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-outfit text-base font-bold text-white sm:text-lg">
                Physical IoT Sensor Hardware Integration
              </h3>
              <p className="text-xs text-slate-400">
                Bridge from Demo Simulation to Real-World Farm Sensors
              </p>
            </div>
          </div>

          <button
            id="close-hardware-modal-btn"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/60 px-6 py-3">
          <div className="flex items-center gap-2">
            <Radio className={`h-4 w-4 ${isRealHardwareConnected ? "text-emerald-400 animate-pulse" : "text-amber-400"}`} />
            <span className="text-xs text-slate-300">
              Current Telemetry Source:{" "}
              <strong className={isRealHardwareConnected ? "text-emerald-300" : "text-amber-300"}>
                {isRealHardwareConnected ? "Physical Hardware Node (ESP32)" : "Virtual Simulation Node"}
              </strong>
            </span>
          </div>

          <button
            id="test-hardware-packet-btn"
            onClick={onSimulateHardwarePacket}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/30"
          >
            <Zap className="h-3.5 w-3.5" />
            {isRealHardwareConnected ? "Re-send Sensor Packet" : "Test Live Hardware Packet"}
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6">
          <button
            onClick={() => setActiveSubTab("overview")}
            className={`border-b-2 py-3 px-4 text-xs font-semibold transition-all ${
              activeSubTab === "overview"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            1. Recommended Hardware
          </button>
          <button
            onClick={() => setActiveSubTab("code")}
            className={`border-b-2 py-3 px-4 text-xs font-semibold transition-all ${
              activeSubTab === "code"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            2. ESP32 / Arduino Code
          </button>
          <button
            onClick={() => setActiveSubTab("schema")}
            className={`border-b-2 py-3 px-4 text-xs font-semibold transition-all ${
              activeSubTab === "schema"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            3. REST API Endpoint
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 text-slate-300 text-xs leading-relaxed space-y-4">
          {activeSubTab === "overview" && (
            <div className="space-y-4">
              <p>
                In this prototype demo, PlantVoice AI provides full slider and auto-telemetry simulation.
                When deploying in the real world, you can hook physical sensors to an ESP32 or Raspberry Pi microcontroller that sends real readings directly to this application via WiFi, 4G LTE, or LoRaWAN.
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                  <div className="font-semibold text-emerald-400 text-sm">
                    💧 Soil Moisture Sensor
                  </div>
                  <p className="mt-1 text-slate-400">
                    <strong>Capacitive Soil Moisture Sensor v1.2 / v2.0</strong> (analog voltage, corrosion-resistant, measures soil volumetric water content).
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                  <div className="font-semibold text-amber-400 text-sm">
                    🌡️ Temperature & Humidity
                  </div>
                  <p className="mt-1 text-slate-400">
                    <strong>DHT22 (AM2302) or Sensirion SHT31 / SHT40</strong> (digital I2C/OneWire, ±0.3°C accuracy, 0-100% RH).
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                  <div className="font-semibold text-blue-400 text-sm">
                    🧠 Microcontroller Node
                  </div>
                  <p className="mt-1 text-slate-400">
                    <strong>ESP32 DevKit v1 / NodeMCU-32S</strong> with built-in Wi-Fi & Bluetooth, deep sleep power management, and solar-battery recharging.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                  <div className="font-semibold text-purple-400 text-sm">
                    🧪 Advanced Expansion
                  </div>
                  <p className="mt-1 text-slate-400">
                    Industrial RS485 Modbus soil sensor (Soil NPK Nitrogen/Phosphorus/Potassium + Soil pH + EC Electrical Conductivity).
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "code" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">
                  Ready-to-flash C++ sketch for Arduino IDE / PlatformIO:
                </span>
                <button
                  id="copy-arduino-code-btn"
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied!" : "Copy Code"}</span>
                </button>
              </div>

              <pre className="max-h-72 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-emerald-300">
                {sampleArduinoCode}
              </pre>
            </div>
          )}

          {activeSubTab === "schema" && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 font-mono text-[11px]">
                <div className="text-slate-400 mb-1">// Endpoint</div>
                <div className="text-emerald-400 font-bold">POST /api/sensor-data</div>
                <div className="text-slate-400 mt-3 mb-1">// Payload JSON Schema</div>
                <pre className="text-slate-200">{`{
  "deviceId": "ESP32-FIELD-01",
  "soilMoisture": 58.5,    // 0 - 100 (%)
  "temperature": 27.2,     // (°C)
  "humidity": 64.0,        // 0 - 100 (%)
  "pH": 6.5,               // (optional)
  "lightLux": 4200,        // (optional)
  "battery": 95            // (optional %)
}`}</pre>
                <div className="text-slate-400 mt-3 mb-1">// Response (200 OK)</div>
                <pre className="text-emerald-400">{`{
  "success": true,
  "message": "Sensor telemetry recorded successfully"
}`}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 bg-slate-950/80 px-6 py-3">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
