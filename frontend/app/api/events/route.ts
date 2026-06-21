import { NextResponse } from 'next/server';
import { produceUserEvent } from '@/lib/kafka';

export async function POST(request: Request) {
  console.log('==== /api/events ROUTE HIT ====');
  try {
    const eventPayload = await request.json();
    console.log('Parsed payload:', eventPayload.action);
    
    const payload = {
      ...eventPayload,
      timestamp: new Date().toISOString()
    };

    console.log('Attempting to connect and push to Kafka...');
    // Push to Kafka user-events topic directly from Next.js server
    await produceUserEvent('user-events', payload);
    console.log(`[Next.js Kafka Producer] Pushed ${eventPayload.action} event to Kafka for user ${eventPayload.userId}`);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending user event to Kafka from API:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
