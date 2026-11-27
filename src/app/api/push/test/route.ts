import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendPushToUser } from '@/lib/push';

export const dynamic = 'force-dynamic';

// POST /api/push/test — send a test push to the calling user (dev/debug only)
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subCount = await prisma.pushSubscription.count({
      where: { userId: session.userId },
    });

    if (subCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No active device subscriptions found for your account. Please click "Enable Notifications" in the banner at the bottom of the page (or click the lock/settings icon in your address bar and reset permissions) to subscribe this browser first.',
        },
        { status: 400 }
      );
    }

    await sendPushToUser(session.userId, {
      title: '🔔 Test Notification',
      body: 'Push notifications are working on Le Paradise HRMS!',
      url: '/dashboard',
      tag: 'test',
    });

    return NextResponse.json({ success: true, message: `Test notification sent to ${subCount} device(s)!` });
  } catch (error) {
    console.error('Test push error:', error);
    return NextResponse.json({ error: 'Failed to send test notification' }, { status: 500 });
  }
}

