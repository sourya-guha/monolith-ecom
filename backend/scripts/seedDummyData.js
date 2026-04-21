require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ChatConversation = require('../models/ChatConversation');
const ChatMessage = require('../models/ChatMessage');

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFrom(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function slug(n) {
  return String(n).padStart(6, '0');
}

const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Beauty'];
const productNouns = ['Phone', 'T-shirt', 'Book', 'Lamp', 'Shoes', 'Watch', 'Bag', 'Headset', 'Chair', 'Bottle'];
const firstNames = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Riley', 'Jamie', 'Morgan', 'Casey', 'Avery', 'Harper'];
const lastNames = ['Smith', 'Johnson', 'Brown', 'Lee', 'Patel', 'Miller', 'Garcia', 'Davis', 'Wilson', 'Moore'];

function buildName() {
  return `${randFrom(firstNames)} ${randFrom(lastNames)}`;
}

function buildEmail(prefix, n) {
  return `${prefix}${slug(n)}@dummy.local`;
}

function buildProductName() {
  return `${randFrom(categories)} ${randFrom(productNouns)} ${randInt(100, 999)}`;
}

function buildAddress() {
  return {
    street: `${randInt(10, 999)} Main Street`,
    city: `City-${randInt(1, 100)}`,
    state: `State-${randInt(1, 30)}`,
    pincode: String(randInt(10000, 99999)),
  };
}

async function createUsers({ buyerCount, sellerCount }) {
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const sellers = Array.from({ length: sellerCount }, (_, i) => ({
    name: buildName(),
    email: buildEmail('seller', i + 1),
    password: passwordHash,
    role: 'seller',
  }));

  const buyers = Array.from({ length: buyerCount }, (_, i) => ({
    name: buildName(),
    email: buildEmail('buyer', i + 1),
    password: passwordHash,
    role: 'user',
  }));

  const users = await User.insertMany([...sellers, ...buyers], { ordered: false });
  const sellerUsers = users.filter((u) => u.role === 'seller');
  const buyerUsers = users.filter((u) => u.role === 'user');

  return { sellerUsers, buyerUsers };
}

async function createProducts({ productCount, sellerUsers }) {
  const payload = Array.from({ length: productCount }, () => {
    const category = randFrom(categories);
    const price = randInt(10, 2500);
    return {
      name: buildProductName(),
      description: `Dummy ${category} product used for load, UI, and demo testing.`,
      price,
      category,
      stock: randInt(0, 200),
      images: [`https://picsum.photos/seed/${randInt(1, 100000)}/800/800`],
      seller: randFrom(sellerUsers)._id,
    };
  });

  return Product.insertMany(payload, { ordered: false });
}

async function createOrders({ orderCount, buyerUsers, products }) {
  const payload = [];
  for (let i = 0; i < orderCount; i++) {
    const buyer = randFrom(buyerUsers);
    const lineCount = randInt(1, 4);
    const selected = new Set();
    const items = [];
    let totalPrice = 0;

    while (items.length < lineCount) {
      const p = randFrom(products);
      const key = String(p._id);
      if (selected.has(key)) continue;
      selected.add(key);
      const quantity = randInt(1, 3);
      totalPrice += p.price * quantity;
      items.push({ product: p._id, quantity, price: p.price });
    }

    payload.push({
      user: buyer._id,
      items,
      totalPrice,
      status: randFrom(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
      shippingAddress: buildAddress(),
    });
  }

  return Order.insertMany(payload, { ordered: false });
}

async function createConversations({ conversationCount, buyerUsers, products }) {
  const seen = new Set();
  const payload = [];

  while (payload.length < conversationCount) {
    const buyer = randFrom(buyerUsers);
    const product = randFrom(products);
    const seller = product.seller;
    const key = `${buyer._id}-${seller}-${product._id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    payload.push({
      buyer: buyer._id,
      seller,
      product: product._id,
      lastMessage: '',
      lastMessageAt: null,
    });
  }

  return ChatConversation.insertMany(payload, { ordered: false });
}

async function createMessages({ messageCount, conversations }) {
  const payload = [];
  const lastByConversation = new Map();

  for (let i = 0; i < messageCount; i++) {
    const conversation = randFrom(conversations);
    const sender = Math.random() < 0.5 ? conversation.buyer : conversation.seller;
    const text = `Dummy message #${i + 1} (${randFrom(['hello', 'price?', 'available?', 'okay', 'thanks'])})`;
    const createdAt = new Date(Date.now() - randInt(0, 30 * 24 * 60 * 60 * 1000));

    payload.push({
      conversation: conversation._id,
      sender,
      text,
      readBy: [sender],
      createdAt,
      updatedAt: createdAt,
    });

    const key = String(conversation._id);
    const prev = lastByConversation.get(key);
    if (!prev || prev.createdAt < createdAt) {
      lastByConversation.set(key, { text, createdAt });
    }
  }

  await ChatMessage.insertMany(payload, { ordered: false });

  const updates = [];
  for (const [conversationId, data] of lastByConversation.entries()) {
    updates.push(
      ChatConversation.updateOne(
        { _id: conversationId },
        { $set: { lastMessage: data.text, lastMessageAt: data.createdAt } }
      )
    );
  }
  await Promise.all(updates);
}

async function clearCollections() {
  await Promise.all([
    ChatMessage.deleteMany({}),
    ChatConversation.deleteMany({}),
    Order.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({ email: /@(dummy\.local)$/ }),
  ]);
}

async function main() {
  const args = process.argv.slice(2);
  const reset = args.includes('--reset');

  const buyerCount = Number(process.env.SEED_BUYERS || 200);
  const sellerCount = Number(process.env.SEED_SELLERS || 60);
  const productCount = Number(process.env.SEED_PRODUCTS || 5000);
  const orderCount = Number(process.env.SEED_ORDERS || 2500);
  const conversationCount = Number(process.env.SEED_CONVERSATIONS || 1500);
  const messageCount = Number(process.env.SEED_MESSAGES || 12000);

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required in environment');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('[seed] connected');

  if (reset) {
    console.log('[seed] clearing existing dummy data...');
    await clearCollections();
  }

  console.log('[seed] creating users...');
  const { sellerUsers, buyerUsers } = await createUsers({ buyerCount, sellerCount });
  console.log(`[seed] users created: sellers=${sellerUsers.length}, buyers=${buyerUsers.length}`);

  console.log('[seed] creating products...');
  const products = await createProducts({ productCount, sellerUsers });
  console.log(`[seed] products created: ${products.length}`);

  console.log('[seed] creating orders...');
  const orders = await createOrders({ orderCount, buyerUsers, products });
  console.log(`[seed] orders created: ${orders.length}`);

  console.log('[seed] creating conversations...');
  const conversations = await createConversations({ conversationCount, buyerUsers, products });
  console.log(`[seed] conversations created: ${conversations.length}`);

  console.log('[seed] creating messages...');
  await createMessages({ messageCount, conversations });
  console.log(`[seed] messages created: ${messageCount}`);

  console.log('[seed] done');
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('[seed] failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

