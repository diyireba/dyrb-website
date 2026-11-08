-- Apply to the live catalog when the menu update is ready to publish.
-- Keep the original item IDs for order history and any existing references.
begin;

update public.menu_items as item
set price = prices.price
from (values
  ('Macallan 12 Yrs Double Cask · Single', 550.00),
  ('Macallan 12 Yrs Double Cask · Twin', 990.00),
  ('Martell VSOP · Single', 580.00),
  ('Martell VSOP · Twin', 990.00),
  ('Martell Cordon Bleu · Single', 980.00),
  ('Martell Cordon Bleu · Twin', 1888.00)
) as prices(name, price)
where item.category = 'spirits'
  and item.event_id is null
  and item.name_en = prices.name;

update public.menu_items
set active = false, available = false
where event_id is null
  and (category, name_en) in (('cocktails', 'Dry Martini'), ('soft', 'Cranberry Juice'));

insert into public.menu_items
  (category, name_en, name_bm, description_en, description_bm, price, image_url, tag, sort_order)
values
  ('spirits', 'Macallan 12 Yrs Sherry Oak · Single', 'Macallan 12 Tahun Sherry Oak · Single',
   'Whisky', 'Wiski', 580.00, '/images/drink-spirits-macallan-12-yrs-sherry-oak.webp', 'S06', 80),
  ('spirits', 'Macallan 12 Yrs Sherry Oak · Twin', 'Macallan 12 Tahun Sherry Oak · Twin',
   'Whisky', 'Wiski', 990.00, '/images/drink-spirits-macallan-12-yrs-sherry-oak.webp', 'S06', 81),
  ('mains', 'Grilled Chicken Chop with Hoisin Caramel Sauce', 'Ayam Panggang dengan Sos Karamel Hoisin',
   '', '', 18.00, '/images/food-hoisin-caramel-chicken-chop.webp', 'F15', 82),
  ('bites', 'Chicken Nuggets', 'Nuget Ayam',
   '', '', 17.00, '/images/event-chicken-nugget.webp', 'F16', 83),
  ('bites', 'Fish Sauce Chicken Wing', 'Sayap Ayam Sos Ikan',
   '', '', 16.00, '/images/food-fish-sauce-chicken-wing.webp', 'F17', 84),
  ('bites', 'Pan Seared Dumpling with Spicy Ginger', 'Ladu Goreng Kuali dengan Halia Pedas',
   '', '', 15.00, '/images/food-pan-seared-dumpling-spicy-ginger.webp', 'F18', 85),
  ('bites', 'Chinese Chili Oil Dumpling', 'Ladu Cina dengan Minyak Cili',
   '', '', 15.00, '/images/food-chinese-chili-oil-dumpling.webp', 'F19', 86),
  ('bites', 'Edamame', 'Edamame',
   'Edamame pods', 'Kacang edamame dalam kulit', 17.00, '/images/event-edamame.webp', 'F20', 87),
  ('bites', 'DYRB Crispy Fish Skin', 'Kulit Ikan Rangup DYRB',
   '', '', 18.00, '/images/food-dyrb-crispy-fish-skin.webp', 'F21', 88),
  ('bottle', 'Carlsberg Green Crate · 1 bottle', 'Carlsberg Green Crate · 1 botol',
   '', '', 19.00, '/images/drink-bottle-carlsberg-green-crate.webp', 'BB02', 89),
  ('bottle', 'Carlsberg Green Crate · 5 bottles', 'Carlsberg Green Crate · 5 botol',
   '', '', 90.00, '/images/drink-bottle-carlsberg-green-crate.webp', 'BB02', 90),
  ('bottle', 'Carlsberg Green Crate · 24 bottles', 'Carlsberg Green Crate · 24 botol',
   '', '', 388.00, '/images/drink-bottle-carlsberg-green-crate.webp', 'BB02', 91)
on conflict (category, name_en, description_en) do nothing;

commit;
