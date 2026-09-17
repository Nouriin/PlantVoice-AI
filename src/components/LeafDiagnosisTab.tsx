import React, { useState, useRef } from "react";
import { CropData, DiseaseDiagnosis } from "../types";
import { Upload, Camera, Sparkles, AlertCircle, CheckCircle2, Volume2, RefreshCw, Eye, Shield, DollarSign, Lightbulb } from "lucide-react";
import { VoiceAssistant } from "../utils/speechSynthesis";

interface LeafDiagnosisTabProps {
  selectedCrop: CropData;
  selectedLanguage: string;
  selectedLanguageName: string;
  isSpeaking: boolean;
  onStartSpeaking: (text: string) => void;
  onStopSpeaking: () => void;
}

// Sample presets for instant demonstration
const SAMPLE_LEAF_PRESETS = [
  {
    id: "early_blight",
    title: "Tomato Early Blight",
    crop: "Tomato",
    disease: "Early Blight (Alternaria solani)",
    confidence: "94%",
    severity: "Moderate" as const,
    symptoms: ["Concentric target-like brown rings", "Yellow chlorotic halo around lesions", "Lower foliage necrosis"],
    explanation: "Alternaria solani fungus produces characteristic bullseye concentric lesions, typically starting on older bottom leaves under warm, humid conditions.",
    recommended_action: "Prune and destroy infected lower leaves. Apply copper oxychloride (3g/L) or biological Trichoderma spray in early morning.",
    low_cost_option: "Spray 1:10 sour buttermilk/whey solution or 0.5% baking soda with horticultural liquid soap to alter leaf surface pH and suppress fungal spores.",
    prevention: "Mulch tomato beds with dry straw to prevent rain-splash of fungal spores from the soil onto lower leaves.",
    sampleImage: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "late_blight",
    title: "Potato Late Blight",
    crop: "Potato",
    disease: "Late Blight (Phytophthora infestans)",
    confidence: "96%",
    severity: "High" as const,
    symptoms: ["Water-soaked dark lesions", "White cottony fungal growth on underside", "Rapid tissue collapse"],
    explanation: "Phytophthora infestans attacks rapidly in cool, wet weather, producing dark water-soaked patches that turn necrotic within 48 hours.",
    recommended_action: "Spray systemic metalaxyl-mancozeb fungicide immediately. Cut infected vines to ground level before harvest to protect tubers.",
    low_cost_option: "Dust wood ash and spray fresh neem leaf extract (5%) mixed with turmeric powder as an organic antiseptic wash.",
    prevention: "Ensure wide ridge spacing to maximize airflow and plant certified disease-free seed tubers.",
    sampleImage: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "corn_rust",
    title: "Maize Common Rust",
    crop: "Maize (Corn)",
    disease: "Common Rust (Puccinia sorghi)",
    confidence: "91%",
    severity: "Moderate" as const,
    symptoms: ["Cinnamon-brown powdery pustules", "Ruptured epidermal blisters", "Leaf chlorosis and premature drying"],
    explanation: "Puccinia sorghi produces brick-red to brown uredinia on both upper and lower leaf surfaces, spreading airborne spores during cool, moist periods.",
    recommended_action: "Apply propiconazole or azoxystrobin fungicide if pustules cover >5% of the ear leaf before blister stage.",
    low_cost_option: "Spray diluted cow urine solution (1:8) with fermented garlic extract to arrest spore germination organically.",
    prevention: "Sow rust-resistant hybrid varieties and avoid delayed late plantings.",
    sampleImage: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "healthy_rice",
    title: "Healthy Rice Leaf",
    crop: "Rice (Paddy)",
    disease: "Healthy Foliage (No Pathology)",
    confidence: "98%",
    severity: "None (Healthy)" as const,
    symptoms: ["Vibrant green linear veins", "No fungal lesions or yellowing", "Turgid cuticle and intact margins"],
    explanation: "Leaf tissue exhibits high chlorophyll density, intact cellular margins, and zero evidence of bacterial blight or blast lesions.",
    recommended_action: "Continue current nitrogen-phosphorus-potassium balance and water depth schedule.",
    low_cost_option: "Apply fermented compost tea or Panchagavya (3%) to enhance indigenous beneficial phyllosphere bacteria.",
    prevention: "Regularly scout borders for early leaf folder caterpillars or brown planthopper nymphs.",
    sampleImage: "https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=400&q=80",
  },
];

// Maximum file upload limit (200MB per file)
const MAX_FILE_SIZE_MB = 200;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const LeafDiagnosisTab: React.FC<LeafDiagnosisTabProps> = ({
  selectedCrop,
  selectedLanguage,
  selectedLanguageName,
  isSpeaking,
  onStartSpeaking,
  onStopSpeaking,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; sizeFormatted: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiseaseDiagnosis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Process and load image file with 200MB limit check
  const processAndLoadFile = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setError(`File size (${fileSizeMB} MB) exceeds the 200 MB per file limit. Please select an image under 200 MB.`);
      return;
    }

    const fileSizeFormatted =
      file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    setFileInfo({
      name: file.name,
      sizeFormatted: fileSizeFormatted,
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        setError("Failed to load image preview.");
        return;
      }

      // Optimize image through offscreen canvas to guarantee clean, standard JPEG and manageable payload
      const img = new Image();
      img.onload = () => {
        const maxDimension = 1600;
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
          setSelectedImage(optimizedDataUrl);
        } else {
          setSelectedImage(rawDataUrl);
        }
        setDiagnosis(null);
        setError(null);
      };
      img.onerror = () => {
        setSelectedImage(rawDataUrl);
        setDiagnosis(null);
        setError(null);
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      setError("Failed to read the image file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  // Handle file selection from local device input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndLoadFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndLoadFile(file);
    }
  };

  // Start device camera
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setError("Camera access was blocked or is unavailable. You can upload an image file instead.");
      setIsCameraActive(false);
    }
  };

  // Capture photo from camera stream
  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setSelectedImage(dataUrl);
      setDiagnosis(null);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Analyze leaf using server endpoint
  const analyzeLeaf = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze-leaf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: selectedImage,
          cropName: selectedCrop.name,
          language: selectedLanguage,
        }),
      });

      const result = await res.json();

      if (result && result.disease) {
        setDiagnosis(result);

        // Auto speak if available
        const voiceText =
          selectedLanguage === "ml"
            ? `${result.crop || selectedCrop.name} വിളയിലെ ഇല പരിശോധന ഫലം: ${result.disease}. രോഗ തീവ്രത: ${result.severity}. നിർദ്ദേശിക്കുന്ന പരിഹാരം: ${result.recommended_action}.${result.low_cost_option ? ` കുറഞ്ഞ ചെലവിലുള്ള പ്രതിവിധി: ${result.low_cost_option}` : ""}`
            : `Diagnosis result for ${result.crop || selectedCrop.name}: ${result.disease}. Severity is ${result.severity}. Recommended action: ${result.recommended_action}`;
        onStartSpeaking(voiceText);
      } else if (result && result.error) {
        setError(result.error);
      } else {
        setError("Could not complete diagnosis. Please ensure the leaf is clearly visible and in focus.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze leaf image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Select sample leaf preset
  const handleSelectPreset = (preset: typeof SAMPLE_LEAF_PRESETS[0]) => {
    setSelectedImage(preset.sampleImage);
    setFileInfo(null);

    // Provide localized text if Malayalam is selected
    const isMl = selectedLanguage === "ml";
    const presetDiagnosis: DiseaseDiagnosis = isMl
      ? {
          disease:
            preset.id === "early_blight"
              ? "തക്കാളി ആൾട്ടർനേരിയ ഇലപ്പുള്ളി രോഗം (Tomato Early Blight)"
              : preset.id === "late_blight"
              ? "ഉരുളക്കിഴങ്ങ് ലേറ്റ് ബ്ലൈറ്റ് (Potato Late Blight)"
              : preset.id === "corn_rust"
              ? "ചോളം തുരുമ്പ് രോഗം (Maize Common Rust)"
              : "ആരോഗ്യമുള്ള നെല്ലില (Healthy Rice Leaf)",
          crop: preset.crop,
          confidence: preset.confidence,
          severity: preset.severity,
          symptoms:
            preset.id === "early_blight"
              ? ["ഇലകളിൽ തവിട്ടുനിറത്തിലുള്ള കേന്ദ്രീകൃത വളയങ്ങൾ", "പുള്ളികൾക്ക് ചുറ്റും മഞ്ഞ വലയം", "താഴത്തെ ഇലകൾ ഉണങ്ങിപ്പോകുന്നു"]
              : preset.symptoms,
          explanation:
            preset.id === "early_blight"
              ? "ആൾട്ടർനേരിയ സൊളാനി എന്ന കുമിൾ ബാധയാണ് ഇതിന് കാരണം. ചൂടും ഈർപ്പവുമുള്ള കാലാവസ്ഥയിൽ താഴത്തെ ഇലകളിൽ വട്ടത്തിൽ പാടുകൾ പ്രത്യക്ഷപ്പെടുന്നു."
              : preset.explanation,
          recommended_action:
            preset.id === "early_blight"
              ? "രോഗം ബാധിച്ച താഴത്തെ ഇലകൾ നുള്ളി നശിപ്പിക്കുക. കോപ്പർ ഓക്സിക്ലോറൈഡ് അല്ലെങ്കിൽ ട്രൈക്കോഡെർമ തളിക്കുക."
              : preset.recommended_action,
          low_cost_option:
            preset.id === "early_blight"
              ? "1:10 എന്ന അനുപാതത്തിൽ പുളിച്ച മോര് അല്ലെങ്കിൽ ബേക്കിംഗ് സോഡ ലായനി ഇലകളിൽ തളിക്കുക."
              : preset.low_cost_option,
          prevention:
            preset.id === "early_blight"
              ? "മണ്ണിൽ നിന്ന് കുമിൾ ഇലകളിലേക്ക് തെറിക്കാതിരിക്കാൻ ഉണങ്ങിയ വൈക്കോൽ കൊണ്ട് പുതയിടുക."
              : preset.prevention,
          isDemoFallback: true,
        }
      : {
          disease: preset.disease,
          crop: preset.crop,
          confidence: preset.confidence,
          severity: preset.severity,
          symptoms: preset.symptoms,
          explanation: preset.explanation,
          recommended_action: preset.recommended_action,
          low_cost_option: preset.low_cost_option,
          prevention: preset.prevention,
          isDemoFallback: true,
        };

    setDiagnosis(presetDiagnosis);
    setError(null);

    const voiceText = isMl
      ? `${preset.crop} വിളയിലെ പരിശോധനാ ഫലം: ${presetDiagnosis.disease}. രോഗ തീവ്രത: ${presetDiagnosis.severity}. പരിഹാരം: ${presetDiagnosis.recommended_action}`
      : `Diagnosis for ${preset.crop}: ${preset.disease}. Severity is ${preset.severity}. ${preset.recommended_action}`;
    onStartSpeaking(voiceText);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-emerald-900/40 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 p-5 shadow-xl sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📷</span>
              <h2 className="font-outfit text-lg font-bold text-white sm:text-xl">
                AI Leaf Disease & Pathology Diagnosis
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Inspect leaf discoloration, fungal spots, blights, and viral curls using Gemini Vision AI. Get immediate remedies, low-cost organic alternatives, and spoken advice in your chosen language.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3 py-1.5 text-xs text-emerald-300">
            <span>Diagnosing for:</span>
            <strong className="text-white">{selectedCrop.name}</strong>
          </div>
        </div>
      </div>

      {/* Preset Samples Bar for Instant Testing */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Instant Demo Presets (Click to Inspect)</span>
          </div>
          <span className="text-[11px] text-slate-400">One-click live testing</span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SAMPLE_LEAF_PRESETS.map((preset) => (
            <button
              key={preset.id}
              id={`preset-leaf-${preset.id}`}
              onClick={() => handleSelectPreset(preset)}
              className="group relative flex flex-col items-start rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-left transition-all hover:border-emerald-500/50 hover:bg-slate-800/80"
            >
              <div className="relative h-24 w-full overflow-hidden rounded-lg bg-slate-900">
                <img
                  src={preset.sampleImage}
                  alt={preset.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <span
                  className={`absolute bottom-1.5 right-1.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    preset.severity === "None (Healthy)"
                      ? "bg-emerald-950/90 text-emerald-300 border border-emerald-500/40"
                      : "bg-rose-950/90 text-rose-300 border border-rose-500/40"
                  }`}
                >
                  {preset.severity}
                </span>
              </div>
              <span className="mt-2 font-semibold text-white text-xs truncate w-full">
                {preset.title}
              </span>
              <span className="text-[10px] text-slate-400 truncate w-full">
                {preset.disease}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Upload / Camera & Inspection Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Input upload/camera */}
        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
            <h3 className="font-outfit text-sm font-bold text-white">
              Upload or Snap Leaf Photo
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ensure the affected leaf area is in focus and well-lit.
            </p>

            {/* Camera Viewfinder */}
            {isCameraActive ? (
              <div className="relative mt-4 overflow-hidden rounded-xl border border-emerald-500/40 bg-black">
                <video ref={videoRef} autoPlay playsInline className="h-64 w-full object-cover" />
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                  <button
                    id="capture-photo-btn"
                    onClick={captureCameraPhoto}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-emerald-500"
                  >
                    <Camera className="h-4 w-4" />
                    Capture Photo
                  </button>
                  <button
                    id="cancel-camera-btn"
                    onClick={stopCamera}
                    className="rounded-xl bg-slate-800/90 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : selectedImage ? (
              /* Image Preview */
              <div className="relative mt-4 overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
                <img
                  src={selectedImage}
                  alt="Selected Leaf"
                  className="h-64 w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {fileInfo && (
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between rounded-lg bg-black/80 px-3 py-1.5 text-[11px] text-slate-200 backdrop-blur-sm border border-slate-700/60">
                    <span className="truncate max-w-[200px] sm:max-w-[260px] font-mono">{fileInfo.name}</span>
                    <span className="font-semibold text-emerald-400 shrink-0 ml-2">
                      {fileInfo.sizeFormatted} <span className="text-slate-400 font-normal">/ 200MB max</span>
                    </span>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    id="change-image-btn"
                    onClick={() => {
                      setSelectedImage(null);
                      setDiagnosis(null);
                      setFileInfo(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="rounded-lg bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm hover:bg-black"
                  >
                    Change Image
                  </button>
                </div>
              </div>
            ) : (
              /* Dropzone */
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`mt-4 flex h-60 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                  isDragging
                    ? "border-emerald-400 bg-emerald-950/40 scale-[1.01]"
                    : "border-emerald-500/30 bg-emerald-950/10 hover:border-emerald-500/60 hover:bg-emerald-950/20"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 mb-3">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold text-slate-200">
                  Click to browse or drag & drop leaf image
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports JPG, PNG, WEBP (Max 200MB per file)
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-300">
                  <span>High-capacity upload: up to 200MB per file</span>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              id="leaf-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Action Buttons */}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {!isCameraActive && (
                <button
                  id="open-camera-btn"
                  onClick={startCamera}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-700"
                >
                  <Camera className="h-4 w-4 text-emerald-400" />
                  Take Live Photo
                </button>
              )}

              <button
                id="analyze-leaf-submit-btn"
                onClick={analyzeLeaf}
                disabled={!selectedImage || isAnalyzing}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950 transition-all hover:from-emerald-500 hover:to-green-500 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Analyzing with Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-emerald-200" />
                    Inspect Leaf Health
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Diagnosis Results Card */}
        <div className="lg:col-span-7">
          {diagnosis ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl space-y-5">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                        diagnosis.severity === "None (Healthy)"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                          : diagnosis.severity === "Critical" || diagnosis.severity === "High"
                          ? "bg-rose-950 text-rose-400 border border-rose-500/30"
                          : "bg-amber-950 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {diagnosis.severity} Severity
                    </span>
                    <span className="text-xs text-slate-400">
                      AI Confidence: <strong className="text-white">{diagnosis.confidence}</strong>
                    </span>
                  </div>
                  <h3 className="mt-1 font-outfit text-xl font-bold text-white">
                    {diagnosis.disease}
                  </h3>
                </div>

                {/* Hear button */}
                <button
                  id="speak-leaf-diagnosis-btn"
                  onClick={() => {
                    if (isSpeaking) {
                      onStopSpeaking();
                    } else {
                      const voiceText =
                        selectedLanguage === "ml"
                          ? `${diagnosis.crop} വിളയിലെ പരിശോധനാ ഫലം: ${diagnosis.disease}. രോഗ തീവ്രത: ${diagnosis.severity}. ശുപാർശ ചെയ്യുന്ന പരിഹാരം: ${diagnosis.recommended_action}.${diagnosis.low_cost_option ? ` കുറഞ്ഞ ചെലവിലുള്ള പ്രതിവിധി: ${diagnosis.low_cost_option}` : ""}`
                          : `Diagnosis for ${diagnosis.crop}: ${diagnosis.disease}. Severity is ${diagnosis.severity}. Recommended action: ${diagnosis.recommended_action}. Low-cost option: ${diagnosis.low_cost_option}`;
                      onStartSpeaking(voiceText);
                    }
                  }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    isSpeaking
                      ? "bg-rose-600 text-white hover:bg-rose-500"
                      : "bg-emerald-600 text-white hover:bg-emerald-500"
                  }`}
                >
                  <Volume2 className={`h-4 w-4 ${isSpeaking ? "animate-pulse" : ""}`} />
                  <span>{isSpeaking ? "Stop Voice" : `Hear Advice in ${selectedLanguageName}`}</span>
                </button>
              </div>

              {/* Observed Symptoms */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  <Eye className="h-4 w-4 text-emerald-400" />
                  <span>Observed Symptoms</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {diagnosis.symptoms.map((symptom, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg border border-slate-700/80 bg-slate-950/70 px-3 py-1.5 text-xs text-slate-200"
                    >
                      • {symptom}
                    </span>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Pathology Explanation:
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {diagnosis.explanation}
                </p>
              </div>

              {/* 3 Solutions */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider">
                    <Lightbulb className="h-4 w-4" />
                    <span>Immediate Action</span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-200 leading-relaxed">
                    {diagnosis.recommended_action}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <DollarSign className="h-4 w-4" />
                    <span>Low-Cost Option</span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-200 leading-relaxed">
                    {diagnosis.low_cost_option}
                  </p>
                </div>

                <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-wider">
                    <Shield className="h-4 w-4" />
                    <span>Prevention</span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-200 leading-relaxed">
                    {diagnosis.prevention}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
              <div className="text-4xl mb-3">🍃</div>
              <h4 className="font-outfit text-base font-bold text-slate-200">
                Ready for Leaf Pathology Inspection
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Select an image above or click one of the instant demo presets to see Gemini identify crop leaf diseases, severity levels, and low-cost remedies.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
