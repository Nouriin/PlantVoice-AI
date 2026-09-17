import React, { useState, useMemo } from "react";
import { CropData, CropCategory } from "../types";
import { CROPS_DATABASE, CROP_CATEGORIES, searchCrops } from "../data/cropsDatabase";
import { Search, X, Sparkles, Sprout, Info, Droplets, Thermometer, Wind, Check, ChevronRight, Loader2 } from "lucide-react";

interface CropSearchBarProps {
  selectedCrop: CropData;
  onSelectCrop: (crop: CropData) => void;
  allCrops: CropData[];
  onAddCustomCrop?: (crop: CropData) => void;
}

export const CropSearchBar: React.FC<CropSearchBarProps> = ({
  selectedCrop,
  onSelectCrop,
  allCrops,
  onAddCustomCrop,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Filter crops using current database + any custom added crops
  const filteredCrops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allCrops.filter((crop) => {
      const matchCat = activeCategory === "All" || crop.category === activeCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        crop.name.toLowerCase().includes(q) ||
        crop.scientificName.toLowerCase().includes(q) ||
        crop.category.toLowerCase().includes(q) ||
        crop.vulnerabilities.some((v) => v.toLowerCase().includes(q)) ||
        crop.commonDiseases.some((d) => d.toLowerCase().includes(q))
      );
    });
  }, [allCrops, searchQuery, activeCategory]);

  const handleSelect = (crop: CropData) => {
    onSelectCrop(crop);
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  // AI crop generator for any crop worldwide
  const handleGenerateCustomCrop = async () => {
    if (!searchQuery.trim()) return;
    setIsAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch("/api/crop-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cropQuery: searchQuery.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate crop parameters from agronomic AI.");
      }

      const data = await res.json();

      const newCrop: CropData = {
        id: `custom-${Date.now()}`,
        name: data.name || searchQuery.trim(),
        scientificName: data.scientificName || "Botanical Cultivar",
        category: (data.category as CropCategory) || "Vegetables",
        optimalMoisture: data.optimalMoisture || { min: 45, max: 75, ideal: 60 },
        optimalTemp: data.optimalTemp || { min: 18, max: 30, ideal: 24 },
        optimalHumidity: data.optimalHumidity || { min: 50, max: 75, ideal: 62 },
        optimalPh: data.optimalPh || "6.0 - 7.0",
        growthDurationDays: data.growthDurationDays || "90 - 120 days",
        vulnerabilities: data.vulnerabilities || ["Water deficit during flowering", "Fungal disease in high humidity"],
        commonDiseases: data.commonDiseases || ["Blight", "Leaf Spot", "Powdery Mildew"],
        quickTip: data.quickTip || "Maintain balanced soil moisture and inspect weekly.",
        emoji: "🌿",
        description: `Custom AI-profiled crop: ${data.name || searchQuery.trim()}`,
        isCustom: true,
      };

      if (onAddCustomCrop) {
        onAddCustomCrop(newCrop);
      }
      onSelectCrop(newCrop);
      setIsDropdownOpen(false);
      setSearchQuery("");
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Failed to profile crop. Please check server connection.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="relative w-full">
      {/* Search Bar Container */}
      <div className="rounded-2xl border border-emerald-900/40 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-4 shadow-xl sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-emerald-400" />
              <h2 className="font-outfit text-base font-bold text-white sm:text-lg">
                Universal Crop Agronomy Search
              </h2>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                {allCrops.length}+ Crops Available
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Search any agricultural or horticultural crop to calibrate the real-time sensor stress thresholds.
            </p>
          </div>

          {/* Current Selection summary badge */}
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3.5 py-2">
            <span className="text-2xl">{selectedCrop.emoji}</span>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                Active Crop Baseline
              </div>
              <div className="font-outfit text-sm font-bold text-white">
                {selectedCrop.name}{" "}
                <span className="text-xs font-normal text-slate-400 italic">
                  ({selectedCrop.scientificName})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <div className="relative mt-3.5">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-emerald-400" />
            <input
              id="crop-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Search by crop name (e.g., Rice, Tomato, Coffee, Cotton, Cardamom, Mango)..."
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950 py-3 pl-10 pr-24 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            {searchQuery && (
              <button
                id="clear-crop-search-btn"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[11px] font-medium text-slate-400 shrink-0 mr-1">Categories:</span>
            {CROP_CATEGORIES.map((cat) => (
              <button
                key={cat}
                id={`cat-chip-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => {
                  setActiveCategory(cat);
                  setIsDropdownOpen(true);
                }}
                className={`shrink-0 rounded-lg px-2.5 py-1 font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Results Dropdown / Modal List */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[380px] overflow-y-auto rounded-xl border border-slate-700/80 bg-slate-900 p-2 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between px-2 py-1.5 text-xs text-slate-400">
                <span>
                  Showing {filteredCrops.length} {filteredCrops.length === 1 ? "crop" : "crops"} matching{" "}
                  {searchQuery ? `"${searchQuery}"` : activeCategory}
                </span>
                <button
                  onClick={() => setIsDropdownOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  Close ✕
                </button>
              </div>

              {filteredCrops.length > 0 ? (
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 md:grid-cols-3">
                  {filteredCrops.map((crop) => {
                    const isSelected = selectedCrop.id === crop.id;
                    return (
                      <button
                        key={crop.id}
                        id={`select-crop-${crop.id}`}
                        onClick={() => handleSelect(crop)}
                        className={`flex items-start gap-3 rounded-xl p-2.5 text-left transition-all ${
                          isSelected
                            ? "border border-emerald-500/60 bg-emerald-950/40 text-white"
                            : "border border-transparent bg-slate-950/60 text-slate-300 hover:border-emerald-800/40 hover:bg-slate-800/90"
                        }`}
                      >
                        <span className="text-2xl shrink-0 mt-0.5">{crop.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-white text-xs truncate">
                              {crop.name}
                            </span>
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 italic truncate">
                            {crop.scientificName}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                            <span className="rounded bg-slate-800 px-1.5 py-0.2 text-emerald-300">
                              💧 {crop.optimalMoisture.ideal}%
                            </span>
                            <span className="rounded bg-slate-800 px-1.5 py-0.2 text-amber-300">
                              🌡️ {crop.optimalTemp.ideal}°C
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-slate-300">
                    No predefined crop found matching "<span className="text-white font-medium">{searchQuery}</span>".
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    PlantVoice AI can automatically generate an accurate agronomic profile (ideal moisture, temperature, pH, vulnerabilities, and diseases) for any crop in the world.
                  </p>

                  <button
                    id="ai-generate-crop-btn"
                    onClick={handleGenerateCustomCrop}
                    disabled={isAiLoading || !searchQuery.trim()}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-950/60 transition-all hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
                  >
                    {isAiLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating Agronomic Profile for "{searchQuery}"...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-emerald-200" />
                        Search & Profile "{searchQuery}" with AI
                      </>
                    )}
                  </button>

                  {aiError && (
                    <p className="text-xs text-rose-400 mt-2">{aiError}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Crop Agronomic Detail Strip */}
        <div className="mt-4 rounded-xl border border-emerald-900/30 bg-slate-950/70 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedCrop.emoji}</span>
              <div>
                <span className="font-semibold text-white text-sm">
                  {selectedCrop.name}
                </span>
                <span className="ml-2 text-xs text-slate-400 italic">
                  {selectedCrop.scientificName}
                </span>
                <span className="ml-2 rounded-md bg-emerald-950/80 border border-emerald-800/50 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                  {selectedCrop.category}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">
                Duration: <strong className="text-slate-200">{selectedCrop.growthDurationDays}</strong>
              </span>
              <span className="text-slate-400">
                Soil pH: <strong className="text-slate-200">{selectedCrop.optimalPh}</strong>
              </span>
            </div>
          </div>

          {/* Agronomic Target Envelope */}
          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="flex items-center gap-2.5 rounded-lg border border-slate-800/60 bg-slate-900/50 p-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Droplets className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">
                  Target Soil Moisture
                </div>
                <div className="text-xs font-bold text-white">
                  {selectedCrop.optimalMoisture.min}% - {selectedCrop.optimalMoisture.max}%{" "}
                  <span className="text-emerald-400 font-normal">
                    (Ideal: {selectedCrop.optimalMoisture.ideal}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-lg border border-slate-800/60 bg-slate-900/50 p-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <Thermometer className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">
                  Target Temperature
                </div>
                <div className="text-xs font-bold text-white">
                  {selectedCrop.optimalTemp.min}°C - {selectedCrop.optimalTemp.max}°C{" "}
                  <span className="text-emerald-400 font-normal">
                    (Ideal: {selectedCrop.optimalTemp.ideal}°C)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-lg border border-slate-800/60 bg-slate-900/50 p-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
                <Wind className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">
                  Target Humidity
                </div>
                <div className="text-xs font-bold text-white">
                  {selectedCrop.optimalHumidity.min}% - {selectedCrop.optimalHumidity.max}%{" "}
                  <span className="text-emerald-400 font-normal">
                    (Ideal: {selectedCrop.optimalHumidity.ideal}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2.5 flex items-start gap-2 text-xs text-slate-300">
            <span className="font-semibold text-emerald-400 shrink-0">💡 Agronomist Tip:</span>
            <span className="text-slate-300">{selectedCrop.quickTip}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
