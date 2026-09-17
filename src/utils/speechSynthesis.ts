import { LanguageOption } from "../types";

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", speechCode: "en-US", flag: "🇬🇧" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", speechCode: "hi-IN", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", speechCode: "ml-IN", flag: "🌴" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", speechCode: "ta-IN", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", speechCode: "te-IN", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", speechCode: "kn-IN", flag: "🇮🇳" },
  { code: "es", name: "Spanish", nativeName: "Español", speechCode: "es-ES", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", speechCode: "fr-FR", flag: "🇫🇷" },
];

export class VoiceAssistant {
  private static synth: SpeechSynthesis | null = typeof window !== "undefined" ? window.speechSynthesis : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;
  private static currentAudio: HTMLAudioElement | null = null;
  private static activeAbortController: AbortController | null = null;
  private static onStateChange: ((isSpeaking: boolean, isPaused: boolean) => void) | null = null;
  private static isAudioPaused: boolean = false;

  public static setCallback(cb: (isSpeaking: boolean, isPaused: boolean) => void) {
    this.onStateChange = cb;
  }

  public static isSupported(): boolean {
    return true;
  }

  public static async speak(
    text: string,
    languageCode: string = "en",
    rate: number = 0.95,
    pitch: number = 1.0
  ) {
    // Cancel any previous speaking or ongoing network audio fetch
    this.stop();

    if (!text || !text.trim()) return;

    // Immediately signal start
    if (this.onStateChange) this.onStateChange(true, false);

    // Prefer server-side native TTS for Malayalam, Tamil, Telugu, Kannada, Hindi
    // because standard desktop and mobile browsers lack native voice packs for Malayalam and South Asian scripts.
    const isIndicOrNonStandard = ["ml", "ta", "te", "kn", "hi"].includes(languageCode);

    if (isIndicOrNonStandard || typeof window === "undefined" || !this.synth) {
      try {
        const controller = new AbortController();
        this.activeAbortController = controller;

        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, lang: languageCode }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Server TTS endpoint returned status ${res.status}`);
        }

        const data = await res.json();
        if (data.audioData) {
          const audio = new Audio(data.audioData);
          audio.playbackRate = rate || 1.0;

          audio.onplay = () => {
            this.isAudioPaused = false;
            if (this.onStateChange) this.onStateChange(true, false);
          };

          audio.onpause = () => {
            if (this.isAudioPaused && this.onStateChange) {
              this.onStateChange(true, true);
            }
          };

          audio.onended = () => {
            this.currentAudio = null;
            this.isAudioPaused = false;
            if (this.onStateChange) this.onStateChange(false, false);
          };

          audio.onerror = (e) => {
            console.warn("[VoiceAssistant] Server audio playback failed, falling back to Web Speech:", e);
            this.currentAudio = null;
            this.speakWithBrowserSynth(text, languageCode, rate, pitch);
          };

          this.currentAudio = audio;
          await audio.play();
          return;
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          return; // Cancelled intentionally
        }
        console.warn("[VoiceAssistant] Server TTS request failed, attempting browser synth:", err);
      }
    }

    // Fallback to browser SpeechSynthesis API
    this.speakWithBrowserSynth(text, languageCode, rate, pitch);
  }

  private static speakWithBrowserSynth(
    text: string,
    languageCode: string = "en",
    rate: number = 0.95,
    pitch: number = 1.0
  ) {
    if (!this.synth) {
      console.warn("Speech synthesis is not available in this browser environment.");
      if (this.onStateChange) this.onStateChange(false, false);
      return;
    }

    const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === languageCode) || SUPPORTED_LANGUAGES[0];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langConfig.speechCode;
    utterance.rate = rate;
    utterance.pitch = pitch;

    const voices = this.synth.getVoices();
    const matchingVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith(langConfig.speechCode.toLowerCase()) ||
             v.lang.toLowerCase().startsWith(langConfig.code.toLowerCase())
    );
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      if (this.onStateChange) this.onStateChange(true, false);
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      if (this.onStateChange) this.onStateChange(false, false);
    };

    utterance.onerror = (e) => {
      console.error("SpeechSynthesis error:", e);
      this.currentUtterance = null;
      if (this.onStateChange) this.onStateChange(false, false);
    };

    utterance.onpause = () => {
      if (this.onStateChange) this.onStateChange(true, true);
    };

    utterance.onresume = () => {
      if (this.onStateChange) this.onStateChange(true, false);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public static pause() {
    this.isAudioPaused = true;
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
    }
    if (this.synth && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
    if (this.onStateChange) this.onStateChange(true, true);
  }

  public static resume() {
    this.isAudioPaused = false;
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play().catch((e) => console.error("Audio resume error:", e));
    }
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
    if (this.onStateChange) this.onStateChange(true, false);
  }

  public static stop() {
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
    this.isAudioPaused = false;
    if (this.onStateChange) this.onStateChange(false, false);
  }

  public static isSpeaking(): boolean {
    const isAudioPlaying = Boolean(this.currentAudio && !this.currentAudio.paused && !this.currentAudio.ended);
    const isSynthPlaying = Boolean(this.synth && this.synth.speaking && !this.synth.paused);
    return isAudioPlaying || isSynthPlaying;
  }
}
