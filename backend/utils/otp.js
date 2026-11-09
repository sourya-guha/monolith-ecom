const bcrypt = require('bcryptjs');
const { redisClient } = require('../config/redis');
const { logDependencyError } = require('./dependency-logger');

const OTP_TTL_SECONDS = 120;
const OTP_REQUEST_LIMIT = 5;
const OTP_REQUEST_WINDOW_SECONDS = 30 * 60; // 30 minutes
const OTP_FAILED_ATTEMPT_LIMIT = 5;
const OTP_FAILED_ATTEMPT_WINDOW_SECONDS = 30 * 60; // 30 minutes

function otpKey(email) {
  return `otp:${email.toLowerCase()}`;
}

function otpRequestKey(email) {
  return `otp-requests:${email.toLowerCase()}`;
}

function otpFailureKey(email) {
  return `otp-failures:${email.toLowerCase()}`;
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function runRedis(operation, callback) {
  try {
    if (!redisClient.isReady) {
      const error = new Error('Redis is not ready');
      error.code = 'REDIS_UNAVAILABLE';
      throw error;
    }
    return await callback();
  } catch (error) {
    logDependencyError('redis', `otp.${operation}`, error);
    const unavailable = new Error('OTP verification is temporarily unavailable');
    unavailable.code = 'REDIS_UNAVAILABLE';
    throw unavailable;
  }
}

async function canRequestOtp(email) {
  const key = otpRequestKey(email);
  return runRedis('check_request_limit', async () => {
    const current = Number(await redisClient.get(key) || 0);
    return current < OTP_REQUEST_LIMIT;
  });
}

async function recordOtpRequest(email) {
  const key = otpRequestKey(email);
  return runRedis('record_request', async () => {
    const current = await redisClient.incr(key);
    if (current === 1) {
      await redisClient.expire(key, OTP_REQUEST_WINDOW_SECONDS);
    }
    return current;
  });
}

async function recordOtpFailure(email) {
  const key = otpFailureKey(email);
  return runRedis('record_failure', async () => {
    const current = await redisClient.incr(key);
    if (current === 1) {
      await redisClient.expire(key, OTP_FAILED_ATTEMPT_WINDOW_SECONDS);
    }
    return current;
  });
}

async function hasTooManyOtpFailures(email) {
  const key = otpFailureKey(email);
  return runRedis('check_failure_limit', async () => {
    const current = Number(await redisClient.get(key) || 0);
    return current >= OTP_FAILED_ATTEMPT_LIMIT;
  });
}

async function storeOtp(email, otp) {
  const key = otpKey(email);
  const hashedOtp = await bcrypt.hash(otp, 10);
  return runRedis('store_code', () => redisClient.set(key, hashedOtp, { EX: OTP_TTL_SECONDS }));
}

async function verifyOtp(email, otp) {
  const key = otpKey(email);
  return runRedis('verify_code', async () => {
    const hashedOtp = await redisClient.get(key);
    if (!hashedOtp) {
      return false;
    }

    const isValid = await bcrypt.compare(otp, hashedOtp);
    if (!isValid) {
      await recordOtpFailure(email);
      return false;
    }

    await redisClient.del(key);
    return true;
  });
}

module.exports = {
  generateOtp,
  canRequestOtp,
  recordOtpRequest,
  storeOtp,
  verifyOtp,
  hasTooManyOtpFailures,
};
