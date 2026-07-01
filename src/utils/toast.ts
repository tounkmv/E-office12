import React from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  duration?: number;
}

// Audio synthesizer for gentle alert tones
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
  } catch (e) {
    console.warn("Web Audio API not supported", e);
    return null;
  }
}

export function playNotificationSound(type: ToastType) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    const now = ctx.currentTime;
    
    if (type === "success") {
      // Gentle sweet double upward chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.12); // A5
      
      gain1.gain.setValueAtTime(0.06, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(698.46, now + 0.08); // F5
      osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.22); // C6
      
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.06, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.35);
    } 
    else if (type === "error") {
      // Gentle error tone - minor chord or dual warning buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220.00, now); // A3
      osc.frequency.linearRampToValueAtTime(180.00, now + 0.28);
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } 
    else if (type === "warning") {
      // Warm medium alert chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440.00, now); // A4
      osc.frequency.exponentialRampToValueAtTime(349.23, now + 0.2); // F4
      
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } 
    else {
      // Info: Soft bubble pop / drop tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(493.88, now); // B4
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.1); // G5
      
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (e) {
    console.warn("Failed to play notification sound", e);
  }
}

// Global Custom Event Dispatcher for Toast Alerts
export function showSystemToast(message: string, type: ToastType = "success", title?: string, duration = 4000) {
  const event = new CustomEvent("system-alert-toast", {
    detail: {
      id: "toast_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      message,
      type,
      title,
      duration
    } as ToastMessage
  });
  window.dispatchEvent(event);
  
  // Play the sound chime automatically
  playNotificationSound(type);
}
