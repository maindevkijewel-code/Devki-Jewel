import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { products } from '../lib/mockData';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key in .env.local");
  process.exit(1);
}

// Note: Ensure that PRODUCTS table has permissive RLS for inserts during this dev run,
// OR use service_role key to bypass RLS. For local dev, anon key should work if RLS is 'true'.
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedProducts() {
  console.log(`Starting to seed ${products.length} products...`);
  
  for (const product of products) {
    const { id, name, price, priceNum, originalPrice, originalPriceNum,
            image, hoverImage, images, isLatest, category, description,
            material, gemstone, weight, purity } = product;

    // Derived properties for filter support based on mock data text
    const lowerMaterial = material.toLowerCase();
    const lowerGemstone = gemstone.toLowerCase();
    
    let metal_type = 'Gold';
    if (lowerMaterial.includes('rose gold')) metal_type = 'Rose Gold';
    else if (lowerMaterial.includes('white gold')) metal_type = 'White Gold';
    else if (lowerMaterial.includes('platinum')) metal_type = 'Platinum';
    else if (lowerMaterial.includes('silver')) metal_type = 'Silver';

    let collection = 'Everyday Essentials';
    if (lowerGemstone.includes('diamond')) collection = 'Shaya Diamonds';
    if (priceNum > 30000) collection = 'Bestsellers';

    const insertData = {
      id,
      name,
      price: priceNum,
      original_price: originalPriceNum,
      image,
      hover_image: hoverImage,
      images,
      is_latest: isLatest,
      category,
      description,
      material,
      gemstone,
      weight: parseFloat(weight.replace(/[a-zA-Z\s()]/g, '')),
      purity,
      metal_type,
      diamond_size: lowerGemstone.includes('diamond') ? 2.5 : null, // mock
      diamond_clarity: lowerGemstone.includes('vs') ? 'VS' : lowerGemstone.includes('vvs') ? 'VVS' : null,
      diamond_color: 'F-G', // mock
      diamond_shape: 'Round', // mock
      occasion: priceNum > 40000 ? ['Wedding', 'Festive'] : ['Casual', 'Office'],
      collection,
      in_stock: true
    };

    const { error } = await supabase
      .from('products')
      .upsert(insertData, { onConflict: 'id' });

    if (error) {
      console.error(`Error inserting ${id}:`, error.message);
    } else {
      console.log(`Successfully seeded ${id}`);
    }
  }
  
  console.log("Seeding complete!");
}

seedProducts();
