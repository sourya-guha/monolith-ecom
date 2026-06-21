const fs = require('fs');
const path = require('path');

let cfWeights = null;
let cbfWeights = null;

const loadCFWeights = () => {
  try {
    const cfModelDir = path.resolve(__dirname, 'models/cf');
    const cfWeightsPath = path.join(cfModelDir, 'weights.json');
    if (fs.existsSync(cfWeightsPath)) {
      const weightsStr = fs.readFileSync(cfWeightsPath, 'utf8');
      cfWeights = JSON.parse(weightsStr);
      console.log('[WeightsManager] Loaded CF weights into RAM.');
    } else {
      console.log('[WeightsManager] CF weights file not found.');
    }
  } catch (err) {
    console.error('[WeightsManager] Failed to load CF weights:', err);
  }
};

const loadCBFWeights = () => {
  try {
    const cbfModelDir = path.resolve(__dirname, 'models/cbf');
    const cbfWeightsPath = path.join(cbfModelDir, 'weights.json');
    if (fs.existsSync(cbfWeightsPath)) {
      const weightsStr = fs.readFileSync(cbfWeightsPath, 'utf8');
      cbfWeights = JSON.parse(weightsStr);
      console.log('[WeightsManager] Loaded CBF weights into RAM.');
    } else {
      console.log('[WeightsManager] CBF weights file not found.');
    }
  } catch (err) {
    console.error('[WeightsManager] Failed to load CBF weights:', err);
  }
};

const getCFWeights = () => cfWeights;
const getCBFWeights = () => cbfWeights;

// Load initially on module load
loadCFWeights();
loadCBFWeights();

module.exports = {
  loadCFWeights,
  loadCBFWeights,
  getCFWeights,
  getCBFWeights,
};
