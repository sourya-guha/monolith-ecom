require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const tf = require('@tensorflow/tfjs');
const mongoose = require('mongoose');

// Define Schemas manually for standalone execution
const affinitySchema = new mongoose.Schema({}, { strict: false });
const UserProductAffinity = mongoose.models.UserProductAffinity || mongoose.model('UserProductAffinity', affinitySchema, 'userproductaffinities');

const userFeedSchema = new mongoose.Schema({}, { strict: false });
const UserFeed = mongoose.models.UserFeed || mongoose.model('UserFeed', userFeedSchema, 'userfeeds');

const userAnalyticsSchema = new mongoose.Schema({}, { strict: false });
const UserAnalytics = mongoose.models.UserAnalytics || mongoose.model('UserAnalytics', userAnalyticsSchema, 'useranalytics');

const productAnalyticsSchema = new mongoose.Schema({}, { strict: false });
const ProductAnalytics = mongoose.models.ProductAnalytics || mongoose.model('ProductAnalytics', productAnalyticsSchema, 'productanalytics');

function normalizeArray(arr) {
  const max = Math.max(...arr, 1); // Avoid division by zero
  const min = Math.min(...arr, 0);
  if (max === min) return arr.map(() => 0);
  return arr.map(v => (v - min) / (max - min));
}

async function train() {
  console.log("Starting Content-Based Filtering (Two-Tower NN) Training...");
  
  if (!process.env.MONGO_URI) {
    console.error("Error: MONGO_URI not found.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  try {
    const affinities = await UserProductAffinity.find({}).lean();
    if (affinities.length === 0) {
      console.log("No affinity data found. Aborting.");
      process.exit(0);
    }
    
    // Fetch analytics data
    const userAnalytics = await UserAnalytics.find({}).lean();
    const productAnalytics = await ProductAnalytics.find({}).lean();
    
    // 1. Build Category Vocabulary
    const categorySet = new Set();
    productAnalytics.forEach(p => { if (p.category) categorySet.add(p.category); });
    const categories = Array.from(categorySet);
    const categoryToIndex = {};
    categories.forEach((c, i) => categoryToIndex[c] = i);
    const numCategories = categories.length;
    
    console.log(`Extracted ${numCategories} unique categories.`);
    
    // 2. Map data for quick lookup
    const userMap = {};
    userAnalytics.forEach(u => userMap[String(u.userId)] = u);
    
    const productMap = {};
    productAnalytics.forEach(p => productMap[String(p.productId)] = p);
    
    // 3. Prepare Feature Vectors
    const X_u_data = []; // User features
    const X_m_data = []; // Product features
    const Y_data = [];   // Ratings
    
    const validUsers = new Set();
    const validProducts = new Set();
    
    for (const aff of affinities) {
      const uId = String(aff.userId);
      const pId = String(aff.productId);
      const u = userMap[uId];
      const p = productMap[pId];
      
      if (!u || !p) continue; // Skip if analytics missing
      
      validUsers.add(uId);
      validProducts.add(pId);
      
      // Build User Vector
      const catAffinities = new Array(numCategories).fill(0);
      if (u.categoryAffinities) {
        for (const [cat, count] of Object.entries(u.categoryAffinities)) {
          if (categoryToIndex[cat] !== undefined) {
            catAffinities[categoryToIndex[cat]] = Number(count);
          }
        }
      }
      const uFeat = [
        Number(u.totalInteractions || 0),
        Number(u.avgPricePoint || 0),
        ...catAffinities
      ];
      X_u_data.push(uFeat);
      
      // Build Product Vector
      const pCatOneHot = new Array(numCategories).fill(0);
      if (p.category && categoryToIndex[p.category] !== undefined) {
        pCatOneHot[categoryToIndex[p.category]] = 1;
      }
      const pFeat = [
        Number(p.price || 0),
        Number(p.totalViews || 0),
        Number(p.totalAddsToCart || 0),
        Number(p.totalPurchases || 0),
        Number(p.totalWishlists || 0),
        Number(p.avgDwellTimeSeconds || 0),
        Number(p.avgScrollDepthPercent || 0),
        ...pCatOneHot
      ];
      X_m_data.push(pFeat);
      
      // Target
      Y_data.push([Number(aff.affinityScore || 1.0)]);
    }
    
    if (X_u_data.length === 0) {
      console.log("No valid training pairs found.");
      return;
    }
    
    // 4. Normalize Features (Column-wise)
    const numUserFeatures = X_u_data[0].length;
    const numItemFeatures = X_m_data[0].length;
    
    for (let c = 0; c < numUserFeatures; c++) {
      const col = X_u_data.map(row => row[c]);
      const normCol = normalizeArray(col);
      X_u_data.forEach((row, i) => row[c] = normCol[i]);
    }
    
    for (let c = 0; c < numItemFeatures; c++) {
      const col = X_m_data.map(row => row[c]);
      const normCol = normalizeArray(col);
      X_m_data.forEach((row, i) => row[c] = normCol[i]);
    }
    
    // 5. Build Tensors
    const tensor_Xu = tf.tensor2d(X_u_data);
    const tensor_Xm = tf.tensor2d(X_m_data);
    const tensor_Y = tf.tensor2d(Y_data);
    
    console.log(`Training data shape: Users [${tensor_Xu.shape}], Items [${tensor_Xm.shape}]`);
    
    // 6. Define Two-Tower Model Architecture
    // User Tower (v_u)
    const inputUser = tf.input({ shape: [numUserFeatures] });
    let denseUser = tf.layers.dense({ units: 256, activation: 'relu' }).apply(inputUser);
    denseUser = tf.layers.dense({ units: 128, activation: 'relu' }).apply(denseUser);
    const v_u = tf.layers.dense({ units: 32 }).apply(denseUser);
    
    // Item Tower (v_m)
    const inputItem = tf.input({ shape: [numItemFeatures] });
    let denseItem = tf.layers.dense({ units: 256, activation: 'relu' }).apply(inputItem);
    denseItem = tf.layers.dense({ units: 128, activation: 'relu' }).apply(denseItem);
    const v_m = tf.layers.dense({ units: 32 }).apply(denseItem);
    
    // Dot Product Output with built-in L2 Normalization (Cosine Similarity)
    const output = tf.layers.dot({ axes: 1, normalize: true }).apply([v_u, v_m]);
    
    const model = tf.model({ inputs: [inputUser, inputItem], outputs: output });
    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
    
    // 7. Train Model
    console.log("Training Neural Network...");
    await model.fit([tensor_Xu, tensor_Xm], tensor_Y, {
      epochs: 50,
      batchSize: 32,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0 || epoch === 49) {
            console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}`);
          }
        }
      }
    });
    
    // 8. Generate Embeddings for all users and items
    // Build isolated tower models to extract embeddings
    const userModel = tf.model({ inputs: inputUser, outputs: v_u });
    const itemModel = tf.model({ inputs: inputItem, outputs: v_m });
    
    // Unique users and items
    const uniqueUserIds = Array.from(validUsers);
    const uniqueItemIds = Array.from(validProducts);
    
    // Create unique feature matrices mapping dictionaries
    const uFeatMap = {};
    const pFeatMap = {};
    
    let featIdx = 0;
    for (const aff of affinities) {
      const uId = String(aff.userId);
      const pId = String(aff.productId);
      if (userMap[uId] && productMap[pId]) {
        if (!uFeatMap[uId]) uFeatMap[uId] = X_u_data[featIdx];
        if (!pFeatMap[pId]) pFeatMap[pId] = X_m_data[featIdx];
        featIdx++;
      }
    }
    
    const unique_Xu_data = uniqueUserIds.map(uId => uFeatMap[uId]);
    const unique_Xm_data = uniqueItemIds.map(pId => pFeatMap[pId]);
    
    const t_unique_Xu = tf.tensor2d(unique_Xu_data, [uniqueUserIds.length, numUserFeatures]);
    const t_unique_Xm = tf.tensor2d(unique_Xm_data, [uniqueItemIds.length, numItemFeatures]);
    
    const v_u_preds = userModel.predict(t_unique_Xu).arraySync();
    const v_m_preds = itemModel.predict(t_unique_Xm).arraySync();
    
    // 9. Save embeddings to MongoDB
    for (let i = 0; i < uniqueUserIds.length; i++) {
      const uId = new mongoose.Types.ObjectId(uniqueUserIds[i]);
      const userEmbedding = v_u_preds[i];
      
      await UserFeed.updateOne(
        { userId: uId },
        { 
          $set: {
            cbfEmbedding: userEmbedding,
            cbfLastComputedAt: new Date()
          }
        },
        { upsert: true }
      );
    }
    
    // Save Product Embeddings
    for (let i = 0; i < uniqueItemIds.length; i++) {
      const pId = uniqueItemIds[i];
      const itemEmbedding = v_m_preds[i];
      
      await ProductAnalytics.updateOne(
        { productId: pId },
        {
          $set: {
            cbfEmbedding: itemEmbedding
          }
        }
      );
    }
    
    // Save complete weights to filesystem
    const fs = require('fs');
    const path = require('path');
    const cbfModelDir = path.resolve(__dirname, 'models/cbf');
    if (!fs.existsSync(cbfModelDir)) fs.mkdirSync(cbfModelDir, { recursive: true });
    
    fs.writeFileSync(path.join(cbfModelDir, 'weights.json'), JSON.stringify({
      v_u: v_u_preds,
      v_m: v_m_preds,
      uniqueUserIds,
      uniqueItemIds
    }));
    console.log(`Saved Content-Based Filtering raw weights to ${path.join(cbfModelDir, 'weights.json')}`);
    
    console.log(`Saved Content-Based Filtering embeddings for ${uniqueUserIds.length} users and ${uniqueItemIds.length} products.`);
    
    // Cleanup
    tf.dispose([tensor_Xu, tensor_Xm, tensor_Y, t_unique_Xu, t_unique_Xm]);
    
  } catch (error) {
    console.error("Training failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

if (require.main === module) {
  train().catch(console.error);
}

module.exports = { train };
