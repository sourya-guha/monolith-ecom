'use server';

import { produceUserEvent } from '@/lib/kafka';

export async function sendUserEventAction(eventPayload: {
  userId: string;
  productId: string;
  shopId?: string;
  action: string;
  metadata?: any;
}) {
  try {
    const payload = {
      ...eventPayload,
      timestamp: new Date().toISOString()
    };

    // Push to Kafka user-events topic directly from Next.js server
    await produceUserEvent('user-events', payload);
    console.log(`[Next.js Kafka Producer] Pushed ${eventPayload.action} event to Kafka for user ${eventPayload.userId}`);
    return { success: true };
  } catch (err: any) {
    console.error('Error sending user event to Kafka:', err.message);
    return { success: false, error: err.message };
  }
}
