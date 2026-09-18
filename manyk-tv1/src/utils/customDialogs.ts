/**
 * Custom Dialog System - Browser native dialog'larni override qilish
 * 
 * Bu modul barcha window.alert(), window.confirm(), window.prompt() 
 * chaqiruvlarini sayt ichidagi custom modal'larga yo'naltiradi.
 */

type DialogType = 'alert' | 'confirm' | 'prompt';

interface CustomDialogConfig {
  type: DialogType;
  title: string;
  message: string;
  defaultValue?: string;
  onConfirm?: (value?: string) => void;
  onCancel?: () => void;
}

let dialogCallback: ((config: CustomDialogConfig) => void) | null = null;

/**
 * Dialog handler'ni ro'yxatdan o'tkazish
 */
export function registerDialogHandler(handler: (config: CustomDialogConfig) => void) {
  dialogCallback = handler;
}

/**
 * Custom alert - browser alert() o'rniga
 */
function customAlert(message: string): void {
  if (dialogCallback) {
    dialogCallback({
      type: 'alert',
      title: 'Diqqat',
      message: String(message),
      onConfirm: () => {},
    });
  } else {
    // Fallback - native alert
    // eslint-disable-next-line no-alert
    window.alert(message);
  }
}

/**
 * Custom confirm - browser confirm() o'rniga
 */
function customConfirm(message: string): boolean {
  if (dialogCallback) {
    let result = false;
    dialogCallback({
      type: 'confirm',
      title: 'Tasdiqlash',
      message: String(message),
      onConfirm: () => {
        result = true;
      },
      onCancel: () => {
        result = false;
      },
    });
    return result;
  } else {
    // Fallback - native confirm
    // eslint-disable-next-line no-alert
    return window.confirm(message);
  }
}

/**
 * Custom prompt - browser prompt() o'rniga
 */
function customPrompt(message: string, defaultValue = ''): string | null {
  if (dialogCallback) {
    let result: string | null = null;
    dialogCallback({
      type: 'prompt',
      title: 'Ma\'lumot kiriting',
      message: String(message),
      defaultValue,
      onConfirm: (value) => {
        result = value ?? null;
      },
      onCancel: () => {
        result = null;
      },
    });
    return result;
  } else {
    // Fallback - native prompt
    // eslint-disable-next-line no-alert
    return window.prompt(message, defaultValue);
  }
}

/**
 * Browser native dialog'larni override qilish
 */
export function overrideBrowserDialogs() {
  if (typeof window === 'undefined') return;

  // Native funksiyalarni saqlash (debug uchun)
  const nativeAlert = window.alert;
  const nativeConfirm = window.confirm;
  const nativePrompt = window.prompt;

  // Override
  window.alert = customAlert;
  window.confirm = customConfirm;
  window.prompt = customPrompt;

  console.log('[CustomDialogs] ✅ Browser native dialogs override qilindi');

  // Restore funksiyasi (agar kerak bo'lsa)
  return () => {
    window.alert = nativeAlert;
    window.confirm = nativeConfirm;
    window.prompt = nativePrompt;
    console.log('[CustomDialogs] Browser native dialogs restore qilindi');
  };
}

/**
 * Service Worker permission request'larini bloklash
 */
export function blockServiceWorkerPermissions() {
  if (typeof window === 'undefined') return;

  // Notification permission request'ni bloklash
  if ('Notification' in window) {
    const originalRequestPermission = Notification.requestPermission;
    
    Notification.requestPermission = function() {
      console.warn('[CustomDialogs] ❌ Notification permission request bloklandi');
      return Promise.resolve('denied' as NotificationPermission);
    };

    console.log('[CustomDialogs] ✅ Notification permissions bloklandi');
  }

  // Service Worker registration'ni bloklash (agar kerak bo'lmasa)
  if ('serviceWorker' in navigator) {
    const originalRegister = navigator.serviceWorker.register;
    
    navigator.serviceWorker.register = function() {
      console.warn('[CustomDialogs] ❌ Service Worker registration bloklandi');
      return Promise.reject(new Error('Service Worker registration is blocked'));
    };

    console.log('[CustomDialogs] ✅ Service Worker registration bloklandi');
  }
}

/**
 * Telegram WebApp notification'larni bloklash
 */
export function preventTelegramNotifications() {
  if (typeof window === 'undefined') return;

  try {
    // @ts-ignore - Telegram WebApp types not fully defined
    if (window.Telegram?.WebApp) {
      // @ts-ignore
      const tg = window.Telegram.WebApp as any; // Use 'any' to bypass TypeScript checks
      
      // showAlert, showConfirm funksiyalarini override qilish
      if (tg.showAlert) {
        const originalShowAlert = tg.showAlert;
        tg.showAlert = function(message: string, callback?: () => void) {
          console.log('[CustomDialogs] Telegram showAlert bloklandi:', message);
          if (dialogCallback) {
            dialogCallback({
              type: 'alert',
              title: 'Telegram',
              message,
              onConfirm: callback,
            });
          }
        };
      }

      if (tg.showConfirm) {
        const originalShowConfirm = tg.showConfirm;
        tg.showConfirm = function(message: string, callback?: (confirmed: boolean) => void) {
          console.log('[CustomDialogs] Telegram showConfirm bloklandi:', message);
          if (dialogCallback) {
            dialogCallback({
              type: 'confirm',
              title: 'Telegram',
              message,
              onConfirm: () => callback?.(true),
              onCancel: () => callback?.(false),
            });
          }
        };
      }

      console.log('[CustomDialogs] ✅ Telegram WebApp notifications override qilindi');
    }
  } catch (err) {
    console.error('[CustomDialogs] Telegram override xatolik:', err);
  }
}

/**
 * Public API - Component'lardan ishlatish uchun
 */
export function showAlert(title: string, message: string, onConfirm?: () => void) {
  if (dialogCallback) {
    dialogCallback({
      type: 'alert',
      title,
      message,
      onConfirm,
    });
  } else {
    // Fallback
    window.alert(`${title}\n\n${message}`);
    onConfirm?.();
  }
}

export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) {
  if (dialogCallback) {
    dialogCallback({
      type: 'confirm',
      title,
      message,
      onConfirm,
      onCancel,
    });
  } else {
    // Fallback
    const result = window.confirm(`${title}\n\n${message}`);
    if (result) {
      onConfirm();
    } else {
      onCancel?.();
    }
  }
}

export function showPrompt(
  title: string,
  message: string,
  defaultValue: string,
  onConfirm: (value: string) => void,
  onCancel?: () => void
) {
  if (dialogCallback) {
    dialogCallback({
      type: 'prompt',
      title,
      message,
      defaultValue,
      onConfirm,
      onCancel,
    });
  } else {
    // Fallback
    const result = window.prompt(`${title}\n\n${message}`, defaultValue);
    if (result !== null) {
      onConfirm(result);
    } else {
      onCancel?.();
    }
  }
}
