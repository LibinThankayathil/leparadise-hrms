import {
  setVapidDetails,
  sendNotification,
  type PushSubscription as WebPushSubscription,
} from 'web-push';
import { prisma } from './prisma';

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BNCjnaJ6ccic-z033wSxScKi_fWZTn5_3nw2lt0Gp2vFF8QwBaarPMBGsHQRa-IZ8srY-6JwYAXyJMYXslAE920';

const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  '8k7rd99Krkg2PpvhLCjtCJbj8hjAJcmkO-0EldoPIsU';

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error('[WebPush] Missing VAPID keys. Ensure NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are set in .env');
    return;
  }
  try {
    setVapidDetails(
      'mailto:hr@leparadise.com',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
    vapidConfigured = true;
  } catch (err) {
    console.error('[WebPush] Failed to configure VAPID details:', err);
  }
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

/**
 * Send a push notification to all subscribed devices of a user.
 * Silently removes stale/expired subscriptions (410 Gone).
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) return;

  ensureVapidConfigured();

  const data = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/dashboard',
    tag: payload.tag ?? 'hrms-notification',
  });

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pushSub: WebPushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      try {
        await sendNotification(pushSub, data, { TTL: 86400 });
        console.log('[WebPush] Successfully delivered push to endpoint:', sub.endpoint.substring(0, 50));
      } catch (err: any) {
        // 410 = endpoint expired/unsubscribed — clean it up
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          console.warn('[WebPush] Stale subscription detected, removing:', sub.endpoint.substring(0, 50));
          await prisma.pushSubscription.deleteMany({
            where: { endpoint: sub.endpoint },
          });
        } else {
          console.error('[WebPush] Push send error for endpoint', sub.endpoint, err);
        }
      }
    })
  );
}

/**
 * Send a push notification to all MANAGER users.
 */
export async function sendPushToManagers(payload: PushPayload) {
  const managers = await prisma.user.findMany({
    where: { role: 'MANAGER', isActive: true },
    select: { id: true },
  });

  await Promise.allSettled(managers.map((m) => sendPushToUser(m.id, payload)));
}
