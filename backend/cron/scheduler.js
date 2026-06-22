const cron = require('node-cron');
const { spawn } = require('child_process');
const path = require('path');
const weightsManager = require('../ml/weightsManager');


const runTraining = () => {
  console.log('[Cron] Triggering Collaborative Filtering Model Training...');
  
  const scriptPath = path.join(__dirname, '../ml/train_cf.js');
  const mlProcess = spawn('node', [scriptPath]);
  
  mlProcess.stdout.on('data', (data) => {
    console.log(`[ML Training] ${data.toString().trim()}`);
  });
  
  mlProcess.stderr.on('data', (data) => {
    console.error(`[ML Error] ${data.toString().trim()}`);
  });
  
  mlProcess.on('close', (code) => {
    console.log(`[Cron] ML Training script finished with exit code ${code}`);
    
    if (code === 0) {
      weightsManager.loadCFWeights();
      console.log('[Cron] Triggering Content-Based Filtering (Two-Tower) Model Training...');
      const cbfPath = path.join(__dirname, '../ml/train_cbf.js');
      const cbfProcess = spawn('node', [cbfPath]);
      
      cbfProcess.stdout.on('data', (data) => {
        console.log(`[CBF Training] ${data.toString().trim()}`);
      });
      
      cbfProcess.stderr.on('data', (data) => {
        console.error(`[CBF Error] ${data.toString().trim()}`);
      });
      
      cbfProcess.on('close', (cbfCode) => {
        console.log(`[Cron] CBF Training script finished with exit code ${cbfCode}`);
        if (cbfCode === 0) {
          weightsManager.loadCBFWeights();
        }
      });
    }
  });
};

const startCronJobs = () => {
  // Run it immediately when the server starts
  runTraining();

  // Schedule the same task to run every hour (Minute 0 of every hour)
  cron.schedule('0 * * * *', runTraining);
  
  console.log('[Cron] Scheduler initialized. ML Training runs immediately and every hour.');
};

module.exports = { startCronJobs };
