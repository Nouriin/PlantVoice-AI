export type CropCategory =
  | "All"
  | "Cereals & Grains"
  | "Vegetables"
  | "Fruits"
  | "Pulses & Legumes"
  | "Cash & Commercial"
  | "Spices & Plantation"
  | "Oilseeds & Others";

export interface CropThresholdRange {
  min: number;
  max: number;
  ideal: number;
}

export interface CropData {
  id: string;
  name: string;
  scientificName: string;
  category: CropCategory;
  optimalMoisture: CropThresholdRange; // %
  optimalTemp: CropThresholdRange;     // °C
  optimalHumidity: CropThresholdRange; // %
  optimalPh: string;
  growthDurationDays: string;
  vulnerabilities: string[];
  commonDiseases: string[];
  quickTip: string;
  emoji: string;
  description: string;
  isCustom?: boolean;
}

export interface SensorTelemetry {
  soilMoisture: number; // 0 - 100%
  temperature: number;  // °C
  humidity: number;     // 0 - 100%
  pH?: number;          // 0 - 14
  lightLux?: number;    // Lux
  deviceId?: string;
  battery?: number;     // %
  timestamp: string;
}

export type StressLevel = "Healthy" | "Moderate Stress" | "Critical Stress";

export type StressType =
  | "healthy"
  | "water_stress"
  | "heat_stress"
  | "excess_moisture"
  | "fungal_risk"
  | "cold_stress"
  | "vpd_stress";

export interface StressSolution {
  title: string;
  problem: string;
  recommended_action: string;
  low_cost_option: string;
  prevention: string;
}

export interface StressEvaluation {
  score: number;
  level: StressLevel;
  type: StressType;
  color: string;
  reasons: string[];
  solution: StressSolution;
  soilMoistureStatus: "low" | "optimal" | "high";
  temperatureStatus: "low" | "optimal" | "high";
  humidityStatus: "low" | "optimal" | "high";
}

export interface DiseaseDiagnosis {
  disease: string;
  crop: string;
  confidence: string;
  severity: "Low" | "Moderate" | "High" | "Critical" | "None (Healthy)";
  symptoms: string[];
  explanation: string;
  recommended_action: string;
  low_cost_option: string;
  prevention: string;
  isDemoFallback?: boolean;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  speechCode: string;
  flag: string;
}
