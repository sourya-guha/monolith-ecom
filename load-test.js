import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // ramp up to 20 users
    { duration: '1m', target: 20 },  // stay at 20 users
    { duration: '30s', target: 50 }, // ramp up to 50 users
    { duration: '1m', target: 50 },  // stay at 50 users
    { duration: '30s', target: 0 },  // ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // less than 1% errors
  },
};

const BASE_URL = 'https://monolith-ecom.vercel.app';

export default function () {
  // 1. Visit Home Page
  const homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, {
    'home status is 200': (r) => r.status === 200,
    'home page loads fast': (r) => r.timings.duration < 1000,
  });

  sleep(1);

  // 2. Visit Shop Page
  const shopRes = http.get(`${BASE_URL}/shop`);
  check(shopRes, {
    'shop status is 200': (r) => r.status === 200,
    'shop page loads fast': (r) => r.timings.duration < 1500,
  });

  sleep(2);
}
