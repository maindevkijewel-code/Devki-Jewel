-- Give insert permissions to the public so the seed script works
CREATE POLICY "Enable temporary insert" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable temporary update" ON public.products FOR UPDATE USING (true);
