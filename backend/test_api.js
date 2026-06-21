require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const UserFeed = require('./models/UserFeed');
const connectDB = require('./config/db');

async function test() {
  await connectDB();
  const feed = await UserFeed.findOne({ 'recommendedProducts.0': { $exists: true } }).lean();
  if (!feed) {
    console.log("No feed found");
    return process.exit(0);
  }
  console.log("Testing API for User:", feed.userId);
  console.log("Type of feed.userId:", typeof feed.userId, "Is ObjectId?", feed.userId instanceof mongoose.Types.ObjectId);
  
  const rawDoc = await mongoose.connection.collection('userfeeds').findOne({ userId: feed.userId });
  console.log("Raw doc userId type:", typeof rawDoc.userId, "Is ObjectId?", rawDoc.userId instanceof mongoose.Types.ObjectId);
  
  const { getCFRecommendations } = require('./controllers/user.controller');
  
  const req = { user: { id: feed.userId.toString() } };
  const res = {
    json: (data) => console.log('RES.JSON:', data),
    status: (code) => ({ json: (data) => console.log(`STATUS ${code} JSON:`, data) })
  };
  
  await getCFRecommendations(req, res);
  
  process.exit(0);
}

test();
