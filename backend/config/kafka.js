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
    console.error('[kafka-consumer] error processing user event:', err.message);
  }
};

let isConnected = false;

const connectKafka = async (onMessage) => {
  try {
    await producer.connect();
    
    // Chat Consumer
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

    // User Events Consumer
    await userEventsConsumer.connect();
    await userEventsConsumer.subscribe({ topic: 'user-events', fromBeginning: false });
    
    await userEventsConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (topic === 'user-events') {
          const val = message.value.toString();
          try {
            const data = JSON.parse(val);
            console.log(`[kafka-consumer] Received user-event: ${data.action} for product ${data.productId}`);
            await processUserEvent(data);
          } catch(e) {
             console.error('Failed to parse user event kafka message', e);
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

