import { CropData, SensorTelemetry, StressEvaluation, StressLevel, StressType, StressSolution } from "../types";

export function evaluateCropStress(crop: CropData, telemetry: SensorTelemetry): StressEvaluation {
  const { soilMoisture, temperature, humidity } = telemetry;
  const { optimalMoisture, optimalTemp, optimalHumidity } = crop;

  let score = 0;
  const reasons: string[] = [];

  // 1. Soil Moisture evaluation against crop-specific thresholds
  let soilMoistureStatus: "low" | "optimal" | "high" = "optimal";
  if (soilMoisture < optimalMoisture.min) {
    soilMoistureStatus = "low";
    const deficit = optimalMoisture.min - soilMoisture;
    const severity = Math.min(45, Math.round((deficit / optimalMoisture.min) * 50));
    score += severity;
    reasons.push(
      `Soil moisture is ${soilMoisture}% (below ${crop.name}'s minimum threshold of ${optimalMoisture.min}%). Deficit: ${deficit}%. Root turgor declining.`
    );
  } else if (soilMoisture > optimalMoisture.max) {
    soilMoistureStatus = "high";
    const surplus = soilMoisture - optimalMoisture.max;
    const severity = Math.min(40, Math.round((surplus / (100 - optimalMoisture.max || 1)) * 45));
    score += severity;
    reasons.push(
      `Soil moisture is ${soilMoisture}% (exceeds ${crop.name}'s optimal limit of ${optimalMoisture.max}%). Soil hypoxia & anaerobic root rot hazard.`
    );
  }

  // 2. Temperature evaluation against crop-specific thresholds
  let temperatureStatus: "low" | "optimal" | "high" = "optimal";
  if (temperature > optimalTemp.max) {
    temperatureStatus = "high";
    const excess = temperature - optimalTemp.max;
    const severity = Math.min(40, Math.round(excess * 5.5));
    score += severity;
    reasons.push(
      `Canopy temperature is ${temperature}°C (above ${crop.name}'s max comfort limit of ${optimalTemp.max}°C). Stomatal closure & pollen desiccation risk.`
    );
  } else if (temperature < optimalTemp.min) {
    temperatureStatus = "low";
    const chill = optimalTemp.min - temperature;
    const severity = Math.min(35, Math.round(chill * 4.5));
    score += severity;
    reasons.push(
      `Temperature is ${temperature}°C (chilling stress below ${crop.name}'s min limit of ${optimalTemp.min}°C). Slow metabolic transport & nutrient lock.`
    );
  }

  // 3. Humidity & Vapor Pressure Deficit (VPD) evaluation
  let humidityStatus: "low" | "optimal" | "high" = "optimal";
  if (humidity > optimalHumidity.max && temperature >= 20) {
    humidityStatus = "high";
    const excess = humidity - optimalHumidity.max;
    const severity = Math.min(25, Math.round((excess / (100 - optimalHumidity.max || 1)) * 28));
    score += severity;
    reasons.push(
      `Ambient humidity is high at ${humidity}% (ideal: ${optimalHumidity.min}-${optimalHumidity.max}%). Sustained moisture film invites foliar fungal spores.`
    );
  } else if (humidity < optimalHumidity.min && temperature > 28) {
    humidityStatus = "low";
    score += 15;
    reasons.push(
      `Relative humidity is critically dry at ${humidity}%, causing extreme atmospheric moisture suction (high VPD stress) and leaf curling.`
    );
  }

  // Compound stress interactions
  if (soilMoistureStatus === "low" && temperatureStatus === "high") {
    score = Math.min(100, score + 12);
    reasons.unshift(
      `Compound Agro-Drought: Simultaneous root zone moisture deficit and high thermal radiation multiplying wilting velocity.`
    );
  }
  if (soilMoistureStatus === "high" && humidityStatus === "high") {
    score = Math.min(100, score + 10);
    reasons.unshift(
      `Compound Waterlogging & Damping Hazard: Saturated soil bed combined with stifling ambient humidity.`
    );
  }

  score = Math.min(100, Math.max(0, score));

  // Determine classification and primary stress type
  let level: StressLevel = "Healthy";
  let color = "#22c55e"; // Emerald green
  if (score >= 65) {
    level = "Critical Stress";
    color = "#ef4444"; // Red
  } else if (score >= 28) {
    level = "Moderate Stress";
    color = "#f59e0b"; // Amber
  }

  let type: StressType = "healthy";
  if (soilMoistureStatus === "low" && (temperatureStatus === "high" || score > 30)) {
    type = "water_stress";
  } else if (temperatureStatus === "high" && score > 30) {
    type = "heat_stress";
  } else if (soilMoistureStatus === "high" && score > 30) {
    type = "excess_moisture";
  } else if (humidityStatus === "high" && score > 25) {
    type = "fungal_risk";
  } else if (temperatureStatus === "low" && score > 25) {
    type = "cold_stress";
  } else if (score >= 28) {
    type = "vpd_stress";
  }

  if (score < 28 && reasons.length === 0) {
    reasons.push(
      `All sensor telemetry metrics (Moisture ${soilMoisture}%, Temp ${temperature}°C, Humidity ${humidity}%) are within ${crop.name}'s optimal physiological comfort envelope.`
    );
  }

  const solution = generateSolution(crop, type, telemetry, level);

  return {
    score,
    level,
    type,
    color,
    reasons,
    solution,
    soilMoistureStatus,
    temperatureStatus,
    humidityStatus,
  };
}

function generateSolution(
  crop: CropData,
  type: StressType,
  telemetry: SensorTelemetry,
  level: StressLevel
): StressSolution {
  if (type === "healthy") {
    return {
      title: `Optimal Growth Conditions for ${crop.name}`,
      problem: `Current micro-climate parameters match ${crop.name}'s physiological requirements.`,
      recommended_action: `Maintain current irrigation cycle and monitor field moisture daily at 10-15 cm root depth.`,
      low_cost_option: `Maintain 2-inch organic leaf mulch to sustain root micro-biome and prevent evaporative moisture loss.`,
      prevention: `Inspect leaf undersides weekly for early sucking pests (aphids, thrips, whiteflies) before flowering.`
    };
  }

  if (type === "water_stress") {
    return {
      title: `Water Deficit & Drought Stress in ${crop.name}`,
      problem: `Soil moisture (${telemetry.soilMoisture}%) is insufficient to sustain transpirational pull for ${crop.name} at ${telemetry.temperature}°C.`,
      recommended_action: `Initiate targeted drip or furrow irrigation immediately. Target bringing soil moisture back to ${crop.optimalMoisture.ideal}%. Prioritize early morning irrigation.`,
      low_cost_option: `Spread dry paddy straw, sugarcane bagasse, or shredded leaf mulch around plant basins to cut soil evaporation by 65%. Spray 2% Kaolin clay or diluted starch spray as an anti-transpirant.`,
      prevention: `Incorporate farmyard manure (FYM) or biochar to increase soil water-holding capacity by 25-30% before the next planting season.`
    };
  }

  if (type === "heat_stress") {
    return {
      title: `Thermal Radiation & Heat Stress in ${crop.name}`,
      problem: `Canopy ambient temperature of ${telemetry.temperature}°C exceeds ${crop.name}'s threshold (${crop.optimalTemp.max}°C), risking pollen sterility and flower drop.`,
      recommended_action: `Run overhead micro-sprinklers or misting lines for 15-minute intervals during peak midday heat (12 PM - 3 PM) to create evaporative canopy cooling.`,
      low_cost_option: `Erect temporary 35% agro-shade netting or intercrop with tall border plants (Sorghum or Sunhemp) along the western boundary as natural wind/heat buffer.`,
      prevention: `Spray 1% potassium nitrate (KNO3) or ascorbic acid to boost cellular osmotic adjustment and leaf turgor against high thermal stress.`
    };
  }

  if (type === "excess_moisture") {
    return {
      title: `Waterlogging & Anaerobic Root Stress in ${crop.name}`,
      problem: `High soil moisture (${telemetry.soilMoisture}%) is depriving roots of oxygen (hypoxia), encouraging Pythium and Phytophthora root rot.`,
      recommended_action: `Halt all irrigation immediately. Dig lateral surface drainage trenches (15-20 cm deep) at bed ends to siphon standing water out of the root zone.`,
      low_cost_option: `Dust clean dry wood ash or broadcast dry river sand along row beds to accelerate surface drying and suppress collar dampening.`,
      prevention: `Switch to raised bed cultivation (15-20 cm elevated ridges) with sub-surface drainage pipes for future crop cycles.`
    };
  }

  if (type === "fungal_risk") {
    return {
      title: `High Humidity Foliar Disease Risk in ${crop.name}`,
      problem: `Prolonged high relative humidity (${telemetry.humidity}%) combined with warm temperature creates ideal incubation for fungal spores and bacterial blights.`,
      recommended_action: `Prune dense bottom foliage and suckers to open canopy airflow. Avoid any overhead sprinkler watering; switch strictly to ground-level drip.`,
      low_cost_option: `Spray sour buttermilk/whey solution (1 part curd whey : 10 parts water) or fresh cow urine + neem leaf extract (1:10 dilution) every 5 days as a natural bio-antifungal shield.`,
      prevention: `Maintain wider row spacing (minimum 45-60 cm) and apply prophylactic Trichoderma harzianum bio-agent to the root zone.`
    };
  }

  if (type === "cold_stress") {
    return {
      title: `Chilling & Low Temperature Shock in ${crop.name}`,
      problem: `Temperature has fallen to ${telemetry.temperature}°C (below ${crop.name}'s threshold of ${crop.optimalTemp.min}°C), restricting phosphorus uptake and sap flow.`,
      recommended_action: `Provide light evening surface irrigation—water retains heat longer than air and releases latent heat as temperature plummets at night.`,
      low_cost_option: `Cover sensitive young crop rows with cheap clear polyethylene cloches, woven frost cloth, or straw hats before sunset.`,
      prevention: `Foliar spray with soluble potassium and seaweed extract to fortify plant cell membranes against frost crystallization.`
    };
  }

  // Default VPD / atmospheric stress
  return {
    title: `Microclimate Imbalance in ${crop.name}`,
    problem: `Environmental combination is causing abnormal transpirational strain on ${crop.name}.`,
    recommended_action: `Adjust irrigation frequency and monitor canopy turgidity twice daily.`,
    low_cost_option: `Apply generous organic mulch around the root collar to buffer root zone fluctuations.`,
    prevention: `Maintain companion planting with cover crops to stabilize the local boundary layer microclimate.`
  };
}

// Malayalam translations for crop names and agronomic stress recommendations
const CROP_NAMES_ML: Record<string, string> = {
  "Tomato": "തക്കാളി",
  "Rice / Paddy": "നെല്ല്",
  "Chili Pepper": "പച്ചമുളക്",
  "Banana": "വാഴ",
  "Black Pepper": "കുരുമുളക്",
  "Coconut Palm": "തെങ്ങ്",
  "Cardamom": "ഏലം",
  "Coffee": "കാപ്പി",
  "Tea": "തേയില",
  "Ginger": "ഇഞ്ചി",
  "Potato": "ഉരുളക്കിഴങ്ങ്",
  "Cassava": "മരച്ചീനി (കപ്പ)",
  "Maize / Corn": "ചോളം",
  "Wheat": "ഗോതമ്പ്",
  "Onion": "സവാള",
  "Cotton": "പരുത്തി",
};

const STRESS_TRANSLATIONS_ML: Record<StressType, { problem: string; action: string; lowCost: string }> = {
  healthy: {
    problem: "മണ്ണിലെ ഈർപ്പവും അന്തരീക്ഷ കാലാവസ്ഥയും സസ്യ വളർച്ചയ്ക്ക് ഏറ്റവും അനുയോജ്യമാണ്.",
    action: "നിലവിലെ നനയ്ക്കൽ രീതിയും വളപ്രയോഗവും കൃത്യമായി തുടരുക.",
    lowCost: "മണ്ണിലെ ഈർപ്പം നിലനിർത്താൻ ഉണങ്ങിയ ഇലകൾ കൊണ്ട് ചുവട്ടിൽ പുതയിടുക.",
  },
  water_stress: {
    problem: "മണ്ണിലെ ഈർപ്പത്തിന്റെ അളവ് വളരെ കുറവാണ്. സസ്യങ്ങളിൽ വരൾച്ചയുടെ ലക്ഷണങ്ങൾ കാണുന്നു.",
    action: "ഉടൻ തന്നെ തുള്ളി നനയോ ചാലു നനയോ വഴി വിള നന്നായി നനയ്ക്കുക. അതിരാവിലെ നനയ്ക്കുന്നതാണ് ഏറ്റവും ഉചിതം.",
    lowCost: "മണ്ണിൽ നിന്നുള്ള ജലബാഷ്പീകരണം തടയാൻ ഉണങ്ങിയ വൈക്കോലോ കരിയിലയോ ഉപയോഗിച്ച് ചുവട്ടിൽ കട്ടിയായി പുതയിടുക.",
  },
  heat_stress: {
    problem: "അന്തരീക്ഷ താപനില വളരെ കൂടുതലാണ്. ഇത് പൂ കൊഴിച്ചിലിനും ഇല വാട്ടത്തിനും കാരണമായേക്കാം.",
    action: "ചെടികൾക്ക് ചുറ്റും നേരിയ തോതിൽ നന നൽകി തണുപ്പ് നിലനിർത്തുക. ആവശ്യമെങ്കിൽ തണൽ വലകൾ വിരിക്കുക.",
    lowCost: "സൂര്യതാപം കുറയ്ക്കാൻ കഞ്ഞിവെള്ളം നേർപ്പിച്ച് തളിക്കുകയോ നനച്ച ചണച്ചാക്ക് കൊണ്ട് തണൽ നൽകുകയോ ചെയ്യുക.",
  },
  excess_moisture: {
    problem: "മണ്ണിൽ അമിതമായ വെള്ളക്കെട്ട് കണ്ടെത്തി. ഇത് വേര് ചീയലിനും വായുസഞ്ചാരക്കുറവിനും ഇടയാക്കും.",
    action: "തോട്ടത്തിൽ കെട്ടിക്കിടക്കുന്ന വെള്ളം ഒഴുക്കി വിടാൻ ഡ്രെയിനേജ് ചാലുകൾ ഉടൻ വൃത്തിയാക്കുക.",
    lowCost: "വേരുകൾക്ക് വായുസഞ്ചാരം ലഭിക്കാൻ മണ്ണ് ചെറുതായി ഇളക്കി കൊടുക്കുക, ട്രൈക്കോഡെർമ ചേർത്ത ചാണകപ്പൊടി ചുവട്ടിൽ ചേർക്കുക.",
  },
  fungal_risk: {
    problem: "വായുവിലെ ഉയർന്ന ആർദ്രത കാരണം ഇലകളിൽ കുമിൾ രോഗങ്ങളും പുള്ളിക്കുത്തും വരാൻ ഉയർന്ന സാധ്യതയുണ്ട്.",
    action: "ഇലകൾക്കിടയിൽ വായുസഞ്ചാരം ഉറപ്പാക്കാൻ താഴത്തെ ഉണങ്ങിയ ഇലകൾ വെട്ടിമാറ്റുക. ജൈവ കുമിൾനാശിനി ഉപയോഗിക്കുക.",
    lowCost: "ഒരു ലിറ്റർ വെള്ളത്തിൽ 100 മില്ലി പുളിച്ച മോര് നേർപ്പിച്ച് ഇലകളിൽ തളിക്കുക.",
  },
  cold_stress: {
    problem: "താഴ്ന്ന താപനില കാരണം സസ്യങ്ങളുടെ വളർച്ചയും പോഷക ആഗിരണവും മന്ദഗതിയിലാകുന്നു.",
    action: "തണുപ്പ് കുറയ്ക്കാൻ വൈകുന്നേരങ്ങളിൽ ചെറുതായി നനയ്ക്കുകയും ചുവട്ടിൽ പുതയിടുകയും ചെയ്യുക.",
    lowCost: "ചെടികൾക്ക് ചുറ്റും ഉണങ്ങിയ കരിയില കൊണ്ടിടുക.",
  },
  vpd_stress: {
    problem: "അന്തരീക്ഷ ഈർപ്പവും താപനിലയും തമ്മിലുള്ള സന്തുലിതാവസ്ഥയിൽ വ്യതിയാനമുണ്ട്.",
    action: "തോട്ടത്തിൽ ആവശ്യത്തിന് നന നൽകി അന്തരീക്ഷ ആർദ്രത ക്രമീകരിക്കുക.",
    lowCost: "ചെടികൾക്ക് ചുറ്റും നനച്ച ചണച്ചാക്കുകൾ തൂക്കിയിടുക.",
  },
};

export function generateSpokenScript(crop: CropData, evaluation: StressEvaluation, language: string = "en"): string {
  const { score, level, solution, type } = evaluation;

  if (language === "ml") {
    const mlCrop = CROP_NAMES_ML[crop.name] || crop.name;
    const mlTrans = STRESS_TRANSLATIONS_ML[type];
    const problem = mlTrans?.problem || solution.problem;
    const action = mlTrans?.action || solution.recommended_action;
    const lowCost = mlTrans?.lowCost || solution.low_cost_option;

    if (level === "Healthy") {
      return `നമസ്കാരം കർഷക മിത്രമേ! താങ്കളുടെ ${mlCrop} വിള പൂർണ്ണ ആരോഗ്യത്തോടെ വളരുന്നു. സ്ട്രെസ് സ്കോർ വെറും ${score} ശതമാനമാണ്. ${problem} ${action}`;
    }
    return `ശ്രദ്ധിക്കുക! താങ്കളുടെ ${mlCrop} വിളയിൽ സ്ട്രെസ് സ്കോർ ${score} ശതമാനമാണ്. പ്രധാന കാരണം: ${problem}. പരിഹാരം: ${action}. കുറഞ്ഞ ചെലവിലുള്ള പ്രതിവിധി: ${lowCost}`;
  }

  if (language === "hi") {
    if (level === "Healthy") {
      return `नमस्ते किसान साथी! आपके ${crop.name} की स्थिति बहुत अच्छी है। स्ट्रेस स्कोर मात्र ${score} प्रतिशत है। सभी सेंसर सामान्य हैं। अपनी वर्तमान सिंचाई प्रणाली जारी रखें।`;
    }
    return `सावधान! आपके ${crop.name} में ${level === "Critical Stress" ? "गंभीर तनाव" : "मध्यम तनाव"} देखा गया है। तनाव स्कोर ${score} प्रतिशत है। मुख्य कारण: ${solution.problem} सलाह: ${solution.recommended_action} कम लागत उपाय: ${solution.low_cost_option}`;
  }

  if (language === "ta") {
    if (level === "Healthy") {
      return `வணக்கம் விவசாய தோழரே! உங்கள் ${crop.name} பயிர் ஆரோக்கியமாக உள்ளது. மன அழுத்த அளவு ${score} சதவீதம் மட்டுமே.`;
    }
    return `கவனம்! உங்கள் ${crop.name} பயிரில் பாதிப்பு கண்டறியப்பட்டுள்ளது. மன அழுத்த அளவு ${score} சதவீதம். பரிந்துரை: ${solution.recommended_action}. குறைந்த செலவு தீர்வு: ${solution.low_cost_option}`;
  }

  if (language === "te") {
    if (level === "Healthy") {
      return `నమస్కారం రైతు మిత్రమా! మీ ${crop.name} పంట చాలా ఆరోగ్యంగా ఉంది. ఒత్తిడి స్కోర్ ${score} శాతం మాత్రమే.`;
    }
    return `హెచ్చరిక! మీ ${crop.name} పంటలో ఒత్తిడి స్థాయి ${score} శాతంగా ఉంది. ప్రధాన సమస్య: ${solution.problem}. తక్షణ చర్య: ${solution.recommended_action}. తక్కువ ఖర్చు పరిష్కారం: ${solution.low_cost_option}`;
  }

  if (language === "kn") {
    if (level === "Healthy") {
      return `ನಮಸ್ಕಾರ ರೈತ ಮಿತ್ರರೇ! ನಿಮ್ಮ ${crop.name} ಬೆಳೆ ಆರೋಗ್ಯಕರವಾಗಿದೆ. ಒತ್ತಡದ ಸ್ಕೋರ್ ಕೇವಲ ${score} ಪ್ರತಿಶತ.`;
    }
    return `ಎಚ್ಚರಿಕೆ! ನಿಮ್ಮ ${crop.name} ಬೆಳೆಯಲ್ಲಿ ${score} ಪ್ರತಿಶತ ಒತ್ತಡ ಕಂಡುಬಂದಿದೆ. ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮ: ${solution.recommended_action}. ಕಡಿಮೆ ವೆಚ್ಚದ ಪರಿಹಾರ: ${solution.low_cost_option}`;
  }

  if (language === "es") {
    if (level === "Healthy") {
      return `¡Hola agricultor! Su cultivo de ${crop.name} está en óptimas condiciones. Puntuación de estrés: ${score} por ciento. Continúe con sus prácticas normales.`;
    }
    return `¡Atención! Se detectó estrés en su cultivo de ${crop.name} con una puntuación de ${score} por ciento. Problema: ${solution.problem}. Acción recomendada: ${solution.recommended_action}. Opción económica: ${solution.low_cost_option}`;
  }

  // English default
  if (level === "Healthy") {
    return `Hello farmer. Your ${crop.name} crop is in healthy, optimal condition. Stress score is only ${score} percent. Soil moisture, temperature, and humidity are perfectly balanced. Continue regular watering and monitoring.`;
  }

  return `Attention farmer! Stress detected in your ${crop.name} crop. Stress score is ${score} percent, indicating ${level}. Primary condition: ${solution.problem}. Recommended immediate action: ${solution.recommended_action}. Low-cost practical option: ${solution.low_cost_option}.`;
}
