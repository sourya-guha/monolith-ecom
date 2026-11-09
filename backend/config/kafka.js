const { Kafka } = require('kafkajs');
const { logDependencyError } = require('../utils/dependency-logger');

const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092')
  .split(',')
  .map((broker) => broker.trim())
  .filter(Boolean);
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'chat-service',
  brokers,
  ssl: { rejectUnauthorized: false },
  sasl: {
    mechanism: 'plain',
    username: process.env.KAFKA_SASL_USERNAME,
    password: process.env.KAFKA_SASL_PASSWORD
  }
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'chat.new_message group' });
const userEventsConsumer = kafka.consumer({ groupId: 'user-events group' });

const UserProductAffinity = require('../models/UserProductAffinity');
const Product = require('../models/Product');
const ProductAnalytics = require('../models/ProductAnalytics');
const UserAnalytics = require('../models/UserAnalytics');

const processUserEvent = async (event) => {
  try {
    const existing = await UserProductAffinity.findOne({
      userId: event.userId,
      productId: event.productId
    });

    const impactMapping = { 'purchase': 0.8, 'add_to_cart': 0.4, 'wishlist': 0.3, 'product_view': 0.1 };
    const impact = impactMapping[event.action] || 0.05;

    if (existing) {
      const hoursElapsed = (Date.now() - existing.updatedAt.getTime()) / 3600000;
      const decay = Math.pow(0.95, hoursElapsed / 24); // 5% decay per day
      const decayedScore = existing.score * decay;

      const updatedScore = decayedScore + (impact * (5.0 - decayedScore));

      existing.score = updatedScore;
      await existing.save();
    } else {
      await UserProductAffinity.create({
        userId: event.userId,
        productId: event.productId,
        score: impact * 5.0
      });
    }

    // --- Analytics Logic ---
    const product = await Product.findById(event.productId);
    if (!product) return;

    // 1. Update ProductAnalytics
    let pAnalytics = await ProductAnalytics.findOne({ productId: event.productId });
    if (!pAnalytics) {
      pAnalytics = new ProductAnalytics({
        productId: event.productId,
        category: product.category,
        price: product.price
      });
    }

    if (event.action === 'product_view') {
      pAnalytics.totalViews += 1;
      
      const dwell = event.metadata?.dwellTimeSeconds || 0;
      const scroll = event.metadata?.scrollDepthPercent || 0;
      
      // Moving average formula: newAvg = oldAvg + (newValue - oldAvg) / newCount
      pAnalytics.avgDwellTimeSeconds = pAnalytics.avgDwellTimeSeconds + ((dwell - pAnalytics.avgDwellTimeSeconds) / pAnalytics.totalViews);
      pAnalytics.avgScrollDepthPercent = pAnalytics.avgScrollDepthPercent + ((scroll - pAnalytics.avgScrollDepthPercent) / pAnalytics.totalViews);
    } else if (event.action === 'add_to_cart') {
      pAnalytics.totalAddsToCart += 1;
    } else if (event.action === 'purchase') {
      pAnalytics.totalPurchases += 1;
    } else if (event.action === 'wishlist') {
      pAnalytics.totalWishlists += 1;
    }
    await pAnalytics.save();

    // 2. Update UserAnalytics
    let uAnalytics = await UserAnalytics.findOne({ userId: event.userId });
    if (!uAnalytics) {
      uAnalytics = new UserAnalytics({ userId: event.userId });
    }

    uAnalytics.totalInteractions += 1;

    // Update category affinities
    const currentCategoryCount = uAnalytics.categoryAffinities.get(product.category) || 0;
    uAnalytics.categoryAffinities.set(product.category, currentCategoryCount + 1);

    // Update avg price point
    uAnalytics.avgPricePoint = uAnalytics.avgPricePoint + ((product.price - uAnalytics.avgPricePoint) / uAnalytics.totalInteractions);

    // Update device/location features if provided
    if (event.metadata) {
      if (event.metadata.device && !uAnalytics.devices.includes(event.metadata.device)) uAnalytics.devices.push(event.metadata.device);
      if (event.metadata.browser && !uAnalytics.browsers.includes(event.metadata.browser)) uAnalytics.browsers.push(event.metadata.browser);
      if (event.metadata.location && !uAnalytics.locations.includes(event.metadata.location)) uAnalytics.locations.push(event.metadata.location);
    }

    await uAnalytics.save();

  } catch (err) {
    logDependencyError('mongodb', 'process_kafka_user_event', err);
    throw err;
  }
};

let isConnected = false;
let isConnecting = false;
let producerConnected = false;
let chatConsumerConnected = false;
let userEventsConsumerConnected = false;
let chatConsumerStarted = false;
let userEventsConsumerStarted = false;
let retryTimer = null;
let messageHandler = null;

const scheduleKafkaReconnect = () => {
  if (retryTimer || isConnected) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    connectKafka(messageHandler);
  }, 30000);
  retryTimer.unref();
  console.warn('[kafka] connection retry scheduled in 30 seconds');
};

const connectKafka = async (onMessage) => {
  if (onMessage) messageHandler = onMessage;
  if (isConnected || isConnecting) return;

  isConnecting = true;
  try {
    if (!producerConnected) {
      await producer.connect();
      producerConnected = true;
    }
    
    if (!chatConsumerConnected) {
      await consumer.connect();
      chatConsumerConnected = true;
    }
    if (!chatConsumerStarted) {
      await consumer.subscribe({ topic: 'chat.new_message', fromBeginning: false });
      await consumer.run({
        eachMessage: async ({ topic, message }) => {
          if (topic !== 'chat.new_message') return;
          let data;
          try {
            data = JSON.parse(message.value.toString());
          } catch (error) {
            logDependencyError('kafka', 'parse_chat_message', error);
            return;
          }
          if (messageHandler) {
            try {
              await messageHandler(data);
            } catch (error) {
              logDependencyError('kafka', 'process_chat_message', error);
              throw error;
            }
          }
        },
      });
      chatConsumerStarted = true;
    }

    if (!userEventsConsumerConnected) {
      await userEventsConsumer.connect();
      userEventsConsumerConnected = true;
    }
    if (!userEventsConsumerStarted) {
      await userEventsConsumer.subscribe({ topic: 'user-events', fromBeginning: false });
      await userEventsConsumer.run({
        eachMessage: async ({ topic, message }) => {
          if (topic !== 'user-events') return;
          let data;
          try {
            data = JSON.parse(message.value.toString());
          } catch (error) {
            logDependencyError('kafka', 'parse_user_event', error);
            return;
          }
          console.info(`[kafka] processing user event action=${data.action} productId=${data.productId}`);
          await processUserEvent(data);
        },
      });
      userEventsConsumerStarted = true;
    }

    isConnected = true;
    console.info(`[kafka] connected (brokers: ${brokers.join(', ')})`);
  } catch (error) {
    isConnected = false;
    logDependencyError('kafka', 'connect', error, { brokers });
    scheduleKafkaReconnect();
  } finally {
    isConnecting = false;
  }
};

const produceMessage = async (topic, message) => {
  if (!isConnected) {
    const error = new Error('Kafka is not connected');
    error.code = 'KAFKA_UNAVAILABLE';
    logDependencyError('kafka', 'produce', error, { topic, brokers });
    throw error;
  }
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }]
    });
  } catch (error) {
    isConnected = false;
    producerConnected = false;
    logDependencyError('kafka', 'produce', error, { topic, brokers });
    producer.disconnect()
      .then(scheduleKafkaReconnect)
      .catch((disconnectError) => {
        logDependencyError('kafka', 'disconnect_after_produce_failure', disconnectError, { brokers });
        scheduleKafkaReconnect();
      });
    throw error;
  }
};

const getKafkaStatus = () => (isConnected ? 'connected' : 'unavailable');

module.exports = {
  kafka,
  producer,
  consumer,
  connectKafka,
  produceMessage,
  getKafkaStatus,
};
