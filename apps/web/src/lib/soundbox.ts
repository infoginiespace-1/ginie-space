// Global In-App Voice Soundbox Service for GinieSpace
// Emulates physical payment soundbox (Paytm / PhonePe style) on merchant device

export interface SoundboxSettings {
  enabled: boolean;
  language: "hi" | "en";
  volume: number; // 0.1 to 1.0
  announceAmount: boolean;
}

const STORAGE_KEY = "giniespace_soundbox_settings";

export const getSoundboxSettings = (): SoundboxSettings => {
  if (typeof window === "undefined") {
    return { enabled: true, language: "hi", volume: 1.0, announceAmount: true };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { enabled: true, language: "hi", volume: 1.0, announceAmount: true };
};

export const saveSoundboxSettings = (settings: SoundboxSettings): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
};

// Pure Web Audio API Synthesizer (Works 100% offline with zero external audio assets)
export const playSoundboxChime = (volume = 0.8): void => {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Bright Victory Chord)

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.25 * volume, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.38);
    });
  } catch {
    // Non-fatal audio fallback
  }
};

// Web Speech Synthesis Engine for voice announcements
export const speakSoundboxMessage = (text: string, lang: "hi" | "en" = "hi", volume = 1.0): void => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = Math.max(0.1, Math.min(1.0, volume));
    utterance.rate = 0.95; // Slightly slower for crisp retail clarity
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    if (lang === "hi") {
      utterance.lang = "hi-IN";
      const hindiVoice = voices.find(
        (v) => v.lang.includes("hi") || v.name.toLowerCase().includes("hindi") || v.name.toLowerCase().includes("india")
      );
      if (hindiVoice) utterance.voice = hindiVoice;
    } else {
      utterance.lang = "en-IN";
      const indianEngVoice = voices.find((v) => v.lang === "en-IN" || v.name.includes("India"));
      if (indianEngVoice) utterance.voice = indianEngVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch {
    // Non-fatal voice fallback
  }
};

// High-level Soundbox Announcement for new order or payment
export const announceOrderSoundbox = (amount: number, orderId?: string): void => {
  const settings = getSoundboxSettings();
  if (!settings.enabled) return;

  // 1. Play signature melodious payment chime
  playSoundboxChime(settings.volume);

  // 2. Delay voice slightly so chime finishes cleanly
  setTimeout(() => {
    let announcement = "";
    if (settings.language === "hi") {
      if (amount > 0 && settings.announceAmount) {
        announcement = `गिनीस्पेस पर नया ऑर्डर प्राप्त हुआ। कुल राशि ${Math.round(amount)} रुपये।`;
      } else {
        announcement = "गिनीस्पेस पर नया ऑर्डर प्राप्त हुआ है।";
      }
    } else {
      if (amount > 0 && settings.announceAmount) {
        announcement = `New order received on GinieSpace. Total amount ${Math.round(amount)} rupees.`;
      } else {
        announcement = "New order received on GinieSpace.";
      }
    }
    speakSoundboxMessage(announcement, settings.language, settings.volume);
  }, 380);
};

// Announcement for payment received confirmation
export const announcePaymentSoundbox = (amount: number): void => {
  const settings = getSoundboxSettings();
  if (!settings.enabled) return;

  playSoundboxChime(settings.volume);

  setTimeout(() => {
    let announcement = "";
    if (settings.language === "hi") {
      announcement = `गिनीस्पेस पर ${Math.round(amount)} रुपये का भुगतान प्राप्त हुआ।`;
    } else {
      announcement = `Payment of ${Math.round(amount)} rupees received on GinieSpace.`;
    }
    speakSoundboxMessage(announcement, settings.language, settings.volume);
  }, 380);
};
