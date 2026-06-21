require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const UserFeed = require('./models/UserFeed');
const connectDB = require('./config/db');

async function test() {
  await connectDB();
  const users = await UserFeed.find({ 
    'recommendedProducts.0': { $exists: true }, 
    $or: [
        { cfEmbedding: { $size: 0 } },
        { cfEmbedding: { $exists: false } }
    ]
  }).lean();
  
  console.log(`Users with recommendations but NO embedding:`, users.length);
  
  const usersWithCBF = await UserFeed.find({ 
    'cbfRecommendedProducts.0': { $exists: true }, 
    $or: [
        { cbfEmbedding: { $size: 0 } },
        { cbfEmbedding: { $exists: false } }
    ]
  }).lean();
  
  console.log(`Users with CBF recommendations but NO CBF embedding:`, usersWithCBF.length);
  
  process.exit(0);
}

test();
