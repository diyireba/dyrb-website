import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const isLive = Boolean(supabaseUrl && supabaseKey)
export const supabase = isLive ? createClient(supabaseUrl, supabaseKey) : null

export const roles = ['owner', 'boss', 'manager', 'staff', 'singer']
export const roleLabels = { owner: 'Owner', boss: 'Boss', manager: 'Manager', staff: 'Staff', singer: 'Singer' }
export const permissionLabels = {
  'orders.view': 'View orders', 'orders.manage': 'Manage orders',
  'songs.view': 'View song requests', 'songs.manage': 'Manage song queue',
  'service.view': 'View service requests', 'service.manage': 'Manage service requests',
  'menu.view': 'View menu', 'menu.manage': 'Manage menu',
  'members.lookup': 'Look up members', 'members.adjust': 'Adjust points and beer balance',
  'members.enroll': 'Enroll members in person',
  'staff.manage': 'Manage staff accounts', 'permissions.manage': 'Grant roles and permissions',
  'tables.manage': 'Manage tables and QR codes',
}

const defaultPermissions = {
  owner: Object.keys(permissionLabels),
  boss: ['orders.view', 'orders.manage', 'songs.view', 'songs.manage', 'service.view', 'service.manage', 'menu.view', 'menu.manage', 'members.lookup', 'members.adjust', 'members.enroll', 'staff.manage', 'tables.manage'],
  manager: ['orders.view', 'orders.manage', 'songs.view', 'songs.manage', 'service.view', 'service.manage', 'menu.view', 'menu.manage', 'members.lookup', 'members.adjust', 'members.enroll'],
  staff: ['orders.view', 'orders.manage', 'service.view', 'service.manage', 'members.lookup', 'members.enroll'],
  singer: ['songs.view', 'songs.manage'],
}
export const demoPermissionMap = defaultPermissions

const demoStaff = [
  { id: 'demo-owner', name: 'Aden Tan', role: 'owner', phone: '0123456789', pin: '111111', active: true },
  { id: 'demo-boss', name: 'Mira Lee', role: 'boss', phone: '0123456790', pin: '222222', active: true },
  { id: 'demo-manager', name: 'Hafiz Rahman', role: 'manager', phone: '0123456791', pin: '333333', active: true },
  { id: 'demo-staff', name: 'Jia Wei', role: 'staff', phone: '0123456792', pin: '444444', active: true },
  { id: 'demo-singer', name: 'Daniel Lim', role: 'singer', phone: '0123456793', pin: '555555', active: true },
]

export const beveragePhotos = {
  "draught|Carlsberg Extra Cold": "/images/drink-draught-carlsberg-extra-cold.webp",
  "draught|Connor’s": "/images/drink-draught-connor-s.webp",
  "draught|Sapporo Premium Beer": "/images/drink-draught-sapporo-premium-beer.webp",
  "bottle|Carlsberg Smooth": "/images/drink-bottle-carlsberg-smooth.webp",
  "cocktails|Blue Lagoon": "/images/drink-cocktails-blue-lagoon.webp",
  "cocktails|Daiquiri": "/images/drink-cocktails-daiquiri.webp",
  "cocktails|Dry Martini": "/images/drink-cocktails-dry-martini.webp",
  "cocktails|Long Island Ice Tea": "/images/drink-cocktails-long-island-ice-tea.webp",
  "cocktails|Margarita": "/images/drink-cocktails-margarita.webp",
  "cocktails|Negroni": "/images/drink-cocktails-negroni.webp",
  "cocktails|Screwdriver": "/images/drink-cocktails-screwdriver.webp",
  "cocktails|Shandy": "/images/drink-cocktails-shandy.webp",
  "cocktails|Tequila Sunrise": "/images/drink-cocktails-tequila-sunrise.webp",
  "mocktails|Virgin Blue Lagoon": "/images/drink-mocktails-virgin-blue-lagoon.webp",
  "mocktails|Virgin Sunrise": "/images/drink-mocktails-virgin-sunrise.webp",
  "soft|Orange Juice": "/images/drink-soft-orange-juice.webp",
  "soft|Mango Juice": "/images/drink-soft-mango-juice.webp",
  "soft|Lemonade": "/images/drink-soft-lemonade.webp",
  "soft|Fresh Lemon Juice": "/images/drink-soft-fresh-lemon-juice.webp",
  "soft|Fresh Lime Juice": "/images/drink-soft-fresh-lime-juice.webp",
  "soft|Fresh Lemon Tea": "/images/drink-soft-fresh-lemon-tea.webp",
  "soft|Fresh Honey Lemon": "/images/drink-soft-fresh-honey-lemon.webp",
  "soft|Cranberry Juice": "/images/drink-soft-cranberry-juice.webp",
  "soft|Ayataka Green Tea": "/images/drink-soft-ayataka-green-tea.webp",
  "soft|Coke": "/images/drink-soft-coke.webp",
  "soft|Sprite": "/images/drink-soft-sprite.webp",
  "soft|Ginger Ale": "/images/drink-soft-ginger-ale.webp",
  "soft|Soda Water": "/images/drink-soft-soda-water.webp",
  "soft|Tonic Water": "/images/drink-soft-tonic-water.webp",
  "soft|Mineral Water": "/images/drink-soft-mineral-water.webp",
  "spirits|Singleton of Glen Ord 12 Yrs": "/images/drink-spirits-singleton-of-glen-ord-12-yrs.webp",
  "spirits|Macallan 12 Yrs Double Cask": "/images/drink-spirits-macallan-12-yrs-double-cask.webp",
  "spirits|Hennessy VSOP": "/images/drink-spirits-hennessy-vsop.webp",
  "spirits|Martell VSOP": "/images/drink-spirits-martell-vsop.webp",
  "spirits|Martell Cordon Bleu": "/images/drink-spirits-martell-cordon-bleu.webp",
  "spirits|Roku Suntory Japanese Gin": "/images/drink-spirits-roku-suntory-japanese-gin.webp",
  "cocktails|DYRB Special (Haaland)": "/images/drink-cocktails-dyrb-special-haaland.webp",
  "mocktails|DYRB Special Virgin Haaland": "/images/drink-mocktails-dyrb-special-virgin-haaland.webp",
  "cocktails|See You Tomorrow": "/images/drink-cocktails-see-you-tomorrow.webp",
  "cocktails|Grave Yard": "/images/drink-cocktails-grave-yard.webp"
}
export function beveragePhoto(category, name = '') {
  return beveragePhotos[`${category}|${name.split(' · ')[0]}`] || ''
}

const menuSeed = [
  // Main course (prices transcribed from the supplied menu photo)
  ['mains', 'Signature Fried Rice with Grilled Chicken Chop', 'Nasi Goreng Istimewa dengan Ayam Panggang', 21, '', '', 'F01', '/images/food-f01.jpg'],
  ['mains', 'Signature Fried Rice with Fried Chicken Chop', 'Nasi Goreng Istimewa dengan Ayam Goreng', 21, '', '', 'F02', '/images/food-f02.jpg'],
  ['mains', 'Teriyaki Grilled Chicken Chop with Fried Rice', 'Ayam Panggang Teriyaki dengan Nasi Goreng', 21, '', '', 'F03', '/images/food-f03.jpg'],
  ['mains', 'Tomyam Fried Rice', 'Nasi Goreng Tomyam', 21, '', '', 'F04', '/images/food-f04.jpg'],
  ['mains', 'Signature Black Pepper Chicken Chop', 'Ayam Panggang Lada Hitam Istimewa', 19, '', '', 'F05', '/images/event-black-pepper.webp'],
  ['mains', 'Salted Egg Chicken Fried Rice', 'Nasi Goreng Ayam Telur Masin', 19, '', '', 'F06', '/images/food-f06.jpg'],
  ['mains', 'Signature Mala Spicy Spaghetti with Chicken Chop', 'Spageti Mala Pedas Istimewa dengan Ayam Panggang', 21, '', '', 'F07', '/images/food-f07.jpg'],
  ['mains', 'Signature Fried Rice with Fried Egg', 'Nasi Goreng Istimewa dengan Telur Goreng', 12, '', '', 'F08', '/images/food-f08.jpg'],
  // Xiang la and skewers
  ['bites', 'Enoki Mushroom', 'Cendawan Enoki', 11, '', '', 'F01', '/images/food-s01.jpg'],
  ['bites', 'Oyster Mushroom', 'Cendawan Tiram', 11, '', '', 'F02', '/images/food-s02.jpg'],
  ['bites', 'Broccoli', 'Brokoli', 11, '', '', 'F03', '/images/food-s03.jpg'],
  ['bites', 'Lotus Root', 'Akar Teratai', 11, '', '', 'F04', '/images/food-s04.jpg'],
  ['bites', 'Taiwan Sausage (8 pcs)', 'Sosej Taiwan (8 ketul)', 17, '', '', 'F05', '/images/food-s05.jpg'],
  ['bites', 'Luncheon Meat', 'Daging Makan Tengah Hari', 17, '', '', 'F06', '/images/food-s06.jpg'],
  ['bites', 'Sausage', 'Sosej', 18, '', '', 'F07', '/images/food-s07.jpg'],
  ['bites', 'Crispy Fucuk', 'Fucuk Rangup', 14, '', '', 'F08', '/images/food-s08.jpg'],
  ['bites', 'Chicken Popcorn', 'Ayam Popcorn', 17, '', '', 'F09', '/images/food-s09.jpg'],
  ['bites', 'Shoestring Potato Fries', 'Kentang Goreng Halus', 10, '', '', 'F10', '/images/food-s10.jpg'],
  ['bites', 'Crispy Mixed Seafood Ball (8 pcs)', 'Bebola Campuran Makanan Laut Rangup (8 ketul)', 14, '', '', 'F11', '/images/food-s11.jpg'],
  ['bites', 'Smoked Duck Skewer (3 pcs)', 'Sate Itik Salai (3 cucuk)', 16, '', '', 'F12', '/images/food-s12.jpg'],
  ['bites', 'Chicken Skewer (3 pcs)', 'Sate Ayam (3 cucuk)', 16, '', '', 'F13', '/images/food-s13.jpg'],
  ['bites', 'Pork Skewer (3 pcs)', 'Sate Babi (3 cucuk)', 16, '', '', 'F14', '/images/food-s14.jpg'],
  // Draught beer prices shown as separate menu choices for happy hour and after 8pm
  ['draught', 'Carlsberg Extra Cold · 1 mug', 'Carlsberg Extra Cold · 1 mug', 15.8, 'Before 8pm', 'Sebelum 8 malam', 'DC01'],
  ['draught', 'Carlsberg Extra Cold · 10 mugs', 'Carlsberg Extra Cold · 10 mug', 148, 'Before 8pm', 'Sebelum 8 malam', 'DC01'],
  ['draught', "Connor’s · 1 mug", "Connor’s · 1 mug", 16.8, 'Before 8pm', 'Sebelum 8 malam', 'DC02'],
  ['draught', "Connor’s · 10 mugs", "Connor’s · 10 mug", 158, 'Before 8pm', 'Sebelum 8 malam', 'DC02'],
  ['draught', 'Sapporo Premium Beer · 1 mug', 'Sapporo Premium Beer · 1 mug', 17.8, 'Before 8pm', 'Sebelum 8 malam', 'DC03'],
  ['draught', 'Sapporo Premium Beer · 10 mugs', 'Sapporo Premium Beer · 10 mug', 168, 'Before 8pm', 'Sebelum 8 malam', 'DC03'],
  ['draught', 'Carlsberg Extra Cold · 1 mug', 'Carlsberg Extra Cold · 1 mug', 18.8, 'After 8pm', 'Selepas 8 malam', 'AC01'],
  ['draught', 'Carlsberg Extra Cold · 10 mugs', 'Carlsberg Extra Cold · 10 mug', 178, 'After 8pm', 'Selepas 8 malam', 'AC01'],
  ['draught', "Connor’s · 1 mug", "Connor’s · 1 mug", 19.8, 'After 8pm', 'Selepas 8 malam', 'AC02'],
  ['draught', "Connor’s · 10 mugs", "Connor’s · 10 mug", 188, 'After 8pm', 'Selepas 8 malam', 'AC02'],
  ['draught', 'Sapporo Premium Beer · 1 mug', 'Sapporo Premium Beer · 1 mug', 20.8, 'After 8pm', 'Selepas 8 malam', 'AC03'],
  ['draught', 'Sapporo Premium Beer · 10 mugs', 'Sapporo Premium Beer · 10 mug', 198, 'After 8pm', 'Selepas 8 malam', 'AC03'],
  ['bottle', 'Carlsberg Smooth · 1 bottle', 'Carlsberg Smooth · 1 botol', 19, '', '', 'BB01'],
  ['bottle', 'Carlsberg Smooth · 5 bottles', 'Carlsberg Smooth · 5 botol', 90, '', '', 'BB01'],
  ['bottle', 'Carlsberg Smooth · 24 bottles', 'Carlsberg Smooth · 24 botol', 388, '', '', 'BB01'],
  // Cocktails and mocktails
  ['cocktails', 'DYRB Special (Haaland)', 'Koktel Istimewa DYRB (Haaland)', 20, '', '', 'CT01'],
  ['cocktails', 'Blue Lagoon', 'Blue Lagoon', 25, '', '', 'CT02'],
  ['cocktails', 'Daiquiri', 'Daiquiri', 18, '', '', 'CT03'],
  ['cocktails', 'Dry Martini', 'Dry Martini', 20, '', '', 'CT04'],
  ['cocktails', 'Long Island Ice Tea', 'Long Island Ice Tea', 20, '', '', 'CT05'],
  ['cocktails', 'Margarita', 'Margarita', 20, '', '', 'CT06'],
  ['cocktails', 'Negroni', 'Negroni', 25, '', '', 'CT07'],
  ['cocktails', 'Screwdriver', 'Screwdriver', 18, '', '', 'CT08'],
  ['cocktails', 'Shandy', 'Shandy', 15, '', '', 'CT09'],
  ['cocktails', 'Tequila Sunrise', 'Tequila Sunrise', 18, '', '', 'CT10'],
  ['cocktails', 'See You Tomorrow', 'Jumpa Lagi Esok', 30, '', '', 'CT11'],
  ['cocktails', 'Grave Yard', 'Grave Yard', 48, '', '', 'CT12'],
  ['mocktails', 'DYRB Special Virgin Haaland', 'Mocktail Istimewa DYRB Haaland', 18, '', '', 'MT01'],
  ['mocktails', 'Virgin Blue Lagoon', 'Virgin Blue Lagoon', 18, '', '', 'MT02'],
  ['mocktails', 'Virgin Sunrise', 'Virgin Sunrise', 18, '', '', 'MT03'],
  // Non-alcoholic drinks
  ['soft', 'Orange Juice', 'Jus Oren', 10, '', '', 'NA01'],
  ['soft', 'Mango Juice', 'Jus Mangga', 10, '', '', 'NA02'],
  ['soft', 'Lemonade', 'Air Lemon', 10, '', '', 'NA03'],
  ['soft', 'Fresh Lemon Juice', 'Jus Lemon Segar', 12, '', '', 'NA04'],
  ['soft', 'Fresh Lime Juice', 'Jus Limau Nipis Segar', 12, '', '', 'NA05'],
  ['soft', 'Fresh Lemon Tea', 'Teh Lemon Segar', 12, '', '', 'NA06'],
  ['soft', 'Fresh Honey Lemon', 'Lemon Madu Segar', 12, '', '', 'NA07'],
  ['soft', 'Cranberry Juice', 'Jus Kranberi', 12, '', '', 'NA08'],
  ['soft', 'Ayataka Green Tea', 'Teh Hijau Ayataka', 10, '', '', 'NA09'],
  ['soft', 'Coke', 'Coca-Cola', 10, '', '', 'NA10'],
  ['soft', 'Sprite', 'Sprite', 10, '', '', 'NA11'],
  ['soft', 'Ginger Ale', 'Air Halia Berkarbonat', 10, '', '', 'NA12'],
  ['soft', 'Soda Water', 'Air Soda', 10, '', '', 'NA13'],
  ['soft', 'Tonic Water', 'Air Tonik', 10, '', '', 'NA14'],
  ['soft', 'Mineral Water · 500ml', 'Air Mineral · 500ml', 3, '', '', 'NA15'],
  // Bottle spirits; each picture lists single and twin pours.
  ['spirits', 'Singleton of Glen Ord 12 Yrs · Single', 'Singleton of Glen Ord 12 Tahun · Single', 480, 'Whisky', 'Wiski', 'S04'],
  ['spirits', 'Singleton of Glen Ord 12 Yrs · Twin', 'Singleton of Glen Ord 12 Tahun · Twin', 880, 'Whisky', 'Wiski', 'S04'],
  ['spirits', 'Macallan 12 Yrs Double Cask · Single', 'Macallan 12 Tahun Double Cask · Single', 580, 'Whisky', 'Wiski', 'S05'],
  ['spirits', 'Macallan 12 Yrs Double Cask · Twin', 'Macallan 12 Tahun Double Cask · Twin', 990, 'Whisky', 'Wiski', 'S05'],
  ['spirits', 'Hennessy VSOP · Single', 'Hennessy VSOP · Single', 480, 'Brandy', 'Brendi', 'S10'],
  ['spirits', 'Hennessy VSOP · Twin', 'Hennessy VSOP · Twin', 880, 'Brandy', 'Brendi', 'S10'],
  ['spirits', 'Martell VSOP · Single', 'Martell VSOP · Single', 680, 'Brandy', 'Brendi', 'S11'],
  ['spirits', 'Martell VSOP · Twin', 'Martell VSOP · Twin', 1180, 'Brandy', 'Brendi', 'S11'],
  ['spirits', 'Martell Cordon Bleu · Single', 'Martell Cordon Bleu · Single', 1180, 'Brandy', 'Brendi', 'S12'],
  ['spirits', 'Martell Cordon Bleu · Twin', 'Martell Cordon Bleu · Twin', 2280, 'Brandy', 'Brendi', 'S12'],
  ['spirits', 'Roku Suntory Japanese Gin · Single', 'Roku Suntory Gin Jepun · Single', 468, 'Gin', 'Gin', 'S14'],
  ['spirits', 'Roku Suntory Japanese Gin · Twin', 'Roku Suntory Gin Jepun · Twin', 760, 'Gin', 'Gin', 'S14'],
].map(([category, name, bm, price, description = '', descriptionBm = '', tag = '', image = '']) => ({
  id: `menu-${category}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}${category === 'draught' ? `-${tag.toLowerCase()}` : ''}`,
  category, name, bm, price, description, descriptionBm, tag, image: image || beveragePhoto(category, name), available: true,
}))

export const eventFood = [["mains", "Signature Black Pepper Grilled Chicken Chop", 19], ["mains", "Signature Fried Rice with Fried Chicken Chop", 21], ["mains", "Signature Mala Spicy Spaghetti with Chicken Chop", 21], ["mains", "Spaghetti Aglio Olio", 21], ["mains", "Seafood Tomyum Fried Rice", 21], ["bites", "French Fries", 10], ["bites", "Taiwan Sausage", 17], ["bites", "Chicken Popcorn", 17], ["bites", "Chicken Nugget", 17], ["bites", "Chicken Wing", 17], ["bites", "Chicken Skewer (3 pcs)", 16], ["bites", "Luncheon Meat", 17], ["bites", "Edamame", 17]].map(([category, name, price], i) => ({ id: `halloween-${i+1}`, eventId: 'halloween', category, name, bm: name, price, available: true, description: '', descriptionBm: '', tag: '', image: ["/images/event-black-pepper.webp", "/images/food-f02.jpg", "/images/food-f07.jpg", "/images/event-aglio-olio.webp", "/images/food-f04.jpg", "/images/food-s10.jpg", "/images/food-s05.jpg", "/images/food-s09.jpg", "/images/event-chicken-nugget.webp", "/images/event-chicken-wing.webp", "/images/food-s13.jpg", "/images/event-luncheon-meat.webp", "/images/event-edamame.webp"][i] }))
// Refresh bundled photos for existing database catalogs while preserving uploaded/custom URLs.
export function menuPhoto(row) {
  const canonical = row.event_id
    ? eventFood.find(item => item.name === row.name_en && item.category === row.category)?.image
    : row.name_en === 'Signature Black Pepper Chicken Chop' ? '/images/event-black-pepper.webp' : null
  const bundled = !row.image_url || /^\/images\/(?:food-[fs]\d+\.jpg|event-aglio-olio\.png)$/.test(row.image_url)
  return canonical && bundled ? canonical : row.image_url || beveragePhoto(row.category, row.name_en) || ''
}

const defaultEvent = { id: 'halloween', name: 'Special event', enabled: false, starts_at: null, ends_at: null, include_cocktails: false, include_soft: false }
export function eventIsActive(event, now = Date.now()) {
  return Boolean(event?.enabled && (!event.starts_at || now >= Date.parse(event.starts_at)) && (!event.ends_at || now < Date.parse(event.ends_at)))
}
export function eventMenuItems(menu, event, now = Date.now()) {
  const active = eventIsActive(event, now)
  return menu.filter(item => {
    if (item.eventId) return active && item.eventId === event.id
    if (!active) return true
    if (['mains', 'bites'].includes(item.category)) return false
    if (item.category === 'cocktails') return event.include_cocktails
    if (item.category === 'soft') return event.include_soft
    return true
  }).map(item => item.eventId ? { ...item, eventName: event.name } : item)
}
export async function saveMenuEvent(event) {
  if ((event.starts_at && !Number.isFinite(Date.parse(event.starts_at))) || (event.ends_at && !Number.isFinite(Date.parse(event.ends_at)))) throw new Error('Enter valid event dates.')
  if (event.starts_at && event.ends_at && Date.parse(event.ends_at) <= Date.parse(event.starts_at)) throw new Error('End time must be after start time.')
  const name = event.name?.trim() || ''
  if (!name || name.length > 80) throw new Error('Enter an event name between 1 and 80 characters.')
  const patch = { name, enabled: Boolean(event.enabled), starts_at: event.starts_at || null, ends_at: event.ends_at || null, include_cocktails: Boolean(event.include_cocktails), include_soft: Boolean(event.include_soft) }
  if (!isLive) return mutateState(s => { s.menuEvent = { ...s.menuEvent, ...patch } })
  const { data, error } = await supabase.from('menu_events').update(patch).eq('id', 'halloween').select('id').single()
  if (error || !data) throw error || new Error('Event could not be saved.')
}

export const storedDrinkCatalog = [...new Map(menuSeed
  .filter((item) => ['draught', 'bottle', 'spirits'].includes(item.category))
  .map((item) => {
    const type = item.category === 'spirits' ? (item.description === 'Whisky' ? 'whisky' : 'spirit') : item.category
    const name = item.name.replace(/ · (?:1 mug|10 mugs|1 bottle|5 bottles|24 bottles|Single|Twin)$/, '')
    return [`${type}:${name}`, { type, name }]
  })).values()]

function addCalendarMonth(timestamp) { const date = new Date(timestamp); date.setMonth(date.getMonth() + 1); return date.getTime() }

const initialState = {
  songs: [
    { id: 's-1', title: 'Just the Two of Us', artist: 'Bill Withers', table: '08', dedication: 'For my wife ❤️', status: 'pending', createdAt: Date.now() - 240000 },
    { id: 's-2', title: 'Bila Cinta Didusta', artist: 'Screen', table: '05', dedication: '', status: 'pending', createdAt: Date.now() - 190000 },
    { id: 's-3', title: 'Fly Me to the Moon', artist: 'Frank Sinatra', table: '12', dedication: 'Happy birthday, Dad', status: 'approved', createdAt: Date.now() - 120000 },
    { id: 's-4', title: 'Sempurna', artist: 'Andra & The Backbone', table: '03', dedication: '', status: 'singing', createdAt: Date.now() - 90000 },
    { id: 's-5', title: 'Dreams', artist: 'Fleetwood Mac', table: '11', dedication: '', status: 'pending', createdAt: Date.now() - 30000 },
  ],
  orders: [
    { id: 'o-1', table: '08', items: [{ name: 'Nasi Lemak Ayam Berempah', qty: 1, price: 22 }, { name: 'Tiger Pint', qty: 2, price: 10 }], status: 'new', paymentStatus: 'unpaid', createdAt: Date.now() - 360000 },
    { id: 'o-2', table: '05', items: [{ name: 'Fish & Chips', qty: 1, price: 26 }, { name: 'Guinness Stout', qty: 1, price: 20 }], status: 'preparing', paymentStatus: 'unpaid', createdAt: Date.now() - 520000 },
    { id: 'o-3', table: '12', items: [{ name: 'Truffle Fries', qty: 2, price: 16 }], status: 'ready', paymentStatus: 'paid', createdAt: Date.now() - 740000 },
  ],
  services: [
    { id: 'r-1', table: '03', type: 'Request the bill', status: 'open', createdAt: Date.now() - 80000 },
    { id: 'r-2', table: '09', type: 'Call staff', status: 'open', createdAt: Date.now() - 160000 },
  ],
  members: [
    { id: 'm-1', name: 'Amir Lim', phone: '0128881001', points: 320, beer: 5, active: true },
    { id: 'm-2', name: 'Siti Khairah', phone: '0128881002', points: 150, beer: 2, active: true },
    { id: 'm-3', name: 'Tan Choon', phone: '0128881003', points: 410, beer: 8, active: true },
    { id: 'm-4', name: 'Farah Aqilah', phone: '0128881004', points: 275, beer: 3, active: true },
  ],
  storedBatches: [{ id: 'demo-batch-1', memberId: 'm-1', itemType: 'draught', itemName: 'Carlsberg Extra Cold', quantityInitial: 5, quantityRemaining: 5, storedAt: Date.now() - 2 * 86400000, expiresAt: addCalendarMonth(Date.now() - 2 * 86400000) }],
  storedTransactions: [{ id: 'demo-store-in-1', batchId: 'demo-batch-1', memberId: 'm-1', itemType: 'draught', itemName: 'Carlsberg Extra Cold', transactionType: 'in', quantity: 5, reason: 'Demo opening balance', createdAt: Date.now() - 2 * 86400000, expiresAt: addCalendarMonth(Date.now() - 2 * 86400000) }],
  menu: [...menuSeed, ...eventFood],
  menuEvent: defaultEvent,
  tables: ['02', '03', '05', '07', '08', '09', '10', '11', '12'],
    staff: demoStaff.map(({ id, name, role, phone, pin, active }) => ({ id, name, role, phone, pin, active })),
  permissions: structuredClone(defaultPermissions),
  pointLedger: [],
  beerLedger: [],
}

const STORE_KEY = 'malam-demo-v2'
function readState() {
  try {
    const value = JSON.parse(localStorage.getItem(STORE_KEY))
    if (!value) return structuredClone(initialState)
    const menuById = new Map(menuSeed.map(item => [item.id, item]))
    const menu = Array.isArray(value.menu) ? value.menu.map(item => { if (item.eventId) return { ...item, image: eventFood.find(seed => seed.id === item.id)?.image || item.image || '' }; const canonical = menuById.get(item.id) || menuSeed.find(seed => seed.category === item.category && seed.name === item.name && seed.description === item.description); return { ...item, id: canonical?.id || item.id, image: menuPhoto({ category: item.category, name_en: item.name, image_url: item.image || canonical?.image || '' }) } }) : initialState.menu
    const needsDemoStorageMigration = !Array.isArray(value.storedBatches) && (value.members || []).some((member) => member.id === 'm-1')
    const legacyStoredBalances = value.legacyStoredBalances || (!Array.isArray(value.storedBatches) ? Object.fromEntries((value.members || []).filter((member) => member.beer > 0 && !(needsDemoStorageMigration && member.id === 'm-1')).map((member) => [member.id, member.beer])) : {})
    return { ...structuredClone(initialState), ...value, menu: [...menu, ...eventFood.filter(seed => !menu.some(item => item.id === seed.id))], legacyStoredBalances, storedBatches: value.storedBatches || (needsDemoStorageMigration ? structuredClone(initialState.storedBatches) : []), storedTransactions: value.storedTransactions || (needsDemoStorageMigration ? structuredClone(initialState.storedTransactions) : []) }
  } catch { return structuredClone(initialState) }
}
function writeState(state) { localStorage.setItem(STORE_KEY, JSON.stringify(state)) }
function mutateState(fn) { const state = readState(); const value = fn(state); writeState(state); window.dispatchEvent(new Event('malam-data-updated')); return value }
const uid = () => crypto.randomUUID()

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/[^0-9+]/g, '')
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('60')) return `+${digits}`
  if (digits.startsWith('0')) return `+60${digits.slice(1)}`
  return `+60${digits}`
}

export async function login(phone, pin, target = 'any') {
  if (!isLive) {
    const user = readState().staff.find((u) => normalizePhone(u.phone) === normalizePhone(phone) && u.pin === pin && u.active)
    if (user && target === 'member') throw new Error('Use your staff sign-in page for this account.')
    if (user) return { ...user, type: 'staff' }
    if (target === 'staff') throw new Error('Phone number or PIN is incorrect, or this staff account is inactive.')
    const member = readState().members.find((m) => normalizePhone(m.phone) === normalizePhone(phone) && m.active !== false && (m.pin || '246810') === pin)
    if (member) return { ...member, role: 'member', type: 'member' }
    throw new Error('Phone number or PIN is incorrect.')
  }
  if (target === 'member') {
    const response = await fetch('/api/member-auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: normalizePhone(phone), pin }) })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Phone number or PIN is incorrect.')
    const { error: sessionError } = await supabase.auth.setSession(result.session)
    if (sessionError) throw sessionError
    return { ...result.member, role: 'member', type: 'member' }
  }
  const { data, error } = await supabase.auth.signInWithPassword({ phone: normalizePhone(phone), password: pin })
  if (error) throw error
  const userId = data.user.id
  const staffResult = await supabase.from('staff_profiles').select('user_id, display_name, role, active').eq('user_id', userId).maybeSingle()
  if (staffResult.data?.active) return { id: userId, name: staffResult.data.display_name, role: staffResult.data.role, type: 'staff' }
  if (target === 'staff') { await supabase.auth.signOut(); throw new Error('This phone number does not have an active staff account.') }
  const memberResult = await supabase.from('members').select('id, display_name, phone, active').eq('id', userId).maybeSingle()
  if (memberResult.data?.active) return { id: userId, name: memberResult.data.display_name, phone: memberResult.data.phone, role: 'member', type: 'member' }
  await supabase.auth.signOut()
  throw new Error('This account is not active.')
}

export async function logout() { if (isLive) await supabase.auth.signOut() }

export async function getMenu() {
  if (!isLive) { const s = readState(); return eventMenuItems(s.menu, s.menuEvent) }
  const [menuResult, eventResult] = await Promise.all([supabase.rpc('get_guest_menu'), supabase.rpc('get_guest_event_name')])
  if (menuResult.error) throw menuResult.error
  if (eventResult.error) throw eventResult.error
  const data = menuResult.data
  return data.map((x) => ({ id: x.id, eventId: x.event_id, eventName: x.event_id ? eventResult.data : null, category: x.category, name: x.name_en, bm: x.name_bm, description: x.event_id && x.description_en === 'Halloween Night' ? '' : x.description_en, descriptionBm: x.description_bm, price: Number(x.price), available: x.available, image: menuPhoto(x), tag: x.tag || '' }))
}

export async function submitSong(input) {
  if (!isLive) return mutateState((s) => { const song = { ...input, id: uid(), status: 'pending', createdAt: Date.now() }; s.songs.unshift(song); return song })
  const { data, error } = await supabase.rpc('submit_song_request', { p_table_code: input.table, p_title: input.title, p_artist: input.artist?.trim() || null, p_dedication: input.dedication || null })
  if (error) throw error
  return data
}

export async function submitOrder(table, items) {
  if (!isLive) return mutateState((s) => {
    if (items.some(({ item }) => !eventMenuItems(s.menu, s.menuEvent).some(row => row.id === item.id && row.available))) throw new Error('The menu has changed. Refresh and review your basket.')
    const order = { id: uid(), table, status: 'new', paymentStatus: 'unpaid', items: items.map(({ item, qty }) => ({ name: item.name, qty, price: item.price })), createdAt: Date.now() }
    s.orders.unshift(order); return order
  })
  const payload = items.map(({ item, qty }) => ({ menu_item_id: item.id, quantity: qty }))
  const { data, error } = await supabase.rpc('submit_order', { p_table_code: table, p_items: payload })
  if (error) throw error
  return data
}

export async function submitService(table, type) {
  if (!isLive) return mutateState((s) => { const existing = s.services.find(x => x.table === table && x.type === type && x.status === 'open'); if (existing) return existing; const row = { id: uid(), table, type, status: 'open', createdAt: Date.now() }; s.services.unshift(row); return row })
  const { data, error } = await supabase.rpc('submit_service_request', { p_table_code: table, p_request_type: type })
  if (error) throw error
  return data
}

export async function getOperations(role) {
  if (!isLive) {
    const state = readState()
    state.members = state.members.map((member) => ({ ...member, legacyBeer: state.legacyStoredBalances?.[member.id] || 0, beer: state.storedBatches.filter((batch) => batch.memberId === member.id && batch.quantityRemaining > 0 && (!batch.expiresAt || batch.expiresAt > Date.now())).reduce((sum, batch) => sum + batch.quantityRemaining, 0) }))
    return state
  }
  const permissions = await getPermissions(role)
  const result = { songs: [], orders: [], services: [], members: [], storedBatches: [], storedTransactions: [], menu: [], tables: [], staff: [], permissions, permissionRows: [] }
  const requests = []
  if (permissions.includes('menu.view')) requests.push(supabase.from('menu_events').select('*').eq('id', 'halloween').single().then(({ data, error }) => { if (error) throw error; result.menuEvent = data }))
  if (permissions.includes('songs.view')) requests.push(supabase.from('song_requests').select('*').order('created_at', { ascending: false }).limit(100).then(({ data, error }) => { if (error) throw error; result.songs = data.map(songFromDb) }))
  if (permissions.includes('orders.view')) requests.push(supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(100).then(({ data, error }) => { if (error) throw error; result.orders = data.map(orderFromDb) }))
  if (permissions.includes('service.view')) requests.push(supabase.from('service_requests').select('*').order('created_at', { ascending: false }).limit(100).then(({ data, error }) => { if (error) throw error; result.services = data.map(serviceFromDb) }))
  if (permissions.includes('members.lookup')) requests.push(supabase.from('members').select('id, display_name, phone, active').order('created_at', { ascending: false }).limit(100).then(({ data, error }) => { if (error) throw error; result.members = (data || []).map((x) => ({ id: x.id, name: x.display_name, phone: x.phone, active: x.active })) }))
  if (permissions.includes('menu.view')) requests.push(supabase.from('menu_items').select('*').order('sort_order').then(({ data, error }) => { if (error) throw error; result.menu = (data || []).map((x) => ({ id: x.id, eventId: x.event_id, category: x.category, name: x.name_en, bm: x.name_bm, description: x.event_id && x.description_en === 'Halloween Night' ? '' : x.description_en, descriptionBm: x.description_bm, price: Number(x.price), available: x.available, image: menuPhoto(x), tag: x.tag || '' })) }))
  if (permissions.includes('tables.manage')) requests.push(supabase.from('venue_tables').select('*').order('sort_order').then(({ data, error }) => { if (error) throw error; result.tables = data || [] }))
  if (permissions.includes('staff.manage')) requests.push(supabase.from('staff_profiles').select('user_id, display_name, phone, role, active').order('created_at').then(({ data, error }) => { if (error) throw error; result.staff = (data || []).map((x) => ({ id: x.user_id, name: x.display_name, role: x.role, phone: x.phone, active: x.active })) }))
  if (permissions.includes('permissions.manage')) requests.push(supabase.from('role_permissions').select('role, permission_key, enabled').then(({ data, error }) => { if (error) throw error; result.permissionRows = data || [] }))
  await Promise.all(requests)
  if (permissions.includes('members.adjust') && result.members.length) {
    const [summaryResult, batchResult] = await Promise.all([
      supabase.from('member_balance_summary').select('*'),
      supabase.from('member_stored_batches').select('member_id,quantity_remaining,expires_at').gt('quantity_remaining', 0),
    ])
    if (summaryResult.error) throw summaryResult.error
    if (batchResult.error) throw batchResult.error
    result.members = result.members.map((m) => ({ ...m, points: summaryResult.data?.find((x) => x.member_id === m.id)?.points || 0, legacyBeer: summaryResult.data?.find((x) => x.member_id === m.id)?.beer_servings || 0, beer: (batchResult.data || []).filter((x) => x.member_id === m.id && (!x.expires_at || new Date(x.expires_at).getTime() > Date.now())).reduce((sum, x) => sum + x.quantity_remaining, 0) }))
  }
  return result
}

function songFromDb(x) { return { id: x.id, title: x.title, artist: x.artist || '', table: x.table_code, dedication: x.dedication || '', status: x.status, createdAt: new Date(x.created_at).getTime() } }
function orderFromDb(x) { return { id: x.id, table: x.table_code, status: x.status, paymentStatus: x.payment_status, items: x.order_items.map((i) => ({ name: i.item_name, qty: i.quantity, price: Number(i.unit_price) })), createdAt: new Date(x.created_at).getTime() } }
function serviceFromDb(x) { return { id: x.id, table: x.table_code, type: x.request_type, status: x.status, createdAt: new Date(x.created_at).getTime() } }

export async function getPermissions(role) {
  if (!isLive) return readState().permissions?.[role] || []
  if (role === 'owner') return Object.keys(permissionLabels)
  const { data, error } = await supabase.from('role_permissions').select('permission_key').eq('role', role).eq('enabled', true)
  if (error) throw error
  return data.map((x) => x.permission_key)
}

export async function updateSong(id, action) {
  const map = { approve: 'approved', reject: 'rejected', singing: 'singing', sung: 'sung', delete: 'deleted' }
  if (!isLive) return mutateState((s) => {
    if (action === 'delete') { s.songs = s.songs.filter((x) => x.id !== id); return }
    const row = s.songs.find((x) => x.id === id); if (row) row.status = map[action] || action
  })
  if (action === 'delete') { const { error } = await supabase.from('song_requests').delete().eq('id', id); if (error) throw error; return }
  const { error } = await supabase.from('song_requests').update({ status: map[action] || action }).eq('id', id)
  if (error) throw error
}

export async function addSingerSong(input) {
  if (!isLive) return mutateState((s) => { const row = { ...input, id: uid(), table: '—', dedication: 'Added by singer', status: 'approved', createdAt: Date.now() }; s.songs.unshift(row); return row })
  const { data, error } = await supabase.from('song_requests').insert({ table_code: 'HOUSE', title: input.title, artist: input.artist, dedication: 'Added by singer', status: 'approved', source: 'staff' }).select().single()
  if (error) throw error
  return songFromDb(data)
}

export async function updateOrder(id, update) {
  if (!isLive) return mutateState((s) => { const row = s.orders.find((x) => x.id === id); if (row) Object.assign(row, update) })
  const payload = {}
  if (update.status) payload.status = update.status
  if (update.paymentStatus) payload.payment_status = update.paymentStatus
  const { error } = await supabase.from('orders').update(payload).eq('id', id)
  if (error) throw error
}

export async function updateService(id, status) {
  if (!isLive) return mutateState((s) => { const row = s.services.find((x) => x.id === id); if (row) row.status = status })
  const { error } = await supabase.from('service_requests').update({ status }).eq('id', id)
  if (error) throw error
}

export async function getMemberStoredItems(memberId) {
  if (!isLive) {
    const state = readState()
    return {
      batches: state.storedBatches.filter((x) => x.memberId === memberId).sort((a, b) => b.storedAt - a.storedAt),
      transactions: state.storedTransactions.filter((x) => x.memberId === memberId).sort((a, b) => b.createdAt - a.createdAt).slice(0, 50),
      legacyCount: state.legacyStoredBalances?.[memberId] || 0,
    }
  }
  const [batchResult, transactionResult] = await Promise.all([
    supabase.from('member_stored_batches').select('*').eq('member_id', memberId).order('stored_at', { ascending: false }),
    supabase.from('member_stored_transactions').select('*').eq('member_id', memberId).order('created_at', { ascending: false }).limit(50),
  ])
  if (batchResult.error) throw batchResult.error
  if (transactionResult.error) throw transactionResult.error
  return {
    batches: (batchResult.data || []).map((x) => ({ id: x.id, memberId: x.member_id, itemType: x.item_type, itemName: x.item_name, quantityInitial: x.quantity_initial, quantityRemaining: x.quantity_remaining, storedAt: new Date(x.stored_at).getTime(), expiresAt: x.expires_at ? new Date(x.expires_at).getTime() : null })),
    transactions: (transactionResult.data || []).map((x) => ({ id: x.id, batchId: x.batch_id, memberId: x.member_id, itemType: x.item_type, itemName: x.item_name, transactionType: x.transaction_type, quantity: x.quantity, reason: x.reason, createdAt: new Date(x.created_at).getTime(), expiresAt: x.expires_at ? new Date(x.expires_at).getTime() : null })),
  }
}

export async function adjustMember(member, kind, delta, reason, details = {}) {
  if (kind === 'stored') {
    if (!isLive) return mutateState((s) => {
      const amount = Math.abs(Number(delta)); const direction = Number(delta) > 0 ? 'in' : 'out'; const now = Date.now()
      if (direction === 'in') {
        const expiry = details.itemType === 'draught' ? addCalendarMonth(now) : null
        const batch = { id: uid(), memberId: member.id, itemType: details.itemType, itemName: details.itemName.trim(), quantityInitial: amount, quantityRemaining: amount, storedAt: now, expiresAt: expiry }
        s.storedBatches.unshift(batch)
        s.storedTransactions.unshift({ id: uid(), batchId: batch.id, memberId: member.id, itemType: batch.itemType, itemName: batch.itemName, transactionType: 'in', quantity: amount, reason, createdAt: now, expiresAt: expiry })
      } else {
        const batches = s.storedBatches.filter((x) => x.memberId === member.id && x.itemType === details.itemType && x.itemName.toLowerCase() === details.itemName.trim().toLowerCase() && x.quantityRemaining > 0 && (!x.expiresAt || x.expiresAt > now)).sort((a, b) => a.storedAt - b.storedAt)
        const available = batches.reduce((sum, x) => sum + x.quantityRemaining, 0)
        if (available < amount) throw new Error(`Only ${available} available for ${details.itemName}.`)
        let remaining = amount
        for (const batch of batches) {
          const used = Math.min(remaining, batch.quantityRemaining); batch.quantityRemaining -= used; remaining -= used
          s.storedTransactions.unshift({ id: uid(), batchId: batch.id, memberId: member.id, itemType: batch.itemType, itemName: batch.itemName, transactionType: 'out', quantity: used, reason, createdAt: now, expiresAt: batch.expiresAt })
          if (!remaining) break
        }
      }
    })
    const { error } = await supabase.rpc('adjust_member_stored_item', { p_member_id: member.id, p_item_type: details.itemType, p_item_name: details.itemName.trim(), p_quantity: Math.abs(Number(delta)), p_direction: Number(delta) > 0 ? 'in' : 'out', p_reason: reason })
    if (error) throw error
    return
  }
  if (!isLive) return mutateState((s) => {
    const row = s.members.find((x) => x.id === member.id); if (!row) return
    if (!Number.isInteger(Number(delta)) || !Number(delta) || !reason?.trim()) throw new Error('Enter a whole amount and a reason.')
    if ((row[kind] || 0) + Number(delta) < 0) throw new Error('The balance cannot be negative.')
    row[kind] = (row[kind] || 0) + Number(delta)
    const ledger = { id: uid(), memberId: row.id, name: row.name, kind, delta: Number(delta), reason, createdAt: Date.now() }
    ;(kind === 'points' ? s.pointLedger : s.beerLedger).unshift(ledger)
  })
  const { error } = await supabase.rpc('adjust_member_balance', { p_member_id: member.id, p_kind: kind, p_delta: Number(delta), p_reason: reason })
  if (error) throw error
}

export async function saveMenuAvailability(id, available) {
  if (!isLive) return mutateState((s) => { const row = s.menu.find((x) => x.id === id); if (row) row.available = available })
  const { error } = await supabase.from('menu_items').update({ available }).eq('id', id)
  if (error) throw error
}

export async function savePermission(role, permissionKey, enabled) {
  if (!isLive) return mutateState((s) => {
    const set = new Set(s.permissions[role] || [])
    enabled ? set.add(permissionKey) : set.delete(permissionKey)
    s.permissions[role] = [...set]
  })
  const { error } = await supabase.from('role_permissions').upsert({ role, permission_key: permissionKey, enabled }, { onConflict: 'role,permission_key' })
  if (error) throw error
}

export async function adminAction(action, body) {
  if (!isLive) return mutateState((s) => {
    if (action === 'enroll-member') {
      if (s.members.some((x) => normalizePhone(x.phone) === normalizePhone(body.phone))) throw new Error('That phone number is already enrolled.')
      const member = { id: uid(), name: body.name, phone: body.phone, points: 0, beer: 0, active: true, pin: body.pin }
      s.members.unshift(member); return member
    }
    if (action === 'reset-member-pin') { const row = s.members.find((x) => x.id === body.id); if (!row) throw new Error('Member not found.'); row.pin = body.pin; return }
    if (action === 'add-staff') {
      if (s.staff.some((x) => normalizePhone(x.phone) === normalizePhone(body.phone))) throw new Error('That staff phone number already exists.')
      s.staff.push({ id: uid(), name: body.name, phone: body.phone, role: body.role || 'staff', active: true, pin: body.pin }); return
    }
    if (action === 'toggle-staff') { const row = s.staff.find((x) => x.id === body.id); if (row) row.active = body.active; return }
    if (action === 'set-staff-role') { const row = s.staff.find((x) => x.id === body.id); if (row) row.role = body.role; return }
  })
  const { data: { session } } = await supabase.auth.getSession()
  const response = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` }, body: JSON.stringify({ action, ...body }) })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Could not complete this action.')
  return data
}

export function listenForDemoChanges(callback) {
  const fn = () => callback()
  const onStorage = (event) => { if (event.key === STORE_KEY) callback() }
  window.addEventListener('malam-data-updated', fn)
  window.addEventListener('storage', onStorage)
  return () => { window.removeEventListener('malam-data-updated', fn); window.removeEventListener('storage', onStorage) }
}

export function formatMoney(value) { return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) }
export function timeAgo(timestamp) {
  const mins = Math.max(0, Math.floor((Date.now() - timestamp) / 60000))
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  return `${hours} hr${hours > 1 ? 's' : ''} ago`
}
