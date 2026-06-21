require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const UserFeed = require('./models/UserFeed');
const connectDB = require('./config/db');

async function test() {
  await connectDB();
  const fs = require('fs');
  const path = require('path');
  const User = require('./models/User');
  
  const users = await User.find({}).lean();
  console.log('Total Users:', users.length);
  
  for (const u of users) {
    const feed = await UserFeed.findOne({ userId: u._id }).lean();
    console.log(`User: ${u.email} (${u.role})`);
    console.log(` - Has CF Embedding: ${feed?.cfEmbedding?.length ? 'YES' : 'NO'}`);
    console.log(` - Has CBF Embedding: ${feed?.cbfEmbedding?.length ? 'YES' : 'NO'}`);
  }
  
  process.exit(0);
}

test();
