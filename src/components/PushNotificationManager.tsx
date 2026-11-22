'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported' | 'loading';

export function PushNotificationManager() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<PermissionState>('loading');
  const [showBanner, setShowBanner] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !user) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported');
      return;
    }

    const current = Notification.permission as PermissionState;
    setPermission(current);

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        registrationRef.current = reg;
        // If not yet asked, show the prompt banner after a short delay
        if (current === 'default') {
          setTimeout(() => setShowBanner(true), 2000);
        }
        // If already granted, sync the subscription to the current logged-in user
        if (current === 'granted') {
          syncSubscription(reg);
        }
      })
      .catch((err) => console.error('Service worker registration failed:', err));
  }, [user]);

  async function syncSubscription(reg: ServiceWorkerRegistration) {
    try {
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const vapidKey =
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
          'BNCjnaJ6ccic-z033wSxScKi_fWZTn5_3nw2lt0Gp2vFF8QwBaarPMBGsHQRa-IZ8srY-6JwYAXyJMYXslAE920';

        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
        });
      }

      if (sub) {
        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub.toJSON()),
        });
        if (res.ok) {
          console.log('[WebPush] Device successfully subscribed to push notifications');
        } else {
          console.error('[WebPush] Failed to register subscription with server:', await res.text());
        }
      }
    } catch (err) {
      console.error('[WebPush] Push subscription error:', err);
    }
  }

  async function requestPermission() {
    if (!registrationRef.current) return;
    setSubscribing(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);
      setShowBanner(false);
      if (result === 'granted') {
        await syncSubscription(registrationRef.current);
      }
    } catch (err) {
      console.error('Permission request error:', err);
    } finally {
      setSubscribing(false);
    }
  }

  // Don't render anything if unsupported, already granted, or denied
  if (permission === 'unsupported' || permission === 'granted' || permission === 'denied' || permission === 'loading') {
    return null;
  }

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
      <div className="bg-[#1C2130] text-white rounded-xl shadow-2xl p-4 flex items-start gap-3 border border-white/10">
        <div className="w-9 h-9 rounded-lg bg-[#2D7A58] flex items-center justify-center shrink-0 mt-0.5">
          <Bell className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Enable Notifications</p>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            Get notified instantly when your leave is approved, payslip is published, or attendance is flagged.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={requestPermission}
              disabled={subscribing}
              className="px-3.5 py-1.5 bg-[#2D7A58] hover:bg-[#256549] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
            >
              {subscribing ? 'Enabling…' : 'Enable Notifications'}
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowBanner(false)}
          className="p-1 rounded text-slate-400 hover:text-white transition-colors shrink-0 cursor-pointer"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Hook to send a test notification from any page (dev utility)
export function useSendTestNotification() {
  return async () => {
    try {
      const res = await fetch('/api/push/test', { method: 'POST' });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Test notification failed:', err);
    }
  };
}
