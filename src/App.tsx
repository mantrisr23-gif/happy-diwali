import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Gift,
  Share2,
  Copy,
  Check,
  Wand2,
  Eye,
  EyeOff,
  Flame,
  Trash2,
  Sliders,
  X,
  Heart,
  Send,
  Crown,
  ChevronUp,
  ChevronDown,
  Stars
} from 'lucide-react';

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================
type CrackerType = 'rocket' | 'anar' | 'chakri' | 'phuljhadi' | 'bomb';
type IntensityLevel = 'low' | 'medium' | 'high';
type CelebrationMode = 'auto' | 'manual' | 'finale';
type BurstPattern = 'auto' | 'chrysanthemum' | 'willow' | 'heart' | 'ring';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  size: number;
  gravity: number;
  drag: number;
  trail: { x: number; y: number }[];
  maxTrail: number;
  flicker: boolean;
  sparkleType?: 'needle' | 'orb' | 'ring' | 'crackle' | 'willow';
  secondaryBurst?: boolean;
}

interface RocketEntity {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  color: string;
  trail: { x: number; y: number }[];
  isBomb: boolean;
  pattern: BurstPattern;
}

interface AnarEntity {
  id: number;
  x: number;
  y: number;
  elapsed: number;
  duration: number;
  hue: number;
}

interface ChakriEntity {
  id: number;
  x: number;
  y: number;
  angle: number;
  angularVelocity: number;
  elapsed: number;
  duration: number;
  colors: string[];
}

interface ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

interface SkyTextBanner {
  text: string;
  x: number;
  y: number;
  alpha: number;
  elapsed: number;
  duration: number;
}

interface FloatingPetal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  color: string;
  alpha: number;
}

// ==========================================
// 2. UPGRADED WEB AUDIO SYNTHESIZER
//    (With DynamicsCompressor & Polyphony Cap)
// ==========================================
class DiwaliSoundEngine {
  private ctx: AudioContext | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  public isMuted: boolean = false;
  private isPlayingAmbient: boolean = false;
  private ambientInterval: number | null = null;
  private activeVoices: number = 0;
  private readonly MAX_VOICES = 14;
  private lastSizzleTime: number = 0;

  public init() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(24, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private getOutputNode(): AudioNode | null {
    if (!this.ctx) return null;
    return this.compressor || this.ctx.destination;
  }

  private canSpawnVoice(): boolean {
    if (this.isMuted) return false;
    return this.activeVoices < this.MAX_VOICES;
  }

  private trackVoice(durationSec: number) {
    this.activeVoices++;
    setTimeout(() => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
    }, Math.max(50, durationSec * 1000));
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0.0001 : 0.85, this.ctx.currentTime, 0.05);
    }
    if (muted) {
      this.stopAmbientMusic();
    } else {
      this.startAmbientMusic();
    }
  }

  public startAmbientMusic() {
    if (this.isMuted || this.isPlayingAmbient) return;
    this.init();
    if (!this.ctx) return;
    this.isPlayingAmbient = true;

    // Raga Yaman / Desh auspicious scale frequencies
    const scale = [261.63, 293.66, 329.63, 370.0, 392.0, 440.0, 493.88, 523.25, 587.33, 659.25];

    const playSitarPluck = (freq: number, duration = 2.4, volume = 0.038) => {
      if (!this.ctx || this.isMuted || document.hidden) return;
      const out = this.getOutputNode();
      if (!out) return;

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 1.5, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 5.5, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.2, now + duration);
      filter.Q.value = 3.2;

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(out);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
    };

    playSitarPluck(261.63, 3.2, 0.045);
    setTimeout(() => playSitarPluck(329.63, 2.8, 0.035), 240);
    setTimeout(() => playSitarPluck(392.0, 3.2, 0.035), 480);

    this.ambientInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx || document.hidden) return;
      const note = scale[Math.floor(Math.random() * scale.length)];
      playSitarPluck(note, 2.1 + Math.random() * 1.1, 0.032);
      if (Math.random() > 0.58) {
        setTimeout(() => playSitarPluck(130.81, 3.8, 0.025), 380);
      }
    }, 1500);
  }

  public stopAmbientMusic() {
    this.isPlayingAmbient = false;
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }

  public playAuspiciousChime() {
    if (!this.canSpawnVoice()) return;
    this.init();
    if (!this.ctx) return;
    const out = this.getOutputNode();
    if (!out) return;

    this.trackVoice(1.8);
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.065, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 1.6);
    });
  }

  public playGrandFinaleFanfare() {
    if (!this.canSpawnVoice()) return;
    this.init();
    if (!this.ctx) return;
    const out = this.getOutputNode();
    if (!out) return;

    this.trackVoice(2.4);
    const chord = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    chord.forEach((freq, idx) => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 2.2);
    });
  }

  public playRocketWhistle() {
    if (!this.canSpawnVoice()) return;
    this.init();
    if (!this.ctx) return;
    const out = this.getOutputNode();
    if (!out) return;

    this.trackVoice(0.45);
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(360 + Math.random() * 140, now);
    osc.frequency.exponentialRampToValueAtTime(1350 + Math.random() * 320, now + 0.42);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.038, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.44);

    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  public playExplosion(isHeavyBomb = false) {
    if (!this.canSpawnVoice()) return;
    this.init();
    if (!this.ctx) return;
    const out = this.getOutputNode();
    if (!out) return;

    const duration = isHeavyBomb ? 1.25 : 0.75;
    this.trackVoice(duration);
    const now = this.ctx.currentTime;

    // 1. Sub-bass thud with natural pitch variation
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    const startFreq = (isHeavyBomb ? 105 : 145) + (Math.random() - 0.5) * 25;
    subOsc.frequency.setValueAtTime(startFreq, now);
    subOsc.frequency.exponentialRampToValueAtTime(26, now + (isHeavyBomb ? 0.55 : 0.32));

    subGain.gain.setValueAtTime(isHeavyBomb ? 0.28 : 0.16, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + (isHeavyBomb ? 0.6 : 0.36));

    subOsc.connect(subGain);
    subGain.connect(out);
    subOsc.start(now);
    subOsc.stop(now + 0.62);

    // 2. Filtered noise crackle burst
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    const decayRate = this.ctx.sampleRate * (isHeavyBomb ? 0.32 : 0.18);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / decayRate);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime((isHeavyBomb ? 620 : 1050) + (Math.random() - 0.5) * 200, now);
    filter.Q.value = 0.85;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isHeavyBomb ? 0.24 : 0.14, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(out);
    noise.start(now);
  }

  public playSparkleSizzle(duration = 0.2, pitch = 3400) {
    const nowPerf = performance.now();
    if (nowPerf - this.lastSizzleTime < 75) return; // Throttle overlapping sizzles
    if (!this.canSpawnVoice()) return;
    this.lastSizzleTime = nowPerf;

    this.init();
    if (!this.ctx) return;
    const out = this.getOutputNode();
    if (!out) return;

    this.trackVoice(duration);
    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.38));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(pitch, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.032, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    noise.start(now);
  }
}

const soundEngine = new DiwaliSoundEngine();

// ==========================================
// 3. COLOR PALETTES & FESTIVE CONSTANTS
// ==========================================
const DIWALI_PALETTES = [
  ['#F5D061', '#F59E0B', '#FFFBEB', '#D97706'], // Royal Champagne Gold
  ['#FF2E93', '#FF8E53', '#FFD700', '#FF5E7E'], // Rani Pink & Marigold
  ['#00F5D4', '#00BBF9', '#FEE440', '#F15BB5'], // Peacock Teal & Jewel
  ['#A855F7', '#EC4899', '#FBBF24', '#F3E8FF'], // Royal Amethyst & Gold
  ['#10B981', '#34D399', '#FBBF24', '#FEF08A'] // Panna Emerald & Gold
];

const CRACKER_OPTIONS: {
  id: CrackerType;
  name: string;
  shortName: string;
  hindiName: string;
  desc: string;
  color: string;
}[] = [
  {
    id: 'rocket',
    name: 'Sky Rocket',
    shortName: 'Rocket',
    hindiName: 'हवाई रॉकेट',
    desc: 'Tap the sky to launch soaring rockets with custom burst shapes',
    color: '#F59E0B'
  },
  {
    id: 'anar',
    name: 'Flower Pot',
    shortName: 'Anar',
    hindiName: 'अनार',
    desc: 'Tap to ignite a towering fountain of golden & silver sparks',
    color: '#F5D061'
  },
  {
    id: 'chakri',
    name: 'Chakri Spinner',
    shortName: 'Chakri',
    hindiName: 'चकरी',
    desc: 'Tap to spin a rapid ground wheel of neon & gold spirals',
    color: '#EC4899'
  },
  {
    id: 'phuljhadi',
    name: 'Phuljhadi',
    shortName: 'Sparkler',
    hindiName: 'फुलझड़ी',
    desc: 'Press & drag finger or cursor to wave a golden sparkler',
    color: '#FBBF24'
  },
  {
    id: 'bomb',
    name: 'Satrangi Bomb',
    shortName: 'Satrangi',
    hindiName: 'सतरंगी बम',
    desc: 'Tap the sky for a multi-ring royal aerial shockwave',
    color: '#A855F7'
  }
];

const BURST_PATTERNS: { id: BurstPattern; label: string }[] = [
  { id: 'auto', label: 'Royal Mix' },
  { id: 'chrysanthemum', label: 'Peony' },
  { id: 'willow', label: 'Gold Willow' },
  { id: 'heart', label: 'Heart ♥' },
  { id: 'ring', label: 'Saturn Ring' }
];

// Helper to sanitize recipient name from input or URL
function sanitizeRecipientName(raw: string | null): string {
  if (!raw) return '';
  return raw
    .replace(/[<>"'`\\/{}[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 32);
}

// ==========================================
// 4. DECORATIVE & INTERACTIVE ENVIRONMENT
// ==========================================

// Intricate Rotating SVG Rangoli Mandala
const AnimatedRangoli: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative flex items-center justify-center pointer-events-none select-none ${className}`}>
    <svg
      viewBox="0 0 240 240"
      className="w-full h-full animate-[spin_48s_linear_infinite] opacity-90 drop-shadow-[0_0_16px_rgba(245,158,11,0.5)]"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="rangoliGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="45%" stopColor="#F5D061" />
          <stop offset="80%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EC4899" />
        </radialGradient>
      </defs>
      {Array.from({ length: 12 }).map((_, i) => (
        <g key={`outer-${i}`} transform={`rotate(${i * 30} 120 120)`}>
          <path
            d="M120 10 C136 38, 144 65, 120 92 C96 65, 104 38, 120 10 Z"
            fill="rgba(245, 158, 11, 0.08)"
            stroke="url(#rangoliGrad)"
            strokeWidth="1.5"
            opacity="0.85"
          />
          <circle cx="120" cy="22" r="3" fill="#F5D061" />
        </g>
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={`mid-${i}`} transform={`rotate(${i * 45 + 15} 120 120)`}>
          <path
            d="M120 40 C132 66, 132 88, 120 108 C108 88, 108 66, 120 40 Z"
            fill="rgba(236, 72, 153, 0.14)"
            stroke="#F5D061"
            strokeWidth="1.4"
          />
          <circle cx="120" cy="56" r="2.2" fill="#EC4899" />
        </g>
      ))}
      <circle cx="120" cy="120" r="46" fill="none" stroke="#F5D061" strokeWidth="1.2" strokeDasharray="4 4" />
      <circle cx="120" cy="120" r="28" fill="rgba(245, 208, 97, 0.16)" stroke="#F59E0B" strokeWidth="1.5" />
      <circle cx="120" cy="120" r="9" fill="#F5D061" />
    </svg>
  </div>
);

// Interactive Glowing Golden Diya Component
const GlowingDiya: React.FC<{ intense?: boolean; size?: 'sm' | 'lg' }> = ({
  intense = false,
  size = 'lg'
}) => {
  const dimensions = size === 'lg' ? 'w-44 h-44 sm:w-60 sm:h-60' : 'w-11 h-11 sm:w-12 sm:h-12';
  return (
    <div className={`relative flex items-center justify-center ${dimensions}`}>
      <motion.div
        animate={{
          scale: intense ? [1, 2.8, 4.5] : [1, 1.14, 1],
          opacity: intense ? [0.8, 1, 0] : [0.45, 0.75, 0.45]
        }}
        transition={{
          duration: intense ? 1.1 : 2.6,
          repeat: intense ? 0 : Infinity,
          ease: 'easeInOut'
        }}
        className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/40 via-yellow-300/50 to-orange-500/40 blur-2xl pointer-events-none"
      />

      <svg
        viewBox="0 0 200 200"
        className="w-full h-full overflow-visible drop-shadow-[0_12px_28px_rgba(245,158,11,0.5)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="flameOuter" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="85%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>
          <linearGradient id="diyaBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5D061" />
            <stop offset="40%" stopColor="#D97706" />
            <stop offset="80%" stopColor="#92400E" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>
          <linearGradient id="diyaRim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#B45309" />
            <stop offset="50%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>

        <motion.circle
          cx="100"
          cy="68"
          r={intense ? 56 : 32}
          fill="url(#flameOuter)"
          opacity={0.25}
          animate={{
            r: intense ? [32, 70, 95] : [28, 36, 30],
            opacity: intense ? [0.4, 0.9, 0] : [0.2, 0.35, 0.2]
          }}
          transition={{ duration: intense ? 0.9 : 1.8, repeat: Infinity }}
        />

        <motion.g
          style={{ originX: '100px', originY: '105px' }}
          animate={
            intense
              ? { scale: [1, 2.2, 3.5], y: [0, -15, -30] }
              : {
                  scaleY: [1, 1.09, 0.96, 1.05, 1],
                  scaleX: [1, 0.95, 1.04, 0.98, 1],
                  rotate: [0, -2.5, 2.5, -1, 0]
                }
          }
          transition={{
            duration: intense ? 0.9 : 1.6,
            repeat: intense ? 0 : Infinity,
            ease: 'easeInOut'
          }}
        >
          <path d="M100 22 C118 52, 126 78, 100 105 C74 78, 82 52, 100 22 Z" fill="url(#flameOuter)" />
          <path d="M100 48 C110 68, 112 85, 100 102 C88 85, 90 68, 100 48 Z" fill="#FFFBEB" />
        </motion.g>

        <path d="M97 108 Q100 100 103 105" stroke="#FDE047" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <ellipse cx="100" cy="114" rx="58" ry="14" fill="#451A03" stroke="url(#diyaRim)" strokeWidth="3" />
        <ellipse cx="100" cy="116" rx="48" ry="9" fill="#F59E0B" opacity="0.45" />
        <path
          d="M42 114 C48 158, 76 172, 100 172 C124 172, 152 158, 158 114 Q100 130 42 114 Z"
          fill="url(#diyaBody)"
          stroke="#F5D061"
          strokeWidth="1.5"
        />
        <path
          d="M56 130 Q100 146 144 130"
          fill="none"
          stroke="#FEF08A"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.8"
        />
        <circle cx="100" cy="148" r="4" fill="#FEF08A" />
        <circle cx="78" cy="144" r="3" fill="#F5D061" />
        <circle cx="122" cy="144" r="3" fill="#F5D061" />
        <path d="M72 170 L128 170 L136 180 L64 180 Z" fill="url(#diyaRim)" />
      </svg>
    </div>
  );
};

// Custom Illustrated Icons for the 5 Firecrackers
const CrackerIllustratedIcon: React.FC<{ type: CrackerType; active: boolean }> = ({ type, active }) => {
  const strokeColor = active ? '#FFFBEB' : '#F5D061';
  switch (type) {
    case 'rocket':
      return (
        <svg viewBox="0 0 36 36" className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true">
          <path d="M18 4 L24 14 L12 14 Z" fill="#EC4899" stroke={strokeColor} strokeWidth="1.5" />
          <rect x="14" y="14" width="8" height="11" rx="1" fill="#F59E0B" stroke={strokeColor} strokeWidth="1.3" />
          <line x1="18" y1="25" x2="18" y2="33" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="18" cy="32" r="2.2" fill="#FEF08A" />
        </svg>
      );
    case 'anar':
      return (
        <svg viewBox="0 0 36 36" className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true">
          <path d="M18 11 L27 30 L9 30 Z" fill="#D97706" stroke={strokeColor} strokeWidth="1.5" />
          <path d="M13 22 L23 22" stroke="#FEF08A" strokeWidth="1.5" />
          <circle cx="18" cy="7" r="2.5" fill="#FEF08A" />
          <circle cx="13" cy="5" r="1.5" fill="#F59E0B" />
          <circle cx="23" cy="5" r="1.5" fill="#EC4899" />
        </svg>
      );
    case 'chakri':
      return (
        <svg viewBox="0 0 36 36" className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true">
          <circle cx="18" cy="18" r="11" fill="none" stroke="#EC4899" strokeWidth="2.2" strokeDasharray="5 3" />
          <circle cx="18" cy="18" r="6" fill="none" stroke="#F5D061" strokeWidth="2" />
          <circle cx="18" cy="18" r="2.5" fill="#FFFBEB" />
        </svg>
      );
    case 'phuljhadi':
      return (
        <svg viewBox="0 0 36 36" className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true">
          <line x1="8" y1="28" x2="22" y2="14" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="23" cy="13" r="3.5" fill="#FEF08A" />
          <line x1="23" y1="5" x2="23" y2="9" stroke="#F5D061" strokeWidth="1.5" />
          <line x1="23" y1="17" x2="23" y2="21" stroke="#F5D061" strokeWidth="1.5" />
          <line x1="15" y1="13" x2="19" y2="13" stroke="#F5D061" strokeWidth="1.5" />
          <line x1="27" y1="13" x2="31" y2="13" stroke="#F5D061" strokeWidth="1.5" />
        </svg>
      );
    case 'bomb':
      return (
        <svg viewBox="0 0 36 36" className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true">
          <circle cx="18" cy="20" r="9" fill="#9333EA" stroke={strokeColor} strokeWidth="1.6" />
          <path d="M12 20 H24 M18 11 V29" stroke="#F5D061" strokeWidth="1.2" opacity="0.7" />
          <path d="M18 11 Q22 6 26 8" fill="none" stroke="#FEF08A" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="26" cy="8" r="2" fill="#F59E0B" />
        </svg>
      );
  }
};

// Upgraded Top Marigold & Mango-Leaf Bandhanwar Toran Garland
const MarigoldToran: React.FC = () => (
  <div className="fixed top-0 left-0 right-0 z-20 pointer-events-none overflow-hidden h-12 sm:h-16 opacity-95">
    <svg viewBox="0 0 1440 96" preserveAspectRatio="none" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="marigoldGold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="mangoLeaf" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#15803D" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
      </defs>
      {/* Top golden rod */}
      <rect x="0" y="0" width="1440" height="5" fill="#D97706" />
      {Array.from({ length: 12 }).map((_, i) => {
        const startX = i * 120;
        return (
          <g key={i}>
            {/* Ashoka / Mango leaves along top */}
            {[20, 45, 75, 100].map((offset) => (
              <path
                key={offset}
                d={`M ${startX + offset} 4 C ${startX + offset - 6} 16, ${startX + offset - 4} 24, ${
                  startX + offset
                } 30 C ${startX + offset + 4} 24, ${startX + offset + 6} 16, ${startX + offset} 4 Z`}
                fill="url(#mangoLeaf)"
                stroke="#F5D061"
                strokeWidth="0.6"
                opacity="0.85"
              />
            ))}
            {/* Outer Marigold Garland */}
            <path
              d={`M ${startX} 4 Q ${startX + 60} 74 ${startX + 120} 4`}
              fill="none"
              stroke="url(#marigoldGold)"
              strokeWidth="7"
              strokeDasharray="9 5"
              strokeLinecap="round"
            />
            {/* Inner Jasmine & Gold Garland */}
            <path
              d={`M ${startX} 4 Q ${startX + 60} 50 ${startX + 120} 4`}
              fill="none"
              stroke="#FEF08A"
              strokeWidth="4.5"
              strokeDasharray="5 7"
              strokeLinecap="round"
            />
            {/* Hanging Temple Bell Tassel */}
            <line x1={startX + 60} y1="36" x2={startX + 60} y2="66" stroke="#F5D061" strokeWidth="1.8" />
            <path
              d={`M ${startX + 54} 72 L ${startX + 66} 72 L ${startX + 63} 64 L ${startX + 57} 64 Z`}
              fill="#F59E0B"
              stroke="#FEF08A"
              strokeWidth="1"
            />
            <circle cx={startX + 60} cy="75" r="2.2" fill="#FEF08A" />
          </g>
        );
      })}
    </svg>
  </div>
);

// Upgraded Multi-Layered Interactive Royal Palace Silhouette & Terrace Diyas
const RoyalPalaceSilhouette: React.FC<{
  onIgniteTerraceDiya: (clientX: number, clientY: number) => void;
}> = ({ onIgniteTerraceDiya }) => {
  const [litWindows, setLitWindows] = useState<boolean[]>([
    true,
    false,
    true,
    true,
    false,
    true,
    true,
    false,
    true,
    true,
    false,
    true
  ]);
  const [litTerraceDiyas, setLitTerraceDiyas] = useState<boolean[]>([
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true
  ]);

  const windowCoords = [
    { x: 115, y: 132 },
    { x: 190, y: 115 },
    { x: 355, y: 108 },
    { x: 525, y: 122 },
    { x: 595, y: 105 },
    { x: 695, y: 82 },
    { x: 720, y: 76 },
    { x: 745, y: 82 },
    { x: 845, y: 105 },
    { x: 915, y: 122 },
    { x: 1085, y: 108 },
    { x: 1250, y: 115 }
  ];

  const terraceDiyaX = [90, 240, 390, 540, 720, 900, 1050, 1200, 1350];

  const handleWindowClick = (idx: number, e: React.MouseEvent<SVGGElement>) => {
    e.stopPropagation();
    setLitWindows((prev) => prev.map((v, i) => (i === idx ? !v : v)));
    onIgniteTerraceDiya(e.clientX, e.clientY);
  };

  const handleDiyaClick = (idx: number, e: React.MouseEvent<SVGGElement>) => {
    e.stopPropagation();
    setLitTerraceDiyas((prev) => prev.map((v, i) => (i === idx ? true : v)));
    onIgniteTerraceDiya(e.clientX, e.clientY);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 pointer-events-none select-none overflow-hidden h-32 sm:h-48">
      {/* Subtle Horizon Warm Amber Mist */}
      <div
        className="absolute inset-x-0 bottom-0 h-28 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(245, 158, 11, 0.16) 0%, rgba(139, 92, 246, 0.06) 55%, transparent 100%)'
        }}
      />
      <svg viewBox="0 0 1440 220" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="distantFort" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1B1336" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#090716" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="palaceFade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#140E29" />
            <stop offset="100%" stopColor="#04050C" />
          </linearGradient>
          <radialGradient id="windowGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Layer 1: Distant Rajputana Hill Fort Silhouette */}
        <path
          d="M0 220 L0 120 L95 110 L140 85 L260 95 L310 60 L450 65 L510 95 L640 45 L800 45 L930 95 L990 65 L1130 60 L1180 95 L1300 85 L1345 110 L1440 120 L1440 220 Z"
          fill="url(#distantFort)"
        />

        {/* Layer 2: Mid-ground Grand Haveli Domes, Chhatris & Jharokha Arches */}
        <path
          d="M0 220 L0 160 L60 160 L60 128 C60 106 90 106 90 128 L90 160 L160 160 L160 112 L190 82 L220 112 L220 160 L320 160 L320 102 C320 55 390 55 390 102 L390 160 L500 160 L500 122 L560 122 L560 90 C560 48 630 48 630 90 L630 122 L660 122 L660 72 C660 14 780 14 780 72 L780 122 L810 122 L810 90 C810 48 880 48 880 90 L880 122 L940 122 L940 160 L1050 160 L1050 102 C1050 55 1120 55 1120 102 L1120 160 L1220 160 L1220 112 L1250 82 L1280 112 L1280 160 L1350 160 L1350 128 C1350 106 1380 106 1380 128 L1380 160 L1440 160 L1440 220 Z"
          fill="url(#palaceFade)"
          stroke="rgba(245, 208, 97, 0.28)"
          strokeWidth="1.5"
        />

        {/* Spire Kalash Finials on Main Domes */}
        {[190, 355, 595, 720, 845, 1085, 1250].map((kx, idx) => (
          <line
            key={idx}
            x1={kx}
            y1={idx === 3 ? 12 : idx === 2 || idx === 4 ? 44 : 58}
            x2={kx}
            y2={idx === 3 ? 28 : idx === 2 || idx === 4 ? 58 : 72}
            stroke="#F5D061"
            strokeWidth="2"
          />
        ))}

        {/* Interactive Glowing Jharokha Palace Windows */}
        {windowCoords.map((w, idx) => {
          const isLit = litWindows[idx];
          return (
            <g
              key={idx}
              onClick={(e) => handleWindowClick(idx, e)}
              className="pointer-events-auto cursor-pointer"
            >
              {isLit && <circle cx={w.x} cy={w.y + 7} r="16" fill="url(#windowGlow)" opacity="0.55" />}
              <rect
                x={w.x - 5}
                y={w.y}
                width="10"
                height="16"
                rx="5"
                fill={isLit ? '#FDE047' : '#1E1B2E'}
                stroke="#F5D061"
                strokeWidth="0.8"
                opacity={isLit ? 0.92 : 0.4}
              />
            </g>
          );
        })}

        {/* Layer 3: Foreground Royal Terrace Balustrade & Interactive Oil Diyas */}
        <rect x="0" y="186" width="1440" height="34" fill="#05040D" stroke="rgba(245, 158, 11, 0.3)" strokeWidth="1" />
        {terraceDiyaX.map((dx, idx) => {
          const isLit = litTerraceDiyas[idx];
          return (
            <g
              key={idx}
              onClick={(e) => handleDiyaClick(idx, e)}
              className="pointer-events-auto cursor-pointer"
            >
              {isLit && (
                <>
                  <circle cx={dx} cy="177" r="14" fill="url(#windowGlow)" opacity="0.65" />
                  <path
                    d={`M ${dx} 168 C ${dx + 4} 174, ${dx + 4} 180, ${dx} 183 C ${dx - 4} 180, ${
                      dx - 4
                    } 174, ${dx} 168 Z`}
                    fill="#FEF08A"
                  />
                </>
              )}
              <path
                d={`M ${dx - 9} 183 Q ${dx} 191 ${dx + 9} 183 Z`}
                fill="#D97706"
                stroke="#FEF08A"
                strokeWidth="0.8"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ==========================================
// 5. MAIN APPLICATION COMPONENT
// ==========================================
export function App() {
  // Experience State
  const [hasEntered, setHasEntered] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  // Fireworks & Choreography Controls State
  const [selectedCracker, setSelectedCracker] = useState<CrackerType>('rocket');
  const [burstPattern, setBurstPattern] = useState<BurstPattern>('auto');
  const [celebrationMode, setCelebrationMode] = useState<CelebrationMode>('auto');
  const [intensity, setIntensity] = useState<IntensityLevel>('medium');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDockExpanded, setIsDockExpanded] = useState<boolean>(false);
  const [finaleProgress, setFinaleProgress] = useState<number>(0);

  // Greeting Card & Personalisation State
  const [visitorName, setVisitorName] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [isGreetingMinimized, setIsGreetingMinimized] = useState<boolean>(false);
  const [isWishModalOpen, setIsWishModalOpen] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  // Hidden Surprise Gift Box State
  const [isGiftModalOpen, setIsGiftModalOpen] = useState<boolean>(false);
  const [giftOpenedCount, setGiftOpenedCount] = useState<number>(0);

  // Reduced Motion Preference
  const prefersReducedMotionRef = useRef<boolean>(false);

  // Refs for High-Performance 60FPS Delta-Time Canvas Loop
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportRef = useRef<{ width: number; height: number; dpr: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    dpr: 1
  });

  const particlesRef = useRef<Particle[]>([]);
  const rocketsRef = useRef<RocketEntity[]>([]);
  const anarsRef = useRef<AnarEntity[]>([]);
  const chakrisRef = useRef<ChakriEntity[]>([]);
  const ringsRef = useRef<ShockwaveRing[]>([]);
  const skyBannersRef = useRef<SkyTextBanner[]>([]);
  const screenFlashRef = useRef<number>(0);

  // Pointer state for Phuljhadi (strictly stops when finger/mouse releases)
  const pointerPosRef = useRef<{ x: number; y: number; active: boolean; pointerId: number | null }>({
    x: 0,
    y: 0,
    active: false,
    pointerId: null
  });

  // Grand Finale Choreographer Ref
  const finaleStateRef = useRef<{ active: boolean; elapsed: number; stage: number }>({
    active: false,
    elapsed: 0,
    stage: 0
  });

  // Sync mutable control refs for animation loop
  const controlsRef = useRef({
    selectedCracker,
    burstPattern,
    celebrationMode,
    intensity,
    isPaused,
    hasEntered,
    visitorName
  });

  useEffect(() => {
    controlsRef.current = {
      selectedCracker,
      burstPattern,
      celebrationMode,
      intensity,
      isPaused,
      hasEntered,
      visitorName
    };
  }, [selectedCracker, burstPattern, celebrationMode, intensity, isPaused, hasEntered, visitorName]);

  // Parse and sanitize ?name= from URL on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sharedName = sanitizeRecipientName(params.get('name'));
      if (sharedName) {
        setVisitorName(sharedName);
        setNameInput(sharedName);
      }
      prefersReducedMotionRef.current =
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    } catch {
      // Ignore URL parse errors in sandboxed iframes
    }
  }, []);

  // Sync Fullscreen State with Browser Events & Escape Key for Modals
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsWishModalOpen(false);
        setIsGiftModalOpen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Multiplier based on selected Intensity & device screen width
  const getIntensityMultiplier = useCallback(() => {
    const isMobile = viewportRef.current.width < 768;
    const reduced = prefersReducedMotionRef.current ? 0.45 : 1.0;
    const base = (isMobile ? 0.58 : 1.0) * reduced;
    if (controlsRef.current.intensity === 'low') return base * 0.6;
    if (controlsRef.current.intensity === 'high') return base * 1.38;
    return base;
  }, []);

  // ==========================================
  // 6. UPGRADED FIRECRACKER SPAWNERS & PATTERNS
  // ==========================================

  // Explode Rocket or Aerial Bomb at (x, y) with Specialized Shapes
  const createAerialExplosion = useCallback(
    (x: number, y: number, isHeavyBomb: boolean, requestedPattern: BurstPattern = 'auto') => {
      const mult = getIntensityMultiplier();
      const palette = DIWALI_PALETTES[Math.floor(Math.random() * DIWALI_PALETTES.length)];

      // Resolve pattern if set to 'auto'
      const patterns: BurstPattern[] = ['chrysanthemum', 'willow', 'heart', 'ring'];
      const chosenPattern: BurstPattern =
        requestedPattern === 'auto'
          ? patterns[Math.floor(Math.random() * patterns.length)]
          : requestedPattern;

      const baseCount = isHeavyBomb ? 115 : chosenPattern === 'heart' ? 76 : 75;
      const count = Math.max(24, Math.floor(baseCount * mult));

      soundEngine.playExplosion(isHeavyBomb);

      if (isHeavyBomb || chosenPattern === 'ring') {
        screenFlashRef.current = Math.min(0.32, screenFlashRef.current + (isHeavyBomb ? 0.28 : 0.12));
        palette.slice(0, isHeavyBomb ? 3 : 2).forEach((col, idx) => {
          ringsRef.current.push({
            x,
            y,
            radius: 6 + idx * 14,
            maxRadius: 135 + idx * 55,
            color: col,
            alpha: 0.88
          });
        });
      } else {
        screenFlashRef.current = Math.max(screenFlashRef.current, 0.1);
      }

      for (let i = 0; i < count; i++) {
        const t = (Math.PI * 2 * i) / count;
        let vx = 0;
        let vy = 0;
        let color = palette[i % palette.length];
        let gravity = 0.065;
        let drag = 0.982;
        let decay = 0.011 + Math.random() * 0.012;
        let maxTrail = isHeavyBomb ? 7 : 5;
        let sparkleType: Particle['sparkleType'] = 'orb';

        if (chosenPattern === 'heart' && !isHeavyBomb) {
          // Parametric Heart Equation: x = 16 sin^3(t), y = -(13 cos(t) - 5 cos(2t) - 2 cos(3t) - cos(4t))
          const scale = 0.28 + Math.random() * 0.04;
          vx = 16 * Math.pow(Math.sin(t), 3) * scale;
          vy =
            -(
              13 * Math.cos(t) -
              5 * Math.cos(2 * t) -
              2 * Math.cos(3 * t) -
              Math.cos(4 * t)
            ) * scale;
          color = i % 3 === 0 ? '#FFFBEB' : '#FF2E93';
          drag = 0.975;
          gravity = 0.04;
        } else if (chosenPattern === 'willow') {
          // Drooping Golden Willow weeping trails
          const angle = t + (Math.random() - 0.5) * 0.22;
          const speed = 1.6 + Math.random() * 5.2;
          vx = Math.cos(angle) * speed;
          vy = Math.sin(angle) * speed;
          color = i % 4 === 0 ? '#FFFBEB' : '#F5D061';
          gravity = 0.095;
          drag = 0.986;
          decay = 0.0075 + Math.random() * 0.006;
          maxTrail = 10;
          sparkleType = 'willow';
        } else if (chosenPattern === 'ring') {
          // Double Concentric Ring Burst
          const isInner = i % 2 === 0;
          const ringSpeed = isInner ? 3.4 : 6.4;
          vx = Math.cos(t) * ringSpeed;
          vy = Math.sin(t) * ringSpeed * 0.85;
          color = isInner ? '#FFFBEB' : palette[0];
          drag = 0.978;
          gravity = 0.045;
        } else {
          // Chrysanthemum / Peony / Heavy Satrangi Multi-shell
          const angle = t + (Math.random() - 0.5) * 0.25;
          const speed = isHeavyBomb
            ? (2.2 + Math.random() * 8.8) * (i % 3 === 0 ? 1.2 : 0.85)
            : 1.8 + Math.random() * 6.4;
          vx = Math.cos(angle) * speed;
          vy = Math.sin(angle) * speed;
          if (isHeavyBomb && i % 5 === 0) sparkleType = 'crackle';
        }

        particlesRef.current.push({
          x,
          y,
          vx,
          vy,
          color,
          alpha: 1,
          decay,
          size: isHeavyBomb ? 2.3 + Math.random() * 1.9 : 1.7 + Math.random() * 1.6,
          gravity,
          drag,
          trail: [],
          maxTrail,
          flicker: Math.random() > 0.32,
          sparkleType,
          secondaryBurst: isHeavyBomb && i % 15 === 0
        });
      }
    },
    [getIntensityMultiplier]
  );

  // 1. Launch Sky Rocket or Satrangi Bomb toward target (tx, ty)
  const launchRocket = useCallback(
    (targetX: number, targetY: number, isBomb = false, customPattern?: BurstPattern) => {
      const { width, height } = viewportRef.current;
      const startX = width * (0.2 + Math.random() * 0.6);
      const startY = height - 24;
      const clampedTargetY = Math.min(targetY, height * 0.72);
      const dx = targetX - startX;
      const dy = clampedTargetY - startY;
      const distance = Math.hypot(dx, dy);
      const speed = isBomb ? 13.5 : 12.0;
      const steps = Math.max(18, distance / speed);

      soundEngine.playRocketWhistle();

      const palette = DIWALI_PALETTES[Math.floor(Math.random() * DIWALI_PALETTES.length)];
      rocketsRef.current.push({
        id: Date.now() + Math.random(),
        x: startX,
        y: startY,
        targetX,
        targetY: clampedTargetY,
        vx: dx / steps,
        vy: dy / steps,
        color: palette[0],
        trail: [],
        isBomb,
        pattern: customPattern ?? controlsRef.current.burstPattern
      });
    },
    []
  );

  // 2. Spawn Flower Pot (Anar) Fountain at bottom terrace or tap X
  const spawnAnarFountain = useCallback((tapX: number, tapY?: number) => {
    const { height } = viewportRef.current;
    const groundY = tapY && tapY > height * 0.62 ? Math.min(tapY, height - 30) : height - 34;
    soundEngine.playSparkleSizzle(0.45, 2400);
    if (anarsRef.current.length >= 5) {
      anarsRef.current.shift();
    }
    anarsRef.current.push({
      id: Date.now() + Math.random(),
      x: tapX,
      y: groundY,
      elapsed: 0,
      duration: 3.2, // seconds
      hue: 38 + Math.random() * 15
    });
  }, []);

  // 3. Spawn Chakri (Spinning Ground Wheel) at (x, y)
  const spawnChakriSpinner = useCallback((x: number, y: number) => {
    soundEngine.playSparkleSizzle(0.4, 3600);
    if (chakrisRef.current.length >= 4) {
      chakrisRef.current.shift();
    }
    const palette = DIWALI_PALETTES[Math.floor(Math.random() * DIWALI_PALETTES.length)];
    chakrisRef.current.push({
      id: Date.now() + Math.random(),
      x,
      y,
      angle: 0,
      angularVelocity: 0.44,
      elapsed: 0,
      duration: 2.8, // seconds
      colors: palette
    });
  }, []);

  // 4. Emit Phuljhadi (Handheld Sparkler) sparks at (x, y)
  const emitPhuljhadiSparks = useCallback(
    (x: number, y: number, countOverride?: number) => {
      const mult = getIntensityMultiplier();
      const count = countOverride ?? Math.max(3, Math.floor(7 * mult));

      if (Math.random() > 0.55) {
        soundEngine.playSparkleSizzle(0.12, 4200);
      }

      const sparkColors = ['#FFFBEB', '#F5D061', '#F59E0B', '#FDE047', '#FB7185'];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.4 + Math.random() * 5.2;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
          alpha: 1,
          decay: 0.034 + Math.random() * 0.024,
          size: 1.4 + Math.random() * 1.3,
          gravity: 0.085,
          drag: 0.94,
          trail: [],
          maxTrail: 4,
          flicker: true,
          sparkleType: 'needle'
        });
      }
    },
    [getIntensityMultiplier]
  );

  // 5. Illuminate Recipient Name in the Night Sky with Golden Fireworks
  const triggerSkyNameIllumination = useCallback(
    (name: string) => {
      const clean = sanitizeRecipientName(name) || 'SHUBH DIWALI';
      const { width, height } = viewportRef.current;
      const centerX = width / 2;
      const bannerY = Math.max(110, height * 0.24);

      soundEngine.playAuspiciousChime();

      skyBannersRef.current = [
        {
          text: `✦ ${clean.toUpperCase()} ✦`,
          x: centerX,
          y: bannerY,
          alpha: 1,
          elapsed: 0,
          duration: 4.5
        }
      ];

      // Launch 3 coordinated golden/heart bursts framing the sky name
      createAerialExplosion(centerX, bannerY, false, 'heart');
      setTimeout(() => createAerialExplosion(centerX - Math.min(180, width * 0.28), bannerY + 20, false, 'willow'), 220);
      setTimeout(() => createAerialExplosion(centerX + Math.min(180, width * 0.28), bannerY + 20, false, 'willow'), 420);
    },
    [createAerialExplosion]
  );

  // Golden Celebration Burst (Used on Opening Entry & Surprise Gift Open)
  const triggerGoldenCelebrationBurst = useCallback(() => {
    const { width, height } = viewportRef.current;
    const cx = width / 2;
    const cy = height / 2;
    createAerialExplosion(cx, cy * 0.62, true, 'willow');
    setTimeout(() => createAerialExplosion(cx * 0.55, cy * 0.48, false, 'heart'), 220);
    setTimeout(() => createAerialExplosion(cx * 1.45, cy * 0.48, false, 'ring'), 420);
  }, [createAerialExplosion]);

  // Trigger 20-Second Choreographed Grand Finale Show
  const startGrandFinaleShow = useCallback(() => {
    setCelebrationMode('finale');
    setIsPaused(false);
    finaleStateRef.current = { active: true, elapsed: 0, stage: 0 };
    setFinaleProgress(1);
    soundEngine.playGrandFinaleFanfare();

    if (controlsRef.current.visitorName) {
      triggerSkyNameIllumination(controlsRef.current.visitorName);
    }
  }, [triggerSkyNameIllumination]);

  // ==========================================
  // 7. DELTA-TIME HTML5 CANVAS ENGINE (60FPS + High-DPI)
  // ==========================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let lastTimestamp = performance.now();
    let autoLaunchAccumulator = 0;

    // Configure High-DPI Canvas scaling (capped at 2.0 on mobile for smooth fill-rate)
    const updateCanvasSize = () => {
      if (!canvas) return;
      const cssWidth = window.innerWidth;
      const cssHeight = window.innerHeight;
      const isMobile = cssWidth < 768;
      const rawDpr = window.devicePixelRatio || 1;
      const dpr = Math.min(rawDpr, isMobile ? 1.75 : 2.0);

      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      viewportRef.current = { width: cssWidth, height: cssHeight, dpr };
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Pause audio & reset frame clock when browser tab is backgrounded
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pointerPosRef.current.active = false;
      } else {
        lastTimestamp = performance.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Ambient floating golden dust & marigold petals
    const ambientPetals: FloatingPetal[] = Array.from({ length: 34 }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -0.22 - Math.random() * 0.38,
      size: 1.4 + Math.random() * 2.4,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.03,
      color: Math.random() > 0.35 ? '#F5D061' : '#FB923C',
      alpha: 0.25 + Math.random() * 0.5
    }));

    const renderLoop = (now: number) => {
      animationFrameId = requestAnimationFrame(renderLoop);
      if (document.hidden) return;

      // Delta-time normalized to 60FPS (dtScale = 1.0 at 16.67ms)
      const rawDtSec = Math.min(0.05, Math.max(0.001, (now - lastTimestamp) / 1000));
      lastTimestamp = now;
      const dtScale = rawDtSec * 60;

      const {
        isPaused: paused,
        celebrationMode: mode,
        intensity: level,
        hasEntered: entered
      } = controlsRef.current;

      if (paused) return;

      const { width, height } = viewportRef.current;

      // Deep Royal Midnight Navy & Purple Atmospheric Trail Clear
      ctx.fillStyle = 'rgba(6, 5, 16, 0.24)';
      ctx.fillRect(0, 0, width, height);

      // Subtle Atmospheric Sky Flash
      if (screenFlashRef.current > 0.008) {
        ctx.fillStyle = `rgba(254, 240, 138, ${screenFlashRef.current})`;
        ctx.fillRect(0, 0, width, height);
        screenFlashRef.current *= Math.pow(0.86, dtScale);
      }

      // Draw Floating Golden Dust & Marigold Petals
      ctx.save();
      for (let i = 0; i < ambientPetals.length; i++) {
        const p = ambientPetals[i];
        p.x += p.vx * dtScale;
        p.y += p.vy * dtScale;
        p.rotation += p.vRot * dtScale;

        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // ==========================================
      // CHOREOGRAPHED GRAND FINALE SEQUENCER (20s)
      // ==========================================
      if (entered && finaleStateRef.current.active) {
        const fin = finaleStateRef.current;
        fin.elapsed += rawDtSec;
        const pct = Math.min(100, Math.floor((fin.elapsed / 20) * 100));
        if (pct !== Math.floor(((fin.elapsed - rawDtSec) / 20) * 100)) {
          setFinaleProgress(pct);
        }

        // Stage 1 (0.1s): Ignite Terrace Anar Wall
        if (fin.stage === 0 && fin.elapsed > 0.1) {
          fin.stage = 1;
          [0.18, 0.38, 0.62, 0.82].forEach((ratio) => {
            spawnAnarFountain(width * ratio, height - 34);
          });
        }
        // Stage 2 (3.2s): Twin Sky Chakri Spirals + Heart Rockets
        if (fin.stage === 1 && fin.elapsed > 3.2) {
          fin.stage = 2;
          spawnChakriSpinner(width * 0.28, height * 0.42);
          spawnChakriSpinner(width * 0.72, height * 0.42);
          launchRocket(width * 0.5, height * 0.25, false, 'heart');
        }
        // Stage 3 (6.8s): Golden Willow Royal Curtain
        if (fin.stage === 2 && fin.elapsed > 6.8) {
          fin.stage = 3;
          [0.22, 0.5, 0.78].forEach((ratio, idx) => {
            setTimeout(() => {
              launchRocket(width * ratio, height * 0.22, false, 'willow');
            }, idx * 240);
          });
        }
        // Stage 4 (11.0s): Saturn Rings & Chrysanthemum Barrage
        if (fin.stage === 3 && fin.elapsed > 11.0) {
          fin.stage = 4;
          [0.2, 0.4, 0.6, 0.8].forEach((ratio, idx) => {
            setTimeout(() => {
              launchRocket(width * ratio, height * (0.18 + (idx % 2) * 0.1), false, idx % 2 === 0 ? 'ring' : 'chrysanthemum');
            }, idx * 220);
          });
        }
        // Stage 5 (15.0s): Satrangi Heavy Aerial Bomb Finale Salvo!
        if (fin.stage === 4 && fin.elapsed > 15.0) {
          fin.stage = 5;
          if (controlsRef.current.visitorName) {
            triggerSkyNameIllumination(controlsRef.current.visitorName);
          }
          [0.25, 0.5, 0.75, 0.35, 0.65].forEach((ratio, idx) => {
            setTimeout(() => {
              launchRocket(width * ratio, height * 0.22, true, idx % 2 === 0 ? 'willow' : 'heart');
            }, idx * 280);
          });
        }
        // Complete Finale at 20.0s -> smoothly return to Auto Celebration
        if (fin.elapsed >= 20.0) {
          fin.active = false;
          setFinaleProgress(0);
          setCelebrationMode('auto');
        }
      }

      // ==========================================
      // HARMONIOUS AUTO CELEBRATION SEQUENCER
      // ==========================================
      if (entered && mode === 'auto' && !finaleStateRef.current.active) {
        autoLaunchAccumulator += rawDtSec;
        const intervalSec = level === 'high' ? 0.68 : level === 'medium' ? 1.15 : 1.75;
        if (autoLaunchAccumulator >= intervalSec) {
          autoLaunchAccumulator = 0;
          const roll = Math.random();
          const tx = width * (0.15 + Math.random() * 0.7);
          const ty = height * (0.15 + Math.random() * 0.36);

          if (roll < 0.56) {
            launchRocket(tx, ty, false);
          } else if (roll < 0.76) {
            launchRocket(tx, ty, true);
          } else if (roll < 0.9 && anarsRef.current.length < 3) {
            spawnAnarFountain(width * (0.18 + Math.random() * 0.64));
          } else if (chakrisRef.current.length < 2) {
            spawnChakriSpinner(tx, height * (0.3 + Math.random() * 0.32));
          }
        }
      }

      // Additive Blending for Luminous Pyrotechnics
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // A. Update & Draw Shockwave Rings
      for (let i = ringsRef.current.length - 1; i >= 0; i--) {
        const ring = ringsRef.current[i];
        ring.radius += (ring.maxRadius - ring.radius) * 0.12 * dtScale;
        ring.alpha *= Math.pow(0.91, dtScale);

        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.globalAlpha = Math.max(0, ring.alpha);
        ctx.lineWidth = 2.4;
        ctx.stroke();

        if (ring.alpha < 0.03) {
          ringsRef.current.splice(i, 1);
        }
      }

      // B. Update & Draw Sky Name Banners
      for (let i = skyBannersRef.current.length - 1; i >= 0; i--) {
        const b = skyBannersRef.current[i];
        b.elapsed += rawDtSec;
        const progress = b.elapsed / b.duration;
        if (progress >= 1) {
          skyBannersRef.current.splice(i, 1);
          continue;
        }
        const fade = progress < 0.15 ? progress / 0.15 : progress > 0.75 ? (1 - progress) / 0.25 : 1;
        ctx.save();
        ctx.globalAlpha = Math.max(0, fade * 0.92);
        const fontSize = Math.min(42, Math.max(20, Math.floor(width * 0.055)));
        ctx.font = `700 ${fontSize}px "Cinzel Decorative", Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#F59E0B';
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#FFFBEB';
        ctx.fillText(b.text, b.x, b.y);
        ctx.restore();

        // Emit shimmering gold sparks off the sky letters
        if (Math.random() > 0.4) {
          particlesRef.current.push({
            x: b.x + (Math.random() - 0.5) * Math.min(280, width * 0.6),
            y: b.y + (Math.random() - 0.5) * 16,
            vx: (Math.random() - 0.5) * 0.8,
            vy: 0.4 + Math.random() * 1.2,
            color: '#F5D061',
            alpha: fade,
            decay: 0.035,
            size: 1.6,
            gravity: 0.03,
            drag: 0.96,
            trail: [],
            maxTrail: 3,
            flicker: true
          });
        }
      }

      // C. Update & Draw Ascending Sky Rockets
      for (let i = rocketsRef.current.length - 1; i >= 0; i--) {
        const r = rocketsRef.current[i];
        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 10) r.trail.shift();

        r.x += r.vx * dtScale;
        r.y += r.vy * dtScale;

        if (Math.random() > 0.28) {
          particlesRef.current.push({
            x: r.x,
            y: r.y,
            vx: (Math.random() - 0.5) * 1.2,
            vy: 1.2 + Math.random() * 1.8,
            color: '#F5D061',
            alpha: 0.85,
            decay: 0.045,
            size: 1.5,
            gravity: 0.04,
            drag: 0.96,
            trail: [],
            maxTrail: 2,
            flicker: true
          });
        }

        ctx.beginPath();
        r.trail.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = r.isBomb ? 3.2 : 2.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.isBomb ? 3.8 : 2.6, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFBEB';
        ctx.fill();

        const distToTarget = Math.hypot(r.targetX - r.x, r.targetY - r.y);
        if (distToTarget < 20 || r.y <= r.targetY) {
          createAerialExplosion(r.x, r.y, r.isBomb, r.pattern);
          rocketsRef.current.splice(i, 1);
        }
      }

      // D. Update & Draw Flower Pots (Anar Fountains)
      const mult = getIntensityMultiplier();
      for (let i = anarsRef.current.length - 1; i >= 0; i--) {
        const anar = anarsRef.current[i];
        anar.elapsed += rawDtSec;

        // Ground radial reflection glow
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.ellipse(anar.x, anar.y + 4, 38, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#F59E0B';
        ctx.fill();

        // Conical earthen pot
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(anar.x, anar.y - 18);
        ctx.lineTo(anar.x + 12, anar.y + 4);
        ctx.lineTo(anar.x - 12, anar.y + 4);
        ctx.closePath();
        ctx.fillStyle = '#D97706';
        ctx.fill();
        ctx.strokeStyle = '#FEF08A';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(anar.x, anar.y - 19, 5.5 + Math.random() * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFBEB';
        ctx.fill();

        const sparksPerFrame = Math.max(2, Math.floor(5 * mult));
        if (Math.random() < 0.15) {
          soundEngine.playSparkleSizzle(0.16, 2800);
        }

        for (let s = 0; s < sparksPerFrame; s++) {
          const spreadAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.46;
          const speed = 6.2 + Math.random() * 8.2;
          const colors = ['#FFFBEB', '#F5D061', '#F59E0B', '#FDE047', '#38BDF8'];
          particlesRef.current.push({
            x: anar.x + (Math.random() - 0.5) * 4,
            y: anar.y - 18,
            vx: Math.cos(spreadAngle) * speed,
            vy: Math.sin(spreadAngle) * speed,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1,
            decay: 0.015 + Math.random() * 0.012,
            size: 1.7 + Math.random() * 1.7,
            gravity: 0.18,
            drag: 0.985,
            trail: [],
            maxTrail: 5,
            flicker: true,
            sparkleType: 'orb'
          });
        }

        if (anar.elapsed >= anar.duration) {
          anarsRef.current.splice(i, 1);
        }
      }

      // E. Update & Draw Chakri (Spinning Wheels)
      for (let i = chakrisRef.current.length - 1; i >= 0; i--) {
        const chakri = chakrisRef.current[i];
        chakri.elapsed += rawDtSec;
        chakri.angle += chakri.angularVelocity * dtScale;

        ctx.save();
        ctx.translate(chakri.x, chakri.y);
        ctx.rotate(chakri.angle);
        ctx.globalAlpha = 0.95;

        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.strokeStyle = chakri.colors[0];
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFBEB';
        ctx.fill();
        ctx.restore();

        if (Math.random() < 0.14) {
          soundEngine.playSparkleSizzle(0.14, 3800);
        }

        const arms = 4;
        for (let a = 0; a < arms; a++) {
          const nozzleAngle = chakri.angle + (a * Math.PI * 2) / arms;
          const speed = 4.0 + Math.random() * 4.2;
          particlesRef.current.push({
            x: chakri.x + Math.cos(nozzleAngle) * 10,
            y: chakri.y + Math.sin(nozzleAngle) * 10,
            vx: Math.cos(nozzleAngle + 0.6) * speed,
            vy: Math.sin(nozzleAngle + 0.6) * speed,
            color: chakri.colors[a % chakri.colors.length],
            alpha: 1,
            decay: 0.025 + Math.random() * 0.015,
            size: 1.9,
            gravity: 0.03,
            drag: 0.96,
            trail: [],
            maxTrail: 6,
            flicker: true
          });
        }

        if (chakri.elapsed >= chakri.duration) {
          chakrisRef.current.splice(i, 1);
        }
      }

      // F. Draw Handheld Phuljhadi (Sparkler) ONLY while pointer is actively pressed/moved
      if (
        controlsRef.current.selectedCracker === 'phuljhadi' &&
        pointerPosRef.current.active &&
        entered
      ) {
        const px = pointerPosRef.current.x;
        const py = pointerPosRef.current.y;

        ctx.save();
        ctx.globalAlpha = 0.92;
        ctx.beginPath();
        ctx.moveTo(px + 34, py + 44);
        ctx.lineTo(px, py);
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(px, py, 5.5 + Math.random() * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFBEB';
        ctx.fill();
        ctx.restore();

        emitPhuljhadiSparks(px, py, 4);
      }

      // G. Update & Draw All Physics Particles (With Strict Device Budget & Fast Swap-Pop)
      const isMobileScreen = width < 768;
      const maxAllowedParticles = isMobileScreen ? 680 : 1550;
      const particles = particlesRef.current;

      if (particles.length > maxAllowedParticles) {
        particles.splice(0, particles.length - maxAllowedParticles);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > p.maxTrail) {
          p.trail.shift();
        }

        const dragFactor = Math.pow(p.drag, dtScale);
        p.vx *= dragFactor;
        p.vy *= dragFactor;
        p.vy += p.gravity * dtScale;
        p.x += p.vx * dtScale;
        p.y += p.vy * dtScale;
        p.alpha -= p.decay * dtScale;

        if (p.alpha <= 0.02) {
          if (p.secondaryBurst && particles.length < maxAllowedParticles - 10) {
            for (let s = 0; s < 5; s++) {
              const ang = Math.random() * Math.PI * 2;
              particles.push({
                x: p.x,
                y: p.y,
                vx: Math.cos(ang) * 2.3,
                vy: Math.sin(ang) * 2.3,
                color: '#FFFBEB',
                alpha: 0.9,
                decay: 0.05,
                size: 1.4,
                gravity: 0.04,
                drag: 0.95,
                trail: [],
                maxTrail: 2,
                flicker: true
              });
            }
          }
          // O(1) Swap-and-pop removal
          particles[i] = particles[particles.length - 1];
          particles.pop();
          continue;
        }

        const displayAlpha = p.flicker && Math.random() > 0.72 ? p.alpha * 0.35 : p.alpha;
        ctx.globalAlpha = Math.max(0, displayAlpha);

        if (p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let t = 1; t < p.trail.length; t++) {
            ctx.lineTo(p.trail[t].x, p.trail[t].y);
          }
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size * 0.82;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        if (p.sparkleType === 'needle') {
          ctx.beginPath();
          ctx.moveTo(p.x - 3, p.y);
          ctx.lineTo(p.x + 3, p.y);
          ctx.moveTo(p.x, p.y - 3);
          ctx.lineTo(p.x, p.y + 3);
          ctx.strokeStyle = '#FFFBEB';
          ctx.lineWidth = 1.1;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
      }

      ctx.restore();
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateCanvasSize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    createAerialExplosion,
    emitPhuljhadiSparks,
    getIntensityMultiplier,
    launchRocket,
    spawnAnarFountain,
    spawnChakriSpinner,
    triggerSkyNameIllumination
  ]);

  // ==========================================
  // 8. USER INTERACTION HANDLERS (MOBILE & DESKTOP)
  // ==========================================

  const handleEnterCelebration = () => {
    if (isEntering) return;
    setIsEntering(true);

    soundEngine.init();
    soundEngine.playAuspiciousChime();
    soundEngine.startAmbientMusic();

    setTimeout(() => {
      setHasEntered(true);
      triggerGoldenCelebrationBurst();
      if (visitorName) {
        setTimeout(() => triggerSkyNameIllumination(visitorName), 700);
      }
    }, 900);
  };

  // Pointer Events on Canvas with Strict Capture & Release Cutoff
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!hasEntered) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const x = e.clientX;
    const y = e.clientY;

    pointerPosRef.current = { x, y, active: true, pointerId: e.pointerId };

    switch (selectedCracker) {
      case 'rocket':
        launchRocket(x, y, false, burstPattern);
        break;
      case 'anar':
        spawnAnarFountain(x, y);
        break;
      case 'chakri':
        spawnChakriSpinner(x, y);
        break;
      case 'phuljhadi':
        emitPhuljhadiSparks(x, y, 16);
        break;
      case 'bomb':
        launchRocket(x, y, true, burstPattern);
        break;
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!hasEntered) return;
    pointerPosRef.current.x = e.clientX;
    pointerPosRef.current.y = e.clientY;

    // On mouse devices, allow waving sparkler on hover; on touch, require active contact
    if (selectedCracker === 'phuljhadi') {
      if (e.pointerType === 'mouse' || e.buttons > 0 || pointerPosRef.current.pointerId === e.pointerId) {
        pointerPosRef.current.active = true;
      }
    }
  };

  const stopPhuljhadiPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    }
    pointerPosRef.current.active = false;
    pointerPosRef.current.pointerId = null;
  };

  // Interactive Palace Window / Terrace Diya Boost
  const handleIgniteTerraceDiya = useCallback(
    (clientX: number, clientY: number) => {
      if (!hasEntered) return;
      soundEngine.playAuspiciousChime();
      emitPhuljhadiSparks(clientX, clientY, 22);
    },
    [emitPhuljhadiSparks, hasEntered]
  );

  const handleClearSky = () => {
    particlesRef.current = [];
    rocketsRef.current = [];
    anarsRef.current = [];
    chakrisRef.current = [];
    ringsRef.current = [];
    skyBannersRef.current = [];
    finaleStateRef.current.active = false;
    setFinaleProgress(0);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.setMuted(nextMuted);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Generate Personalized Wish & Sky Name Reveal
  const handleGenerateWish = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = sanitizeRecipientName(nameInput);
    setVisitorName(cleaned);
    setNameInput(cleaned);
    setIsWishModalOpen(false);

    // Update URL query parameter without reloading
    try {
      const url = new URL(window.location.href);
      if (cleaned) {
        url.searchParams.set('name', cleaned);
      } else {
        url.searchParams.delete('name');
      }
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore history update in restricted iframe environments
    }

    if (cleaned) {
      triggerSkyNameIllumination(cleaned);
    } else {
      triggerGoldenCelebrationBurst();
    }
  };

  const getShareableGreetingText = () => {
    const header = visitorName ? `✨ Happy Diwali, ${visitorName}! 🪔` : `✨ Happy Diwali! 🪔`;
    const shareUrl = `${window.location.origin}${window.location.pathname}${
      visitorName ? `?name=${encodeURIComponent(visitorName)}` : ''
    }`;
    return `${header}\n\n"May the light of millions of diyas illuminate your life with happiness, prosperity, peace and endless possibilities."\n\nExperience your interactive royal Diwali fireworks here: ${shareUrl}`;
  };

  // Clipboard Copy with Fallback for Android WebViews
  const handleCopyGreeting = async () => {
    const text = getShareableGreetingText();
    let success = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch {
        success = false;
      }
    }
    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        success = true;
      } catch {
        // Ignore fallback error
      }
    }
    if (success) {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2600);
    }
  };

  const handleWhatsAppShare = async () => {
    const text = getShareableGreetingText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: visitorName ? `Happy Diwali, ${visitorName}!` : 'Happy Diwali!',
          text
        });
        return;
      } catch {
        // Fallback to WhatsApp URL if cancelled
      }
    }
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenGiftBox = () => {
    setIsGiftModalOpen(true);
    setGiftOpenedCount((c) => c + 1);
    soundEngine.playAuspiciousChime();
    triggerGoldenCelebrationBurst();
  };

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-[#05040D] text-amber-50 select-none font-sans">
      {/* Google Fonts & Custom Royal Gold Shimmer Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .font-royal {
          font-family: 'Cinzel Decorative', 'Playfair Display', Georgia, serif;
        }
        .font-serif-elegant {
          font-family: 'Playfair Display', Georgia, serif;
        }
        .gold-shimmer-text {
          background: linear-gradient(
            110deg,
            #FFFBEB 0%,
            #F5D061 25%,
            #F59E0B 50%,
            #FFFBEB 75%,
            #F5D061 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shineGold 5s linear infinite;
        }
        @keyframes shineGold {
          to {
            background-position: 200% center;
          }
        }
      `}</style>

      {/* Atmospheric Radial Night Vignette & Golden Light Rays */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(36, 20, 74, 0.5) 0%, rgba(12, 9, 32, 0.88) 58%, rgba(5, 4, 13, 1) 100%)'
        }}
      />

      {/* Interactive 60FPS HTML5 Fireworks Canvas (touch-action: none prevents scroll) */}
      <canvas
        ref={canvasRef}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={stopPhuljhadiPointer}
        onPointerCancel={stopPhuljhadiPointer}
        onPointerLeave={stopPhuljhadiPointer}
        style={{ touchAction: 'none' }}
        className={`fixed inset-0 z-10 block w-full h-full ${
          hasEntered ? 'cursor-crosshair' : 'pointer-events-none'
        }`}
      />

      {/* Decorative Marigold Toran & Interactive Royal Palace Horizon */}
      <MarigoldToran />
      <RoyalPalaceSilhouette onIgniteTerraceDiya={handleIgniteTerraceDiya} />

      {/* ==========================================
          OPENING EXPERIENCE ("ENTER THE CELEBRATION")
      ========================================== */}
      <AnimatePresence>
        {!hasEntered && (
          <motion.main
            key="opening-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.06, filter: 'blur(12px)' }}
            transition={{ duration: 0.85, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center px-5 py-8 text-center bg-[#05040D]/90 backdrop-blur-md overflow-y-auto"
          >
            <AnimatePresence>
              {isEntering && (
                <motion.div
                  initial={{ scale: 0.2, opacity: 0.9 }}
                  animate={{ scale: 22, opacity: 0 }}
                  transition={{ duration: 1.0, ease: 'easeOut' }}
                  className="fixed w-32 h-32 rounded-full bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 pointer-events-none z-50 blur-xl"
                />
              )}
            </AnimatePresence>

            <div className="relative flex items-center justify-center mb-4 sm:mb-6">
              <div className="absolute w-64 h-64 sm:w-88 sm:h-88 opacity-35">
                <AnimatedRangoli />
              </div>
              <GlowingDiya intense={isEntering} size="lg" />
            </div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-[11px] sm:text-sm uppercase tracking-[0.32em] text-amber-300/85 mb-2.5 font-medium"
            >
              Shubh Deepavali • शुभ दीपावली
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-royal text-2xl sm:text-5xl md:text-6xl font-bold gold-shimmer-text max-w-2xl leading-tight mb-3 sm:mb-4 drop-shadow-[0_4px_24px_rgba(245,158,11,0.35)]"
            >
              {visitorName
                ? `A Royal Diwali For ${visitorName}`
                : 'The Festival of Lights Is Here'}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="text-amber-100/75 max-w-md text-xs sm:text-base mb-7 sm:mb-9 leading-relaxed px-2"
            >
              Step into an interactive royal palace night filled with glowing diyas, auspicious sitar melodies, and real-time sky fireworks.
            </motion.p>

            <motion.button
              type="button"
              onClick={handleEnterCelebration}
              whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(245, 158, 11, 0.75)' }}
              whileTap={{ scale: 0.96 }}
              className="group relative inline-flex items-center justify-center gap-3 min-h-[52px] px-7 sm:px-9 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-bold text-sm sm:text-lg tracking-wide shadow-[0_0_30px_rgba(245,158,11,0.5)] border border-amber-200/80 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-200"
            >
              <Flame className="w-5 h-5 text-amber-950 fill-amber-950 transition-transform group-hover:scale-125" />
              <span>{isEntering ? 'Igniting the Palace...' : 'Light Up Your Diwali'}</span>
              <Sparkles className="w-5 h-5 text-amber-950 animate-pulse" />
            </motion.button>
          </motion.main>
        )}
      </AnimatePresence>

      {/* ==========================================
          MAIN CELEBRATION HUD & MOBILE-FIRST CONTROLS
      ========================================== */}
      {hasEntered && (
        <>
          {/* TOP NAVIGATION & UTILITY BAR */}
          <header
            onPointerDown={(e) => e.stopPropagation()}
            className="fixed top-3 sm:top-4 left-3 right-3 sm:left-5 sm:right-5 z-30 flex items-center justify-between gap-2 pointer-events-none"
          >
            {/* Brand Badge & Active Cracker Status */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-500/35 shadow-lg"
            >
              <GlowingDiya size="sm" />
              <div className="pr-1.5">
                <p className="font-royal text-xs sm:text-sm font-bold text-amber-300 leading-none">
                  Deepavali Utsav
                </p>
                <p className="text-[10px] sm:text-[11px] text-amber-100/75 hidden md:block mt-0.5">
                  {CRACKER_OPTIONS.find((c) => c.id === selectedCracker)?.desc}
                </p>
              </div>
            </motion.div>

            {/* Right Utility Controls (>=44x44px touch targets) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="pointer-events-auto flex items-center gap-1.5 sm:gap-2"
            >
              <button
                type="button"
                onClick={startGrandFinaleShow}
                className={`flex items-center gap-1.5 min-h-[42px] px-3 sm:px-3.5 py-2 rounded-full border text-xs sm:text-sm font-semibold backdrop-blur-md transition cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-amber-300 ${
                  celebrationMode === 'finale'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 border-amber-200'
                    : 'bg-amber-500/20 hover:bg-amber-500/35 border-amber-400/50 text-amber-200'
                }`}
                title="Launch 20-Second Choreographed Grand Finale"
              >
                <Crown className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">
                  {celebrationMode === 'finale' ? `Finale ${finaleProgress}%` : 'Grand Finale'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsWishModalOpen(true)}
                className="flex items-center gap-1.5 min-h-[42px] px-3 sm:px-3.5 py-2 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-amber-400/45 text-amber-200 text-xs sm:text-sm font-medium backdrop-blur-md transition cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                title="Personalise Diwali Wish"
                aria-label="Personalise Diwali Wish"
              >
                <Wand2 className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="hidden lg:inline">Personalise</span>
              </button>

              <button
                type="button"
                onClick={() => setIsGreetingMinimized((prev) => !prev)}
                className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-amber-500/35 text-amber-200 backdrop-blur-md transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-300"
                title={isGreetingMinimized ? 'Show Greeting Card' : 'Hide Greeting Card for Full Sky View'}
                aria-label={isGreetingMinimized ? 'Show Greeting Card' : 'Hide Greeting Card'}
              >
                {isGreetingMinimized ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleToggleMute}
                className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-amber-500/35 text-amber-200 backdrop-blur-md transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-300"
                title={isMuted ? 'Unmute Festive Audio' : 'Mute Festive Audio'}
                aria-label={isMuted ? 'Unmute Festive Audio' : 'Mute Festive Audio'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-amber-300" />
                )}
              </button>

              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="hidden sm:flex items-center justify-center w-11 h-11 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-amber-500/35 text-amber-200 backdrop-blur-md transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-300"
                title="Toggle Fullscreen"
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </motion.div>
          </header>

          {/* CENTER FLOATING DIWALI GREETING CARD */}
          <AnimatePresence>
            {!isGreetingMinimized && (
              <motion.section
                key="greeting-card"
                onPointerDown={(e) => e.stopPropagation()}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.92 }}
                transition={{ duration: 0.4 }}
                className="fixed top-16 sm:top-22 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-lg pointer-events-none flex flex-col items-center text-center"
              >
                <div className="relative w-full px-4 py-4 sm:px-7 sm:py-5 rounded-3xl bg-[#0A0818]/75 backdrop-blur-md border border-amber-400/30 shadow-[0_14px_45px_rgba(0,0,0,0.75)] overflow-hidden">
                  {/* Ornamental Royal Corner Borders */}
                  <div className="absolute top-0 left-0 w-9 h-9 border-t-2 border-l-2 border-amber-400/45 rounded-tl-3xl" />
                  <div className="absolute top-0 right-0 w-9 h-9 border-t-2 border-r-2 border-amber-400/45 rounded-tr-3xl" />
                  <div className="absolute bottom-0 left-0 w-9 h-9 border-b-2 border-l-2 border-amber-400/45 rounded-bl-3xl" />
                  <div className="absolute bottom-0 right-0 w-9 h-9 border-b-2 border-r-2 border-amber-400/45 rounded-br-3xl" />

                  <p className="text-[10px] sm:text-xs uppercase tracking-[0.28em] text-amber-300/85 mb-1">
                    ✦ Festival of Lights ✦
                  </p>

                  <h2 className="font-royal text-xl sm:text-4xl font-bold gold-shimmer-text leading-tight mb-2 drop-shadow-[0_2px_16px_rgba(245,158,11,0.4)]">
                    {visitorName ? `Happy Diwali, ${visitorName}!` : 'Happy Diwali'}
                  </h2>

                  <p className="font-serif-elegant italic text-amber-100/90 text-xs sm:text-sm leading-relaxed max-w-md mx-auto mb-3.5">
                    “May the light of millions of diyas illuminate your life with happiness, prosperity, peace and endless possibilities.”
                  </p>

                  {/* Interactive Actions inside Greeting */}
                  <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsWishModalOpen(true)}
                      className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/45 text-amber-200 text-xs font-medium transition cursor-pointer"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                      <span>{visitorName ? 'Edit Name' : 'Add Your Name'}</span>
                    </button>

                    {visitorName && (
                      <button
                        type="button"
                        onClick={() => triggerSkyNameIllumination(visitorName)}
                        className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 rounded-full bg-purple-500/25 hover:bg-purple-500/40 border border-purple-400/45 text-purple-100 text-xs font-medium transition cursor-pointer"
                      >
                        <Stars className="w-3.5 h-3.5 text-amber-300" />
                        <span>Light Name in Sky</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleWhatsAppShare}
                      className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 rounded-full bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-400/45 text-emerald-100 text-xs font-medium transition cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Share Wish</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsGreetingMinimized(true)}
                      className="inline-flex items-center gap-1 min-h-[36px] px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/15 text-amber-200/75 text-xs transition cursor-pointer"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Sky View</span>
                    </button>
                  </div>
                </div>

                {/* Subtle Animated Rangoli Underneath Greeting */}
                <div className="w-16 h-16 sm:w-24 sm:h-24 -mt-3 opacity-90">
                  <AnimatedRangoli />
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* FLOATING SURPRISE GIFT BOX BUTTON (Safely positioned above bottom dock) */}
          <motion.div
            onPointerDown={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="fixed right-3 sm:right-6 bottom-36 sm:bottom-36 z-30"
          >
            <motion.button
              type="button"
              onClick={handleOpenGiftBox}
              whileHover={{ scale: 1.08, rotate: [0, -5, 5, 0] }}
              whileTap={{ scale: 0.92 }}
              className="group relative flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-600 p-0.5 shadow-[0_0_25px_rgba(245,158,11,0.65)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-200"
              title="Open Your Diwali Surprise Gift!"
              aria-label="Open Your Diwali Surprise Gift"
            >
              <div className="w-full h-full rounded-[14px] bg-slate-950/85 flex flex-col items-center justify-center">
                <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300 animate-bounce" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-200 mt-0.5">
                  Blessing
                </span>
              </div>
              {giftOpenedCount === 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400" />
                </span>
              )}
            </motion.button>
          </motion.div>

          {/* ==========================================
              BOTTOM MOBILE-FIRST FIREWORKS CONTROL DOCK
          ========================================== */}
          <motion.footer
            onPointerDown={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.45 }}
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 w-[96%] max-w-3xl pointer-events-auto"
          >
            <div className="rounded-3xl bg-[#090818]/88 backdrop-blur-xl border border-amber-500/40 shadow-[0_12px_45px_rgba(0,0,0,0.9)] p-2 sm:p-3">
              {/* Collapsible Secondary Drawer for Rocket Burst Shape & Intensity on Mobile */}
              <AnimatePresence>
                {isDockExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-2 pb-2 border-b border-amber-500/20"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 px-1 text-xs">
                      {/* Rocket Burst Geometry Selector */}
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[11px] text-amber-300/80 mr-1 font-medium">
                          Burst Shape:
                        </span>
                        {BURST_PATTERNS.map((pat) => (
                          <button
                            key={pat.id}
                            type="button"
                            onClick={() => setBurstPattern(pat.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                              burstPattern === pat.id
                                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                                : 'bg-white/5 text-amber-100/75 hover:bg-white/10'
                            }`}
                          >
                            {pat.label}
                          </button>
                        ))}
                      </div>

                      {/* Intensity Selector */}
                      <div className="flex items-center gap-1 bg-white/5 rounded-xl p-0.5 border border-white/10">
                        <Sliders className="w-3.5 h-3.5 text-amber-400 ml-2 mr-1" />
                        {(['low', 'medium', 'high'] as IntensityLevel[]).map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setIntensity(lvl)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] capitalize font-medium transition cursor-pointer ${
                              intensity === lvl
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'text-amber-100/70 hover:text-amber-100'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Primary Row: 5 Traditional Indian Firecracker Buttons (>=48px touch height) */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 mb-2">
                {CRACKER_OPTIONS.map((cracker) => {
                  const isSelected = selectedCracker === cracker.id;
                  return (
                    <motion.button
                      key={cracker.id}
                      type="button"
                      onClick={() => setSelectedCracker(cracker.id)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.94 }}
                      aria-pressed={isSelected}
                      className={`relative flex flex-col items-center justify-center min-h-[58px] sm:min-h-[68px] py-1.5 px-1 sm:px-2.5 rounded-2xl border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-300 ${
                        isSelected
                          ? 'bg-gradient-to-b from-amber-500/35 to-orange-600/25 border-2 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-[1.02]'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-amber-100/70'
                      }`}
                    >
                      <CrackerIllustratedIcon type={cracker.id} active={isSelected} />
                      <span
                        className={`text-[10px] sm:text-xs font-semibold mt-1 truncate max-w-full ${
                          isSelected ? 'text-amber-100 font-bold' : 'text-amber-100/75'
                        }`}
                      >
                        <span className="sm:hidden">{cracker.shortName}</span>
                        <span className="hidden sm:inline">{cracker.name}</span>
                      </span>
                      <span className="text-[9px] text-amber-300/75 hidden sm:block">
                        {cracker.hindiName}
                      </span>
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_8px_#FDE047]" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Compact Bottom Bar: Celebration Mode, Pause, Options Toggle & Clear Sky */}
              <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-amber-500/20 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setCelebrationMode((prev) => (prev === 'auto' ? 'manual' : 'auto'))
                    }
                    className={`flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl font-medium border transition cursor-pointer ${
                      celebrationMode === 'auto'
                        ? 'bg-amber-500/25 border-amber-400/60 text-amber-200'
                        : 'bg-white/5 border-white/15 text-amber-100/75 hover:text-amber-100'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{celebrationMode === 'auto' ? 'Auto: ON' : 'Manual Tap'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPaused((prev) => !prev)}
                    className="flex items-center gap-1 min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-amber-200 transition cursor-pointer"
                    title={isPaused ? 'Resume Fireworks' : 'Pause Fireworks'}
                    aria-label={isPaused ? 'Resume Fireworks' : 'Pause Fireworks'}
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-amber-200/80 hidden lg:block truncate">
                  {selectedCracker === 'phuljhadi'
                    ? '✨ Drag across the sky to wave your Sparkler!'
                    : '🎆 Tap the sky or palace windows to celebrate!'}
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsDockExpanded((prev) => !prev)}
                    className="flex items-center gap-1 min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-amber-200 text-xs font-medium transition cursor-pointer"
                    title="Customize Burst Shapes & Intensity"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-300" />
                    <span className="hidden sm:inline">Effects</span>
                    {isDockExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleClearSky}
                    className="flex items-center justify-center min-h-[38px] min-w-[38px] p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-400/40 text-amber-200/75 hover:text-rose-200 transition cursor-pointer"
                    title="Clear Sky"
                    aria-label="Clear Sky"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.footer>
        </>
      )}

      {/* ==========================================
          PERSONALISED WISH GENERATOR MODAL
      ========================================== */}
      <AnimatePresence>
        {isWishModalOpen && (
          <motion.div
            key="wish-modal"
            onPointerDown={(e) => e.stopPropagation()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wish-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#15102E] to-[#080716] border border-amber-400/45 p-5 sm:p-7 shadow-[0_0_60px_rgba(245,158,11,0.35)] my-auto"
            >
              <button
                type="button"
                onClick={() => setIsWishModalOpen(false)}
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-amber-200 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/40">
                  <Wand2 className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 id="wish-modal-title" className="font-royal text-lg sm:text-xl font-bold text-amber-200">
                    Personalise Diwali Wish
                  </h3>
                  <p className="text-xs text-amber-100/70">
                    Illuminate a name in the sky & share a custom greeting link
                  </p>
                </div>
              </div>

              <form onSubmit={handleGenerateWish} className="space-y-4">
                <div>
                  <label
                    htmlFor="recipient-name-input"
                    className="block text-xs uppercase tracking-wider text-amber-300/85 mb-1.5 font-medium"
                  >
                    Recipient&apos;s Name
                  </label>
                  <input
                    id="recipient-name-input"
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g., Aarav, Priya, Sharma Family..."
                    maxLength={32}
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-amber-500/45 focus:border-amber-300 focus:outline-none text-amber-100 placeholder-amber-200/35 text-sm"
                  />
                </div>

                {/* Live Greeting Preview */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-center">
                  <p className="font-royal text-base sm:text-lg font-bold gold-shimmer-text mb-1">
                    Happy Diwali
                    {sanitizeRecipientName(nameInput) ? `, ${sanitizeRecipientName(nameInput)}!` : '!'}
                  </p>
                  <p className="text-xs text-amber-100/80 italic">
                    “May the light of millions of diyas illuminate your life with happiness, prosperity, peace and endless possibilities.”
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[46px] py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-bold text-sm shadow-lg hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Illuminate Name in Sky & Save</span>
                </button>
              </form>

              {/* Share & Copy Actions */}
              <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-amber-500/20">
                <button
                  type="button"
                  onClick={handleCopyGreeting}
                  className="flex items-center justify-center gap-2 min-h-[44px] py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-amber-200 text-xs font-medium transition cursor-pointer"
                >
                  {copiedToast ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Copied Link!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-300" />
                      <span>Copy Wish Link</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="flex items-center justify-center gap-2 min-h-[44px] py-2.5 px-3 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/45 border border-emerald-400/40 text-emerald-100 text-xs font-medium transition cursor-pointer"
                >
                  <Send className="w-4 h-4 text-emerald-300" />
                  <span>WhatsApp Share</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          SURPRISE GIFT BOX REVEAL MODAL
      ========================================== */}
      <AnimatePresence>
        {isGiftModalOpen && (
          <motion.div
            key="gift-modal"
            onPointerDown={(e) => e.stopPropagation()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="gift-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.75, rotate: -3 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.82, opacity: 0 }}
              transition={{ type: 'spring', damping: 16 }}
              className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#1F1438] via-[#120D26] to-[#080714] border-2 border-amber-400/60 p-6 sm:p-7 text-center shadow-[0_0_80px_rgba(245,158,11,0.5)] overflow-hidden my-auto"
            >
              <button
                type="button"
                onClick={() => setIsGiftModalOpen(false)}
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-amber-200 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mx-auto mb-4 relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-amber-400/35 blur-xl animate-pulse" />
                <motion.div
                  initial={{ scale: 0.5, rotate: -15 }}
                  animate={{ scale: [1, 1.12, 1], rotate: [0, 6, -6, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity }}
                  className="relative z-10 p-5 rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-300 to-orange-600 shadow-xl"
                >
                  <Heart className="w-10 h-10 text-slate-950 fill-slate-950" />
                </motion.div>
              </div>

              <p className="text-xs uppercase tracking-[0.28em] text-amber-300 mb-2">
                ✨ Royal Deepavali Blessing ✨
              </p>

              <h3
                id="gift-modal-title"
                className="font-royal text-xl sm:text-3xl font-bold gold-shimmer-text leading-snug mb-3"
              >
                “You deserve all the happiness and light in the world!”
              </h3>

              <p className="text-xs sm:text-sm text-amber-100/85 leading-relaxed mb-6">
                {visitorName
                  ? `Dear ${visitorName}, may Goddess Lakshmi and Lord Ganesha bless your home with radiant health, harmony, and boundless prosperity this festive season.`
                  : 'May Goddess Lakshmi and Lord Ganesha bless your home with radiant health, harmony, and boundless prosperity this festive season.'}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsGiftModalOpen(false);
                    startGrandFinaleShow();
                  }}
                  className="w-full sm:w-auto min-h-[46px] px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg hover:brightness-110 transition cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  <span>Launch 20s Grand Finale Show!</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;