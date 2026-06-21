const tf = require('@tensorflow/tfjs');

async function testSave() {
  const model = tf.sequential();
  model.add(tf.layers.dense({units: 1, inputShape: [1]}));
  
  try {
    await model.save('file://./test-model');
    console.log("Success");
  } catch (err) {
    console.error("Failed:", err.message);
  }
}

testSave();
