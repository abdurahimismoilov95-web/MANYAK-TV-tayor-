/**
 * MANYK TV - Advanced Device Security & Strict HWID Binding System
 * Provides multi-layer device fingerprinting (Canvas, WebGL, Audio, OS, Screen, CPU),
 * anti-piracy protections, hardware bans, and strict HWID binding with deviation detection.
 */

import { DeviceCharacteristics, HWIDBindingRecord, SystemSettings, UserProfile } from '../types';

const HWID_STORAGE_KEY = 'manyak_tv_hwid_v1';
const HWID_PROFILE_STORAGE_KEY = 'manyak_tv_device_profile_v1';
const HWID_COOKIE_NAME = 'manyak_hwid_token';

// Simple deterministic hash generator (Murmur/DJB2 hybrid)
export function simpleHash(str: string): string {
  let hash1 = 5381;
  let hash2 = 52711;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = ((hash2 << 5) + hash2) ^ char;
  }
  const combined = (hash1 >>> 0).toString(36) + (hash2 >>> 0).toString(36);
  return combined.toUpperCase();
}

// 1. Canvas Fingerprinting
function getCanvasFingerprint(): string {
  try {
    if (typeof document === 'undefined') return 'CANVAS_SSR';
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'CANVAS_NO_2D';

    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial', 'Helvetica', sans-serif";
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);

    // Text with complex emojis and shadow
    ctx.fillStyle = '#069';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText('MANYK_TV_HWID#2026🎬🍿', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('MANYK_TV_HWID#2026🎬🍿', 4, 17);

    // Geometry and curve rendering
    ctx.strokeStyle = '#f0f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(50, 45, 12, 0, Math.PI * 2, true);
    ctx.stroke();

    return simpleHash(canvas.toDataURL());
  } catch {
    return 'CANVAS_FALLBACK';
  }
}

// 2. WebGL Fingerprinting (Unmasked Vendor & Renderer)
function getWebGLFingerprint(): { vendor: string; renderer: string } {
  try {
    if (typeof document === 'undefined') {
      return { vendor: 'SSR_VENDOR', renderer: 'SSR_RENDERER' };
    }
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) {
      return { vendor: 'NO_WEBGL', renderer: 'NO_WEBGL' };
    }

    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = ext
      ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || gl.getParameter(gl.VENDOR)
      : gl.getParameter(gl.VENDOR);
    const renderer = ext
      ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || gl.getParameter(gl.RENDERER)
      : gl.getParameter(gl.RENDERER);

    return {
      vendor: String(vendor || 'unknown_vendor').trim(),
      renderer: String(renderer || 'unknown_renderer').trim(),
    };
  } catch {
    return { vendor: 'WEBGL_ERR', renderer: 'WEBGL_ERR' };
  }
}

// 3. Audio Context Characteristics
function getAudioFingerprint(): number | undefined {
  try {
    if (typeof window === 'undefined') return undefined;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return undefined;
    const ctx = new AudioCtx();
    const rate = ctx.sampleRate;
    if (ctx.state !== 'closed' && typeof ctx.close === 'function') {
      ctx.close().catch(() => {});
    }
    return rate;
  } catch {
    return undefined;
  }
}

// Detect Operating System Family
export function getOSFamily(
  ua: string,
  platform: string
): 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux' | 'Other' {
  const combined = `${ua} ${platform}`.toLowerCase();
  if (/iphone|ipad|ipod/.test(combined)) return 'iOS';
  if (/android/.test(combined)) return 'Android';
  if (/windows|win32|win64/.test(combined)) return 'Windows';
  if (/macintosh|mac os x/.test(combined) && !/iphone|ipad|ipod/.test(combined)) return 'macOS';
  if (/linux/.test(combined)) return 'Linux';
  return 'Other';
}

// Collect comprehensive device characteristics
export function collectDeviceCharacteristics(): DeviceCharacteristics {
  const nav = typeof navigator !== 'undefined' ? navigator : ({} as Navigator);
  const scr = typeof window !== 'undefined' ? window.screen : { width: 0, height: 0, colorDepth: 0, pixelDepth: 0 };
  const userAgent = nav.userAgent || 'unknown_ua';
  const platform = nav.platform || 'unknown_platform';
  const osFamily = getOSFamily(userAgent, platform);
  const maxTouchPoints = nav.maxTouchPoints || 0;
  const isMobile = maxTouchPoints > 0 && /mobile|iphone|ipad|android/i.test(userAgent);
  const webgl = getWebGLFingerprint();
  const canvasHash = getCanvasFingerprint();
  const audioSampleRate = getAudioFingerprint();

  return {
    userAgent,
    platform,
    osFamily,
    isMobile,
    screenResolution: `${scr.width || 0}x${scr.height || 0}`,
    colorDepth: scr.colorDepth || 24,
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    hardwareConcurrency: nav.hardwareConcurrency || 4,
    deviceMemory: (nav as unknown as { deviceMemory?: number }).deviceMemory,
    maxTouchPoints,
    timeZone: Intl?.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tashkent' : 'Asia/Tashkent',
    language: nav.language || 'uz',
    languages: nav.languages ? Array.from(nav.languages) : [nav.language || 'uz'],
    canvasHash,
    webglVendor: webgl.vendor,
    webglRenderer: webgl.renderer,
    audioSampleRate,
  };
}

// Generate a deterministic Hardware ID (HWID) from immutable hardware traits
export function generateHWIDFromCharacteristics(chars: DeviceCharacteristics): string {
  const hardwareSignature = [
    chars.osFamily,
    chars.platform,
    chars.hardwareConcurrency,
    chars.screenResolution,
    chars.colorDepth,
    chars.pixelRatio,
    chars.maxTouchPoints > 0 ? 'touch' : 'mouse',
    chars.webglVendor,
    chars.webglRenderer,
    chars.canvasHash,
    chars.timeZone,
  ].join(':::');

  const hash = simpleHash(hardwareSignature);
  return `HWID_${chars.osFamily.toUpperCase()}_${hash}`;
}

// Generate or retrieve persistent hardware device token
export function getOrCreateDeviceFingerprint(): string {
  try {
    const chars = collectDeviceCharacteristics();
    const deterministicHWID = generateHWIDFromCharacteristics(chars);

    // Cache profile and HWID
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(HWID_STORAGE_KEY, deterministicHWID);
      localStorage.setItem(HWID_PROFILE_STORAGE_KEY, JSON.stringify(chars));
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(HWID_STORAGE_KEY, deterministicHWID);
    }
    if (typeof document !== 'undefined') {
      const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `${HWID_COOKIE_NAME}=${deterministicHWID}; expires=${expires}; path=/; SameSite=Lax`;
    }

    return deterministicHWID;
  } catch (err) {
    console.warn('Device fingerprint generation fallback', err);
    return 'HWID_UNKNOWN_DEVICE';
  }
}

// Create an authoritative HWID Binding record for a user
export function createHWIDBinding(chars: DeviceCharacteristics): HWIDBindingRecord {
  const hwid = generateHWIDFromCharacteristics(chars);
  const cleanRenderer =
    chars.webglRenderer && chars.webglRenderer !== 'unknown_renderer' && chars.webglRenderer !== 'NO_WEBGL'
      ? chars.webglRenderer.replace(/ANGLE \((.*)\)/, '$1').trim()
      : chars.platform;

  return {
    hwid,
    boundAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    characteristics: chars,
    deviceSummary: `${chars.osFamily} (${cleanRenderer}, ${chars.screenResolution})`,
    loginCount: 1,
  };
}

// Bind a user profile to the current device characteristics
export function bindUserToCurrentDevice(user: UserProfile): UserProfile {
  const chars = collectDeviceCharacteristics();
  const binding = createHWIDBinding(chars);
  user.hwidBinding = binding;
  user.deviceToken = binding.hwid;
  user.lastLoginAt = new Date().toISOString();
  return user;
}

export interface DeviceDeviationResult {
  isSignificantDeviation: boolean;
  deviationScore: number;
  reasons: string[];
  boundSummary: string;
  currentSummary: string;
}

/**
 * Strict evaluation of hardware & browser characteristics between the
 * previously bound login session and the current device environment.
 */
export function evaluateDeviceDeviation(
  bound: DeviceCharacteristics,
  current: DeviceCharacteristics
): DeviceDeviationResult {
  let deviationScore = 0;
  const reasons: string[] = [];

  // 1. Operating System Family Mismatch (Critical - e.g. iOS vs Android or Windows)
  if (bound.osFamily !== current.osFamily && bound.osFamily !== 'Other' && current.osFamily !== 'Other') {
    deviationScore += 55;
    reasons.push(`Operatsion tizim o'zgargan: avvalgi (${bound.osFamily}) vs joriy (${current.osFamily})`);
  }

  // 2. Touch vs Desktop Architecture Mismatch (Mobile phone vs Desktop PC)
  const boundIsTouch = bound.maxTouchPoints > 0 || bound.isMobile;
  const currentIsTouch = current.maxTouchPoints > 0 || current.isMobile;
  if (boundIsTouch !== currentIsTouch) {
    deviationScore += 40;
    reasons.push(
      `Qurilma turi mos kelmadi: avvalgi (${boundIsTouch ? 'Mobil/Sensorli' : 'Desktop/Kompyuter'}) vs joriy (${currentIsTouch ? 'Mobil/Sensorli' : 'Desktop/Kompyuter'})`
    );
  }

  // 3. GPU / WebGL Video Card Deviation (e.g. Apple GPU vs Qualcomm Adreno vs Intel Iris)
  if (
    bound.webglRenderer &&
    current.webglRenderer &&
    bound.webglRenderer !== 'unknown_renderer' &&
    current.webglRenderer !== 'unknown_renderer' &&
    bound.webglRenderer !== 'NO_WEBGL' &&
    current.webglRenderer !== 'NO_WEBGL' &&
    bound.webglRenderer !== current.webglRenderer
  ) {
    const bLow = bound.webglRenderer.toLowerCase();
    const cLow = current.webglRenderer.toLowerCase();
    const isDifferentGpuFamily =
      bLow.includes('apple') !== cLow.includes('apple') ||
      bLow.includes('adreno') !== cLow.includes('adreno') ||
      bLow.includes('mali') !== cLow.includes('mali') ||
      bLow.includes('nvidia') !== cLow.includes('nvidia') ||
      bLow.includes('intel') !== cLow.includes('intel') ||
      bLow.includes('amd') !== cLow.includes('amd') ||
      bLow.includes('powervr') !== cLow.includes('powervr');

    if (isDifferentGpuFamily) {
      deviationScore += 45;
      reasons.push(`Video karta (GPU) butunlay boshqa: avvalgi (${bound.webglRenderer}) vs joriy (${current.webglRenderer})`);
    } else {
      deviationScore += 15;
    }
  }

  // 4. CPU Hardware Concurrency (Cores Count Difference >= 2)
  if (
    bound.hardwareConcurrency &&
    current.hardwareConcurrency &&
    Math.abs(bound.hardwareConcurrency - current.hardwareConcurrency) >= 2
  ) {
    deviationScore += 25;
    reasons.push(
      `CPU yadrolari soni farq qiladi: avvalgi (${bound.hardwareConcurrency}) vs joriy (${current.hardwareConcurrency})`
    );
  }

  // 5. Screen Resolution & Form Factor (>25% total pixel difference)
  if (bound.screenResolution && current.screenResolution && bound.screenResolution !== current.screenResolution) {
    const [bw, bh] = bound.screenResolution.split('x').map(Number);
    const [cw, ch] = current.screenResolution.split('x').map(Number);
    if (bw && bh && cw && ch) {
      const bPixels = bw * bh;
      const cPixels = cw * ch;
      const ratioDiff = Math.abs(bPixels - cPixels) / Math.max(bPixels, cPixels);
      if (ratioDiff > 0.25) {
        deviationScore += 25;
        reasons.push(`Ekran o'lchami keskin farq qiladi: avvalgi (${bound.screenResolution}) vs joriy (${current.screenResolution})`);
      }
    }
  }

  // 6. Canvas Fingerprint Rasterization
  if (
    bound.canvasHash &&
    current.canvasHash &&
    bound.canvasHash !== 'CANVAS_FALLBACK' &&
    current.canvasHash !== 'CANVAS_FALLBACK' &&
    bound.canvasHash !== current.canvasHash
  ) {
    deviationScore += 20;
    reasons.push("Grafik render (Canvas) barmoq izi mos kelmadi");
  }

  // 7. Timezone Jump
  if (bound.timeZone && current.timeZone && bound.timeZone !== current.timeZone) {
    deviationScore += 15;
    reasons.push(`Vaqt mintaqasi farq qiladi: avvalgi (${bound.timeZone}) vs joriy (${current.timeZone})`);
  }

  // Strict Threshold: score >= 40 indicates significant deviation from previous session
  const isSignificantDeviation = deviationScore >= 40;

  const boundSummary = `${bound.osFamily} (${bound.webglRenderer && bound.webglRenderer !== 'unknown_renderer' ? bound.webglRenderer : bound.platform}, ${bound.screenResolution})`;
  const currentSummary = `${current.osFamily} (${current.webglRenderer && current.webglRenderer !== 'unknown_renderer' ? current.webglRenderer : current.platform}, ${current.screenResolution})`;

  return {
    isSignificantDeviation,
    deviationScore,
    reasons,
    boundSummary,
    currentSummary,
  };
}

export interface SecurityCheckResult {
  isAllowed: boolean;
  banType?: 'user' | 'device' | 'not_telegram' | 'hwid_mismatch';
  reason?: string;
  deviationScore?: number;
  deviationReasons?: string[];
  boundDeviceSummary?: string;
  currentDeviceSummary?: string;
}

export function isRunningInTelegram(): boolean {
  if (typeof window === 'undefined') return false;
  const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string; platform?: string } } }).Telegram?.WebApp;
  // If Telegram WebApp object has initData or is inside telegram platform
  if (tg && (Boolean(tg.initData) || (Boolean(tg.platform) && tg.platform !== 'unknown' && tg.platform !== 'weba'))) {
    return true;
  }
  // Check URL hash or search query params for Telegram initData
  if (
    window.location.hash.includes('tgWebAppData') ||
    window.location.search.includes('tgWebAppData') ||
    window.location.search.includes('tgWebAppVersion')
  ) {
    return true;
  }
  return false;
}

/**
 * Strict Security & HWID Verification:
 * 1. Hardware Token Ban
 * 2. Telegram User ID Ban
 * 3. Telegram WebApp enforcement
 * 4. Stricter HWID Binding check with deviation prevention
 */
export function checkAccessSecurity(
  userId: string,
  settings: SystemSettings,
  isAdmin = false,
  userProfile?: UserProfile | null
): SecurityCheckResult {
  const currentHWID = getOrCreateDeviceFingerprint();
  const currentChars = collectDeviceCharacteristics();

  // 1. Check Hardware / Device Ban (Applies even if user changes Telegram account on same device)
  if (
    settings.bannedDeviceTokens &&
    (settings.bannedDeviceTokens.includes(currentHWID) ||
      (typeof localStorage !== 'undefined' && settings.bannedDeviceTokens.includes(localStorage.getItem(HWID_STORAGE_KEY) || '')))
  ) {
    return {
      isAllowed: false,
      banType: 'device',
      reason:
        "Ushbu qurilma (telefon/kompyuter) xavfsizlik qoidalarini buzganlik sababli MANYK TV tizimidan butunlay bloklangan. Boshqa Telegram akkaunt ochsangiz ham ushbu qurilmadan kirish imkonsiz!",
    };
  }

  // 2. Check User ID Ban
  if (settings.bannedUserIds && settings.bannedUserIds.includes(userId)) {
    return {
      isAllowed: false,
      banType: 'user',
      reason: `Sizning Telegram hisobingiz (#${userId}) admin tomonidan bloklangan.`,
    };
  }

  // 3. Telegram WebApp indicator (No hard-block: users can access the site and verify via bot or use the bot directly)
  // Hard blocking is reserved only for banned devices and banned user IDs.

  // 4. Stricter HWID Binding Check (Prevent account access if device characteristics significantly deviate)
  if (userProfile && userProfile.hwidBinding) {
    const deviation = evaluateDeviceDeviation(userProfile.hwidBinding.characteristics, currentChars);

    if (deviation.isSignificantDeviation) {
      // Admins are alerted but granted access to manage the system
      if (isAdmin) {
        console.warn('[HWID Security] Admin accessing from deviating device:', deviation);
      } else {
        return {
          isAllowed: false,
          banType: 'hwid_mismatch',
          reason: `Xavfsizlik ogohlantiruvi: Ushbu akkaunt avval biriktirilgan qurilmadan sezilarli darajada farq qilmoqda (${deviation.reasons.join(', ')}). Boshqa qurilmadan ruxsatsiz kirish cheklangan!`,
          deviationScore: deviation.deviationScore,
          deviationReasons: deviation.reasons,
          boundDeviceSummary: deviation.boundSummary,
          currentDeviceSummary: deviation.currentSummary,
        };
      }
    }
  }

  return { isAllowed: true };
}

// Reset HWID binding for a user (Called by Admin when user genuinely changes device)
export function resetUserHWIDBinding(userId: string): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;

    // Update in all users directory
    const rawUsers = localStorage.getItem('manyak_tv_users_v1');
    if (rawUsers) {
      const users: UserProfile[] = JSON.parse(rawUsers);
      const user = users.find((u) => u.id === userId);
      if (user) {
        delete user.hwidBinding;
        user.deviceToken = undefined;
        localStorage.setItem('manyak_tv_users_v1', JSON.stringify(users));
      }
    }

    // Update in current user session if it matches
    const rawCurrent = localStorage.getItem('manyak_tv_current_user_v1');
    if (rawCurrent) {
      const current: UserProfile = JSON.parse(rawCurrent);
      if (current.id === userId) {
        delete current.hwidBinding;
        current.deviceToken = undefined;
        localStorage.setItem('manyak_tv_current_user_v1', JSON.stringify(current));
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('manyak_storage_update'));
    }
    return true;
  } catch (err) {
    console.error('Error resetting HWID binding', err);
    return false;
  }
}

// Anti-piracy & inspect protection
export function initSecurityGuards(): () => void {
  if (typeof window === 'undefined') return () => {};

  // Disable right-click context menu (prevents video download, save-as, inspecting)
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    return false;
  };

  // Keyboard shortcut protection (F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S, Ctrl+P)
  const handleKeyDown = (e: KeyboardEvent) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
      (e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'p'))
    ) {
      e.preventDefault();
      return false;
    }
  };

  // Prevent drag and drop of media assets
  const handleDragStart = (e: DragEvent) => {
    e.preventDefault();
    return false;
  };

  window.addEventListener('contextmenu', handleContextMenu);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('dragstart', handleDragStart);

  return () => {
    window.removeEventListener('contextmenu', handleContextMenu);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('dragstart', handleDragStart);
  };
}
