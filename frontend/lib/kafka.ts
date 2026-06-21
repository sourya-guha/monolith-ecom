import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'frontend-producer',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  ssl: { rejectUnauthorized: false },
  sasl: {
    mechanism: 'plain',
    username: process.env.KAFKA_SASL_USERNAME || '',
    password: process.env.KAFKA_SASL_PASSWORD || ''
  }
});

const producer = kafka.producer();
let isConnected = false;

export const connectProducer = async () => {
  if (isConnected) return;
  try {
    await producer.connect();
    isConnected = true;
    console.log('Frontend Kafka Producer connected successfully');
  } catch (error) {
    console.error('Frontend Kafka Producer connection error:', error);
  }
};

export const produceUserEvent = async (topic: string, message: any) => {
  await connectProducer();
  if (!isConnected) return;
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }]
    });
  } catch (error) {
    console.error('Frontend Kafka produce error:', error);
  }
};
