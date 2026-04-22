import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
};

const API_ROOT = 'https://ecom-backend-s752.onrender.com';
const API_BASE_URL = `${API_ROOT}/api`;

export default function () {
  // --- TEST 0: DEFAULT URL (Root path) ---
  const res0 = http.get(`${API_ROOT}/`);
  check(res0, { 'base url status is 200': (r) => r.status === 200 });

  // --- TEST 1: GET ALL PRODUCTS ---
  // const res1 = http.get(`${API_BASE_URL}/user/products`);
  // check(res1, { 'products status is 200': (r) => r.status === 200 });

  // --- TEST 2: GET CATEGORIES ---
  // const res2 = http.get(`${API_BASE_URL}/user/products/categories`);
  // check(res2, { 'categories status is 200': (r) => r.status === 200 });

  sleep(1);
}
