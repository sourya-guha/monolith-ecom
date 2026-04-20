/**
 * 🌱 Product Seed Script for PROJECT-X
 *
 * HOW TO USE:
 *   1. First, create a seller account through the app UI:
 *      - Go to /signin → Sign Up → Select "Seller" → Enter details → Verify OTP from email
 *   2. Update SELLER credentials below with YOUR seller's email & password
 *   3. Run: node seed-products.mjs                              (local backend)
 *      Or:  node seed-products.mjs https://your-api.onrender.com/api  (production)
 *
 * WHY: Registration requires OTP email verification, but LOGIN returns
 *       a JWT token directly — so the script logs in and uses that token.
 */

const API = process.argv[2] || 'http://localhost:5000/api';

// ⬇️ UPDATE THESE with your real seller account credentials
const SELLER = {
  email: 'seller@projectx.store',
  password: 'Seller@1234',
};

const PRODUCTS = [
  // Electronics
  { name: 'AirPods Pro Max', description: 'Premium wireless headphones with active noise cancellation, spatial audio, and 30-hour battery life. Crafted with aerospace-grade aluminum.', price: 549, category: 'Electronics', stock: 45, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'] },
  { name: 'Ultra Slim Laptop 15"', description: 'Powerful ultrabook with M3 chip, 16GB RAM, 512GB SSD. Retina display with True Tone. Perfect for professionals on the go.', price: 1299, category: 'Electronics', stock: 20, images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600'] },
  { name: 'Smart Watch Series X', description: 'Health & fitness companion with ECG, blood oxygen monitoring, always-on display, and 48-hour battery. Water resistant to 50m.', price: 399, category: 'Electronics', stock: 60, images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'] },
  { name: 'Wireless Charging Pad', description: 'Fast 15W Qi wireless charger with LED indicator. Compatible with all Qi-enabled devices. Sleek minimalist design.', price: 39, category: 'Electronics', stock: 150, images: ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600'] },

  // Clothing
  { name: 'Premium Cotton Hoodie', description: 'Ultra-soft organic cotton hoodie with kangaroo pocket. Relaxed fit, brushed fleece interior. Available in midnight black.', price: 89, category: 'Clothing', stock: 100, images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600'] },
  { name: 'Classic Leather Jacket', description: 'Hand-crafted genuine leather jacket with satin lining. Timeless biker style with modern comfort. Built to last a lifetime.', price: 299, category: 'Clothing', stock: 25, images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600'] },
  { name: 'Running Sneakers V2', description: 'Lightweight performance running shoes with responsive foam cushioning and breathable mesh upper. Ideal for daily training.', price: 129, category: 'Clothing', stock: 80, images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'] },
  { name: 'Minimalist Canvas Backpack', description: 'Water-resistant waxed canvas backpack with laptop compartment. Fits 15" laptops. Handmade with premium brass hardware.', price: 79, category: 'Clothing', stock: 55, images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600'] },

  // Books
  { name: 'The Art of Clean Code', description: 'A comprehensive guide to writing maintainable, scalable software. Covers design patterns, testing, and modern best practices.', price: 34, category: 'Books', stock: 200, images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600'] },
  { name: 'Atomic Habits', description: 'The #1 bestseller on building good habits and breaking bad ones. Proven strategies backed by scientific research.', price: 16, category: 'Books', stock: 300, images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600'] },
  { name: 'Design Systems Handbook', description: 'Everything you need to know about creating and maintaining design systems. From tokens to components to documentation.', price: 45, category: 'Books', stock: 120, images: ['https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600'] },

  // Home & Garden
  { name: 'Ceramic Plant Pot Set', description: 'Set of 3 handmade ceramic planters in matte finish. Includes drainage holes and bamboo saucers. Modern Scandinavian design.', price: 49, category: 'Home & Garden', stock: 75, images: ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600'] },
  { name: 'Smart LED Desk Lamp', description: 'Eye-care LED desk lamp with wireless charging base, 5 color temperatures, touch controls, and USB-C port.', price: 69, category: 'Home & Garden', stock: 90, images: ['https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600'] },
  { name: 'Bamboo Kitchen Organizer', description: 'Multi-tier bamboo shelf organizer for kitchen countertops. Expandable design fits any space. Eco-friendly sustainable material.', price: 35, category: 'Home & Garden', stock: 110, images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600'] },

  // Sports
  { name: 'Yoga Mat Premium', description: 'Extra thick 6mm eco-friendly TPE yoga mat with alignment lines. Non-slip surface, free carry strap included.', price: 45, category: 'Sports', stock: 85, images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600'] },
  { name: 'Resistance Band Set', description: 'Professional 5-band set with door anchor, handles, and ankle straps. Progressive resistance from 10-50 lbs.', price: 29, category: 'Sports', stock: 200, images: ['https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600'] },
  { name: 'Stainless Steel Water Bottle', description: 'Vacuum insulated 1L bottle. Keeps drinks cold 24hrs or hot 12hrs. BPA-free, leak-proof lid, powder-coated finish.', price: 25, category: 'Sports', stock: 250, images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600'] },

  // Beauty
  { name: 'Vitamin C Brightening Serum', description: 'Potent 20% Vitamin C serum with hyaluronic acid and vitamin E. Brightens skin, fades dark spots, boosts collagen.', price: 38, category: 'Beauty', stock: 130, images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600'] },
  { name: 'Organic Face Cream', description: 'Rich daily moisturizer with shea butter, jojoba oil, and green tea extract. For all skin types. Dermatologist tested.', price: 42, category: 'Beauty', stock: 95, images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600'] },
  { name: 'Luxury Perfume - Noir', description: 'Sophisticated unisex fragrance with notes of black amber, bergamot, and sandalwood. Long-lasting 12-hour wear.', price: 120, category: 'Beauty', stock: 40, images: ['https://images.unsplash.com/photo-1541643600914-78b084683601?w=600'] },
];

// ─── Helpers ─────────────────────────────────────────
async function api(endpoint, { token, ...opts } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${endpoint}`, { ...opts, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json.message || json.error || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return json;
}

// ─── Main ────────────────────────────────────────────
async function main() {
  console.log(`\n🌱 PROJECT-X Product Seeder`);
  console.log(`   API: ${API}\n`);

  // Step 1: Login (login gives token directly, no OTP)
  console.log(`🔐 Logging in as seller: ${SELLER.email}`);
  let token;
  try {
    const loginRes = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify(SELLER),
    });
    token = loginRes.data?.token || loginRes.token;

    if (!token) {
      console.log('   ❌ Login succeeded but no token received.');
      console.log('   Response:', JSON.stringify(loginRes).slice(0, 300));
      return;
    }

    const userName = loginRes.data?.user?.name || 'Seller';
    const userRole = loginRes.data?.user?.role || '?';
    console.log(`   ✅ Logged in as "${userName}" (role: ${userRole})\n`);

    if (userRole !== 'seller') {
      console.log(`   ⚠️  WARNING: This account has role "${userRole}", not "seller".`);
      console.log(`   Products can only be created with a seller account.\n`);
      return;
    }
  } catch (e) {
    console.log(`   ❌ Login failed: ${e.message}`);
    console.log(`\n   👉 FIRST, create a seller account through the app:`);
    console.log(`      1. Open your app → go to Sign Up page`);
    console.log(`      2. Choose "Seller", enter name/email/password`);
    console.log(`      3. Verify the OTP sent to your email`);
    console.log(`      4. Update SELLER.email and SELLER.password in this script`);
    console.log(`      5. Run this script again\n`);
    return;
  }

  // Step 2: Create products
  console.log(`📦 Creating ${PRODUCTS.length} products...\n`);
  let created = 0;
  let failed = 0;

  for (const product of PRODUCTS) {
    try {
      await api('/seller/products', {
        method: 'POST',
        body: JSON.stringify(product),
        token,
      });
      created++;
      console.log(`   ✅ ${product.name.padEnd(30)} $${String(product.price).padStart(6)}  (${product.category})`);
    } catch (e) {
      failed++;
      console.log(`   ❌ ${product.name}: ${e.message}`);
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`🎉 Done! Created ${created}/${PRODUCTS.length} products.${failed > 0 ? ` (${failed} failed)` : ''}`);
  console.log(`\n   🛒 View your shop: http://localhost:3000/shop`);
  console.log(`   👤 Seller login: ${SELLER.email}\n`);
}

main().catch(console.error);
