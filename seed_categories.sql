-- DEVKI JEWELS — SEED CATEGORIES MIGRATION
-- Execute this script in your Supabase SQL Editor to populate default categories

INSERT INTO public.categories (name, slug, description, display_order, is_active)
VALUES
    ('Rings', 'rings', 'Explore our exquisite collection of diamond, gold, and platinum rings.', 1, true),
    ('Earrings', 'earrings', 'Discover beautiful studs, drops, hoops, and chandelier earrings.', 2, true),
    ('Necklaces', 'necklace', 'Elegant necklaces and chains for every occasion.', 3, true),
    ('Bangles', 'bangles', 'Traditional and modern bangles crafted to perfection.', 4, true),
    ('Bracelets', 'bracelets', 'Stunning bracelets to adorn your wrists.', 5, true),
    ('Pendants', 'pendants', 'Delicate and statement pendants in various designs.', 6, true),
    ('Mangalsutras', 'mangalsutra', 'Sacred threads of love with modern aesthetics.', 7, true),
    ('Jewellery Sets', 'jewellery-sets', 'Complete sets for your special moments.', 8, true)
ON CONFLICT (slug) DO UPDATE 
SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order;
