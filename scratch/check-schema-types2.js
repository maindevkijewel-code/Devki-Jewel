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

async function checkSchema2() {
  const { error: insertErr } = await supabase
    .from('products')
    .insert({
      id: 'test-dummy-schema-3',
      name: 'Test',
      category: 'rings',
      price: 1,
      metal_type: 'gold',
      style: 'Elegant'
    });
    
  console.log("Insert style string error:", insertErr);
}

checkSchema2();
