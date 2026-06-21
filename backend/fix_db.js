require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const UserFeed = require('./models/UserFeed');
const connectDB = require('./config/db');

async function fixDB() {
  await connectDB();
  
  // Find feeds where userId is string
  const collection = mongoose.connection.collection('userfeeds');
  const allFeeds = await collection.find({}).toArray();
  
  let count = 0;
  for (const feed of allFeeds) {
    if (typeof feed.userId === 'string') {
      await collection.updateOne(
        { _id: feed._id },
        { $set: { userId: new mongoose.Types.ObjectId(feed.userId) } }
      );
      count++;
    }
  }
  
  console.log(`Fixed ${count} user feeds by casting string userId to ObjectId.`);
  process.exit(0);
}

fixDB();
