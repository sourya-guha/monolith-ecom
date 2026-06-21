require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const tf = require('@tensorflow/tfjs'); // Pure JS version doesn't require C++ compilation
const mongoose = require('mongoose');

// Define Schema manually so we don't rely on the full backend boot
const affinitySchema = new mongoose.Schema({}, { strict: false });
const UserProductAffinity = mongoose.models.UserProductAffinity || mongoose.model('UserProductAffinity', affinitySchema, 'userproductaffinities');

const userFeedSchema = new mongoose.Schema({}, { strict: false });
const UserFeed = mongoose.models.UserFeed || mongoose.model('UserFeed', userFeedSchema, 'userfeeds');

function cofiCostFuncV(X, W, b, Y, R, lambda) {
  return tf.tidy(() => {
    // Prediction: X * W^T + b
    // X is (num_products, num_features)
    // W is (num_users, num_features) -> W^T is (num_features, num_users)
    // b is (1, num_users)
    const j = tf.matMul(X, W, false, true).add(b);
    
    // Cost = 1/2 * sum( R * (Prediction - Y)^2 )
    const diff = j.sub(Y);
    const squaredDiff = tf.square(diff);
    const masked = R.mul(squaredDiff);
    let cost = tf.sum(masked).mul(0.5);
    
    // Regularization
    cost = cost.add(tf.sum(tf.square(X)).mul(lambda / 2));
    cost = cost.add(tf.sum(tf.square(W)).mul(lambda / 2));
    
    return cost;
  });
}

async function train() {
  console.log("Starting Collaborative Filtering Training with TensorFlow.js...");
  
  if (!process.env.MONGO_URI) {
    console.error("Error: MONGO_URI not found in environment variables.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  try {
    const affinities = await UserProductAffinity.find({}).lean();
    if (affinities.length === 0) {
      console.log("No affinity data found. Aborting training.");
      process.exit(0);
    }
    
    console.log(`Loaded ${affinities.length} affinity records.`);

    // Build index mappings
    const userIds = [...new Set(affinities.map(a => String(a.userId)))];
    const productIds = [...new Set(affinities.map(a => String(a.productId)))];
    
    const userToIdx = {};
    userIds.forEach((u, i) => userToIdx[u] = i);
    const productToIdx = {};
    productIds.forEach((p, i) => productToIdx[p] = i);
    
    const numUsers = userIds.length;
    const numProducts = productIds.length;
    const numFeatures = 50;
    
    console.log(`Users: ${numUsers}, Products: ${numProducts}`);
    
    // Construct Y and R arrays
    const Y_arr = Array(numProducts).fill(0).map(() => Array(numUsers).fill(0));
    const R_arr = Array(numProducts).fill(0).map(() => Array(numUsers).fill(0));
    
    for (const a of affinities) {
      const uIdx = userToIdx[String(a.userId)];
      const pIdx = productToIdx[String(a.productId)];
      const score = Number(a.affinityScore || 1.0);
      
      if (uIdx !== undefined && pIdx !== undefined) {
        Y_arr[pIdx][uIdx] = score;
        R_arr[pIdx][uIdx] = 1.0;
      }
    }
    
    const Y = tf.tensor2d(Y_arr, [numProducts, numUsers]);
    const R = tf.tensor2d(R_arr, [numProducts, numUsers]);
    
    // Initialize variables
    const W = tf.variable(tf.randomNormal([numUsers, numFeatures], 0, 0.1));
    const X = tf.variable(tf.randomNormal([numProducts, numFeatures], 0, 0.1));
    const b = tf.variable(tf.zeros([1, numUsers]));
    
    const optimizer = tf.train.adam(0.1);
    const iterations = 200;
    const lambda = 1.0;
    
    console.log("Training Model...");
    
    for (let iter = 0; iter < iterations; iter++) {
      const cost = optimizer.minimize(() => {
        return cofiCostFuncV(X, W, b, Y, R, lambda);
      }, true);
      
      if (iter % 20 === 0 || iter === iterations - 1) {
        const costVal = cost.dataSync()[0];
        console.log(`Iteration ${iter}: Cost ${costVal.toFixed(4)}`);
      }
      cost.dispose();
    }
    
    // Save User Embeddings
    const W_arr = await W.array();
    
    // Save complete weights to filesystem
    const fs = require('fs');
    const path = require('path');
    const cfModelDir = path.resolve(__dirname, 'models/cf');
    if (!fs.existsSync(cfModelDir)) fs.mkdirSync(cfModelDir, { recursive: true });
    
    fs.writeFileSync(path.join(cfModelDir, 'weights.json'), JSON.stringify({
      W: W_arr,
      X: await X.array(),
      b: await b.array(),
      userIds,
      productIds
    }));
    console.log(`Saved Collaborative Filtering raw weights to ${path.join(cfModelDir, 'weights.json')}`);

    for (let i = 0; i < numUsers; i++) {
      const userId = new mongoose.Types.ObjectId(userIds[i]);
      const userEmbedding = W_arr[i];
      
      await UserFeed.updateOne(
        { userId: userId },
        { 
          $set: {
            cfEmbedding: userEmbedding,
            lastComputedAt: new Date()
          }
        },
        { upsert: true }
      );
    }
    
    console.log(`Saved Collaborative Filtering embeddings for ${numUsers} users to UserFeed.`);
    
    // Cleanup tensors to prevent memory leaks
    tf.dispose([Y, R, W, X, b]);
    
  } catch (error) {
    console.error("Training failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

// Run if called directly
if (require.main === module) {
  train().catch(console.error);
}

module.exports = { train };
