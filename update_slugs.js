const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

if (!urlMatch || !keyMatch) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function updateSlugs() {
  console.log("Fetching products with null slug...");
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug')
    .is('slug', null);

  if (error) {
    console.error("Error fetching products:", error);
    return;
  }

  if (!products || products.length === 0) {
    console.log("No products found with null slug. All good!");
    return;
  }

  console.log(`Found ${products.length} products to update.`);

  for (const product of products) {
    if (!product.name) continue;
    
    const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    
    console.log(`Updating product ${product.id} - Name: "${product.name}" -> Slug: "${slug}"`);
    
    const { error: updateError } = await supabase
      .from('products')
      .update({ slug })
      .eq('id', product.id);
      
    if (updateError) {
      console.error(`Error updating product ${product.id}:`, updateError);
    }
  }
  
  console.log("Slug update complete!");
}

updateSlugs();
