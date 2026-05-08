const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_schema_info'); // if it exists
  
  // Alternative: query information_schema if possible
  const { data: cols, error: err } = await supabase
    .from('products')
    .select('occasion, style, tags')
    .limit(1);
    
  console.log("Cols error:", err);
  
  // Try to insert a dummy to see the error
  const { error: insertErr } = await supabase
    .from('products')
    .insert({
      id: 'test-dummy-schema',
      name: 'Test',
      category: 'rings',
      price: 1,
      metal_type: 'gold',
      occasion: 'Wedding / Bridal'
    });
    
  console.log("Insert occasion string error:", insertErr);

  const { error: insertErr2 } = await supabase
    .from('products')
    .insert({
      id: 'test-dummy-schema-2',
      name: 'Test',
      category: 'rings',
      price: 1,
      metal_type: 'gold',
      occasion: ['Wedding / Bridal']
    });
    
  console.log("Insert occasion array error:", insertErr2);
}

checkSchema();
