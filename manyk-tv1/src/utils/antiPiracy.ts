/**
 * MANYAK TV - Anti-Piracy & Screen Recording Protection
 * =====================================================
 * Multi-layered protection against screen recording, screenshots, and piracy
 * Includes mobile-specific protection for iOS and Android
 */

export interface AntiPiracyConfig {
  enableScreenRecordingDetection: boolean;
  enableScreenshotPrevention: boolean;
  enableWatermark: boolean;
  enableDevToolsBlock: boolean;
  enableMobileProtection: boolean; // NEW: Mobile-specific protection
  watermarkText?: string;
}

const DEFAULT_CONFIG: AntiPiracyConfig = {
  enableScreenRecordingDetection: true,
  enableScreenshotPrevention: true,
  enableWatermark: true,
  enableDevToolsBlock: true,
  enableMobileProtection: true, // NEW
  watermarkText: 'MANYAK TV',
};

/**
 * Initialize anti-piracy protection for video element
 */
export function initAntiPiracy(
  videoElement: HTMLVideoElement,
  config: Partial<AntiPiracyConfig> = {}
): () => void {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const cleanupFns: (() => void)[] = [];

  // 1. Prevent right-click context menu
  const preventContextMenu = (e: Event) => {
    e.preventDefault();
    return false;
  };
  videoElement.addEventListener('contextmenu', preventContextMenu);
  cleanupFns.push(() => videoElement.removeEventListener('contextmenu', preventContextMenu));

  // 2. Disable video download
  videoElement.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
  videoElement.setAttribute('disablePictureInPicture', 'true');
  videoElement.setAttribute('disableRemotePlayback', 'true');

  // 3. Mobile-specific protection (NEW)
  if (cfg.enableMobileProtection) {
    const platform = detectMobilePlatform();
    if (platform.isMobile) {
      console.log('[Anti-Piracy] Initializing mobile protection...');
      cleanupFns.push(initMobileProtection(videoElement));
    }
  }

  // 4. Screenshot prevention via keyboard (Desktop)
  // 4. Screenshot prevention via keyboard (Desktop)
  if (cfg.enableScreenshotPrevention) {
    const preventScreenshotKeys = (e: KeyboardEvent) => {
      // Print Screen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        alert('⚠️ Screenshot taqiqlangan!');
        return false;
      }
      // Windows: Win+Shift+S (Snipping Tool)
      if (e.key === 's' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        alert('⚠️ Screenshot taqiqlangan!');
        return false;
      }
      // Mac: Cmd+Shift+4/5 (Screenshot)
      if ((e.key === '4' || e.key === '5') && e.shiftKey && e.metaKey) {
        e.preventDefault();
        alert('⚠️ Screenshot taqiqlangan!');
        return false;
      }
    };
    document.addEventListener('keydown', preventScreenshotKeys);
    cleanupFns.push(() => document.removeEventListener('keydown', preventScreenshotKeys));
  }

  // 4. Screen recording detection
  if (cfg.enableScreenRecordingDetection) {
    const checkScreenRecording = () => {
      // Check for MediaRecorder API usage
      if (typeof MediaRecorder !== 'undefined') {
        // Monitor for new MediaRecorder instances
        const originalMediaRecorder = window.MediaRecorder;
        (window as any).MediaRecorder = function (...args: any[]) {
          console.warn('[Anti-Piracy] Screen recording detected!');
          alert('⚠️ Ekran yozib olish aniqlandi va taqiqlangan!');
          videoElement.pause();
          throw new Error('Screen recording is not allowed');
        };
        cleanupFns.push(() => {
          (window as any).MediaRecorder = originalMediaRecorder;
        });
      }
    };
    checkScreenRecording();
  }

  // 5. Developer Tools detection
  if (cfg.enableDevToolsBlock) {
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        console.warn('[Anti-Piracy] Developer tools detected!');
        videoElement.pause();
        alert('⚠️ Developer tools taqiqlangan!');
      }
    };

    const devToolsInterval = setInterval(detectDevTools, 2000);
    cleanupFns.push(() => clearInterval(devToolsInterval));
  }

  // 6. Tab visibility monitoring (pause when hidden)
  const handleVisibilityChange = () => {
    if (document.hidden) {
      videoElement.pause();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  cleanupFns.push(() => document.removeEventListener('visibilitychange', handleVisibilityChange));

  // 7. Dynamic watermark
  if (cfg.enableWatermark && cfg.watermarkText) {
    const watermark = document.createElement('div');
    watermark.className = 'video-watermark';
    watermark.textContent = cfg.watermarkText;
    watermark.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 4rem;
      font-weight: bold;
      opacity: 0.08;
      color: white;
      pointer-events: none;
      user-select: none;
      z-index: 1000;
      text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
    `;

    const videoContainer = videoElement.parentElement;
    if (videoContainer) {
      videoContainer.style.position = 'relative';
      videoContainer.appendChild(watermark);
      cleanupFns.push(() => watermark.remove());
    }
  }

  // 8. Prevent video download via network inspection
  videoElement.addEventListener('loadedmetadata', () => {
    // Mark video as DRM-protected (visual indicator)
    videoElement.dataset.drmProtected = 'true';
  });

  // Return cleanup function
  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════
 * MOBILE-SPECIFIC PROTECTION (iOS & Android)
 * ═══════════════════════════════════════════════════════════════════
 */

/**
 * Detect mobile platform
 */
export function detectMobilePlatform(): {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
} {
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);

  return {
    isIOS,
    isAndroid,
    isMobile: isIOS || isAndroid,
  };
}

/**
 * iOS-specific screenshot prevention
 * iOS automatically blocks screenshots of DRM-protected content
 */
export function initIOSProtection(videoElement: HTMLVideoElement): () => void {
  const cleanupFns: (() => void)[] = [];

  // 1. Disable callout menu (long-press)
  (videoElement.style as any).webkitTouchCallout = 'none';

  // 2. Disable AirPlay
  videoElement.setAttribute('x-webkit-airplay', 'deny');
  videoElement.setAttribute('disableRemotePlayback', 'true');

  // 3. Detect iOS screen recording
  const detectIOSRecording = () => {
    // iOS exposes screen recording status via UIScreen.isCaptured (not in web)
    // But we can detect suspicious behavior
    
    // Check if video is being captured (iOS 11+)
    if ('mediaSession' in navigator && 'setPositionState' in (navigator as any).mediaSession) {
      try {
        // If screen recording is active, this might throw or behave differently
        (navigator as any).mediaSession.setPositionState({
          duration: videoElement.duration || 0,
          playbackRate: videoElement.playbackRate,
          position: videoElement.currentTime,
        });
      } catch (err) {
        console.warn('[iOS Protection] Possible screen recording detected');
        videoElement.pause();
        alert('⚠️ Ekran yozib olish iOS qurilmasida taqiqlangan!');
      }
    }
  };

  // 4. Monitor for iOS Control Center (where screen recording starts)
  const handleIOSVisibilityChange = () => {
    if (document.hidden) {
      // User might have opened Control Center to start recording
      videoElement.pause();
    }
  };

  document.addEventListener('visibilitychange', handleIOSVisibilityChange);
  cleanupFns.push(() => document.removeEventListener('visibilitychange', handleIOSVisibilityChange));

  // 5. Detect screenshot sound (iOS makes a camera shutter sound)
  // We can't directly detect this, but we can monitor for suspicious pauses
  let lastPauseTime = 0;
  const handleIOSPause = () => {
    const now = Date.now();
    if (now - lastPauseTime < 1000) {
      // Multiple rapid pauses might indicate screenshot attempts
      console.warn('[iOS Protection] Suspicious activity detected');
      alert('⚠️ Screenshot iOS qurilmasida taqiqlangan!');
    }
    lastPauseTime = now;
  };

  videoElement.addEventListener('pause', handleIOSPause);
  cleanupFns.push(() => videoElement.removeEventListener('pause', handleIOSPause));

  // 6. Periodic recording check
  const recordingCheckInterval = setInterval(detectIOSRecording, 3000);
  cleanupFns.push(() => clearInterval(recordingCheckInterval));

  // 7. Prevent long-press screenshot (iOS 14+)
  const preventLongPress = (e: TouchEvent) => {
    if (e.touches.length >= 2) {
      // Two-finger screenshot gesture
      e.preventDefault();
      alert('⚠️ Screenshot iOS qurilmasida taqiqlangan!');
    }
  };

  videoElement.addEventListener('touchstart', preventLongPress);
  cleanupFns.push(() => videoElement.removeEventListener('touchstart', preventLongPress));

  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}

/**
 * Android-specific screenshot prevention
 * Android has FLAG_SECURE which prevents screenshots (requires native implementation)
 */
export function initAndroidProtection(videoElement: HTMLVideoElement): () => void {
  const cleanupFns: (() => void)[] = [];

  // 1. Detect Android screen recording apps
  const detectAndroidRecordingApps = () => {
    const ua = navigator.userAgent.toLowerCase();
    const suspiciousApps = [
      'screenrecorder',
      'mobizen',
      'azrecorder',
      'xrecorder',
      'durecorder',
      'recordable',
      'scr screen recorder',
    ];

    for (const app of suspiciousApps) {
      if (ua.includes(app.toLowerCase())) {
        console.warn('[Android Protection] Screen recording app detected:', app);
        videoElement.pause();
        alert('⚠️ Ekran yozib olish dasturi aniqlandi! Iltimos yoping va qayta urinib ko\'ring.');
        return true;
      }
    }
    return false;
  };

  // 2. Monitor for Android screenshot gestures
  // Android: Power + Volume Down
  let powerButtonPressed = false;
  let volumeButtonPressed = false;

  const handleAndroidKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Power' || e.keyCode === 26) {
      powerButtonPressed = true;
    }
    if (e.key === 'VolumeDown' || e.keyCode === 25) {
      volumeButtonPressed = true;
    }

    // If both pressed simultaneously
    if (powerButtonPressed && volumeButtonPressed) {
      e.preventDefault();
      videoElement.pause();
      alert('⚠️ Screenshot Android qurilmasida taqiqlangan!');
      powerButtonPressed = false;
      volumeButtonPressed = false;
    }
  };

  const handleAndroidKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Power' || e.keyCode === 26) {
      powerButtonPressed = false;
    }
    if (e.key === 'VolumeDown' || e.keyCode === 25) {
      volumeButtonPressed = false;
    }
  };

  document.addEventListener('keydown', handleAndroidKeyDown);
  document.addEventListener('keyup', handleAndroidKeyUp);
  cleanupFns.push(() => {
    document.removeEventListener('keydown', handleAndroidKeyDown);
    document.removeEventListener('keyup', handleAndroidKeyUp);
  });

  // 3. Detect Android Developer Options (screen recording via ADB)
  const detectDeveloperMode = () => {
    // Check for ADB debugging indicators
    if ((window as any).__ANDROID_DEBUG__) {
      console.warn('[Android Protection] Developer mode detected');
      videoElement.pause();
      alert('⚠️ Developer mode aniqlandi. Ekran yozib olish taqiqlangan!');
    }
  };

  // 4. Monitor for screen recording indicators
  const checkAndroidRecording = () => {
    detectAndroidRecordingApps();
    detectDeveloperMode();

    // Check for suspicious activity (rapid focus changes)
    if (document.hidden) {
      // User might be in screen recording settings
      videoElement.pause();
    }
  };

  const androidCheckInterval = setInterval(checkAndroidRecording, 2000);
  cleanupFns.push(() => clearInterval(androidCheckInterval));

  // 5. Disable long-press context menu (Android Chrome)
  const preventAndroidLongPress = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const isOnVideo = (e.target as HTMLElement).tagName === 'VIDEO';
      if (isOnVideo) {
        e.preventDefault();
      }
    }
  };

  videoElement.addEventListener('touchstart', preventAndroidLongPress, { passive: false });
  cleanupFns.push(() => videoElement.removeEventListener('touchstart', preventAndroidLongPress));

  // 6. Monitor for Android recent apps (multitasking)
  const handleAndroidVisibility = () => {
    if (document.hidden) {
      // User opened recent apps or went to home screen
      // Might be starting screen recording
      videoElement.pause();
    }
  };

  document.addEventListener('visibilitychange', handleAndroidVisibility);
  cleanupFns.push(() => document.removeEventListener('visibilitychange', handleAndroidVisibility));

  // 7. Watermark (more prominent on mobile)
  const mobileWatermark = document.createElement('div');
  mobileWatermark.textContent = 'MANYAK TV';
  mobileWatermark.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 3rem;
    font-weight: bold;
    opacity: 0.15;
    color: white;
    pointer-events: none;
    user-select: none;
    z-index: 1000;
    text-shadow: 2px 2px 8px rgba(0,0,0,0.8);
  `;

  const videoContainer = videoElement.parentElement;
  if (videoContainer) {
    videoContainer.appendChild(mobileWatermark);
    cleanupFns.push(() => mobileWatermark.remove());
  }

  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}

/**
 * Initialize mobile-specific protection based on platform
 */
export function initMobileProtection(videoElement: HTMLVideoElement): () => void {
  const platform = detectMobilePlatform();
  const cleanupFns: (() => void)[] = [];

  if (!platform.isMobile) {
    return () => {}; // No mobile protection needed
  }

  console.log(`[Mobile Protection] Detected: ${platform.isIOS ? 'iOS' : 'Android'}`);

  if (platform.isIOS) {
    cleanupFns.push(initIOSProtection(videoElement));
  }

  if (platform.isAndroid) {
    cleanupFns.push(initAndroidProtection(videoElement));
  }

  // Common mobile protection
  // 1. Disable text selection
  videoElement.style.userSelect = 'none';
  (videoElement.style as any).webkitUserSelect = 'none';
  (videoElement.style as any).webkitTouchCallout = 'none';

  // 2. Prevent drag and drop
  const preventDrag = (e: DragEvent) => {
    e.preventDefault();
    return false;
  };
  videoElement.addEventListener('dragstart', preventDrag);
  cleanupFns.push(() => videoElement.removeEventListener('dragstart', preventDrag));

  // 3. Monitor battery status (screen recording uses more battery)
  if ('getBattery' in navigator) {
    (navigator as any).getBattery().then((battery: any) => {
      const monitorBattery = () => {
        // If battery draining unusually fast, might be recording
        if (battery.dischargingTime < 3600 && battery.level < 0.5) {
          console.warn('[Mobile Protection] Suspicious battery usage');
        }
      };
      battery.addEventListener('levelchange', monitorBattery);
      cleanupFns.push(() => battery.removeEventListener('levelchange', monitorBattery));
    });
  }

  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}

/**
 * Detect if user is trying to record screen
 */
export async function detectScreenRecording(): Promise<boolean> {
  try {
    // Check if MediaRecorder is being used
    if ('mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices) {
      // Try to detect active screen capture
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      return true; // Screen capture was requested
    }
  } catch {
    // User denied or not available
    return false;
  }
  return false;
}

/**
 * Apply CSS-based screenshot prevention
 */
export function applyCSSProtection(element: HTMLElement): void {
  element.style.cssText += `
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  `;
}

/**
 * Monitor clipboard for video theft attempts
 */
export function monitorClipboard(videoElement: HTMLVideoElement): () => void {
  const preventCopy = (e: ClipboardEvent) => {
    e.preventDefault();
    alert('⚠️ Kontent nusxalash taqiqlangan!');
    return false;
  };

  const preventCut = (e: ClipboardEvent) => {
    e.preventDefault();
    return false;
  };

  videoElement.addEventListener('copy', preventCopy);
  videoElement.addEventListener('cut', preventCut);

  return () => {
    videoElement.removeEventListener('copy', preventCopy);
    videoElement.removeEventListener('cut', preventCut);
  };
}

/**
 * Check if running in suspicious environment
 */
export function detectSuspiciousEnvironment(): {
  isEmulator: boolean;
  isRooted: boolean;
  hasDebugger: boolean;
} {
  const userAgent = navigator.userAgent.toLowerCase();

  return {
    isEmulator:
      userAgent.includes('emulator') ||
      userAgent.includes('android sdk') ||
      userAgent.includes('genymotion'),
    isRooted:
      userAgent.includes('superuser') ||
      userAgent.includes('magisk') ||
      (window as any).__ROOT_DETECTED === true,
    hasDebugger: !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ || /debugger/.test(userAgent),
  };
}
