const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'chat-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  ssl: { rejectUnauthorized: false },
  sasl: {
    mechanism: 'plain',
    username: process.env.KAFKA_SASL_USERNAME,
    password: process.env.KAFKA_SASL_PASSWORD
  }
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'chat.new_message group' });

let isConnected = false;

const connectKafka = async (onMessage) => {
  try {
    await producer.connect();
    await consumer.connect();
    await consumer.subscribe({ topic: 'chat.new_message', fromBeginning: false });
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (topic === 'chat.new_message' && onMessage) {
          const val = message.value.toString();
          try {
            const data = JSON.parse(val);
            onMessage(data);
          } catch(e) {
             console.error('Failed to parse kafka message', e);
          }
        }
      },
    });

    isConnected = true;
    console.log('Kafka connected successfully');
  } catch (error) {
    console.error('Kafka connection error:', error);
  }
};

const produceMessage = async (topic, message) => {
  if (!isConnected) return;
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }]
    });
  } catch (error) {
    console.error('Kafka produce error:', error);
  }
};

module.exports = {
  kafka,
  producer,
  consumer,
  connectKafka,
  produceMessage
};

