import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Activity, ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Beer, Bell, Check,
  CheckCircle2, ChevronDown, ChevronRight, CircleHelp, ClipboardList, Clock3, Coffee, Crown,
  Disc3, GlassWater, Guitar, Heart, Languages, LayoutDashboard, LogOut, Menu as MenuIcon,
  Minus, Music2, Plus, QrCode, Search, Send, Settings2, Shield, ShoppingBag, ShoppingCart, SlidersHorizontal,
  Sparkles, Ticket, UserRound, Users, Utensils, Wallet, X, Zap,
} from 'lucide-react'
import {
  adminAction, adjustMember, demoPermissionMap, formatMoney, getMemberStoredItems, getMenu, getOperations, getPermissions,
  isLive, listenForDemoChanges, login, logout, permissionLabels, roles, roleLabels, saveMenuAvailability,
  savePermission, storedDrinkCatalog, submitOrder, submitService, submitSong, supabase, timeAgo, updateOrder, updateService,
  updateSong, addSingerSong, saveMenuEvent, eventIsActive,
} from './data.js'

const copy = {
  en: {
    menu: 'Menu', songs: 'Songs', member: 'Member', liveMusic: 'Live music every night',
    guestTitle: 'Order from your table', guestCopy: 'Browse the menu, request a song, or call our team.',
    table: 'TABLE', menuTitle: 'Browse the menu', menuCopy: 'Food and drinks, ordered from your table.',
    foodGroup: 'Food', beverageGroup: 'Beverages', food: 'Mains', bites: 'Side food', draught: 'Draught beer', bottle: 'Bottle beer', cocktails: 'Cocktails', mocktails: 'Mocktails', soft: 'Non-alcoholic', spirits: 'Whisky, brandy & gin', add: 'Add', cart: 'Your order', emptyCart: 'Add food or drinks to start your order.',
    payCounter: 'Send order', subtotal: 'Subtotal', noCharge: 'No payment is collected online.',
    requestSent: 'Order sent to the team', requestSong: 'Request a song', songCopy: 'Tell us what you would love to hear tonight.',
    songTitle: 'Song title', artist: 'Artist', dedication: 'Dedication (optional)', submitRequest: 'Send song request',
    requestNote: 'Every request is reviewed by the singer.', requestSuccess: 'Your request is with the singer.',
    callStaff: 'Call staff', water: 'Request water', bill: 'Ask for the bill', help: 'Need something?',
    memberTitle: 'Member sign in', memberCopy: 'Use the phone number and 6-digit PIN registered with our team.',
    phone: 'Phone number', pin: '6-digit PIN', signIn: 'Sign in', memberWelcome: 'Good to see you.', points: 'Points', beerBalance: 'Stored beer', servings: 'servings',
    availablePoints: 'Available points', storedDrinks: 'Stored drinks', storedDrinksCopy: 'Beer and liquor held by the venue', storageUnavailable: 'Storage details are temporarily unavailable. Please ask our team.', noStoredItems: 'No drinks are currently stored for your account.', transactionHistory: 'Transaction history', transactionHistoryCopy: 'Latest stored and collected items', noTransactions: 'No storage transactions yet.', storedOn: 'Stored', expiresOn: 'Expires', expired: 'Expired', storedIn: 'Stored in', takenOut: 'Taken out', typeDraught: 'Draught beer', typeBottle: 'Bottled beer', typeWhisky: 'Whisky', typeSpirit: 'Other liquor / spirits', typeOther: 'Other stored item', unitServings: 'mugs', unitItems: 'bottles', legacyStorage: 'Older stored beer balance: {count} mugs. Its type is not recorded yet; please ask our team to identify it.',
    noAccount: 'Membership is set up by our team in person. Ask a staff member to join.', memberOnly: 'Members can view their balances after signing in.',
    staff: 'Staff', staffAccess: 'STAFF LOGIN', staffLogin: 'Sign in to the staff dashboard', staffUserId: 'User ID', staffPasscode: 'Passcode', staffIntro: 'Use your assigned user ID and passcode.',
    enter: 'Continue', backGuest: 'Back to guest page', demo: 'QUICK SIGN IN', sampleLogins: 'Choose a role', liveMode: 'Connected', demoMode: 'Preview data',
    hello: 'Good evening', operations: 'Staff dashboard', signedInAs: 'SIGNED IN AS', signOut: 'Sign out',
    overview: 'Overview', liveQueue: 'Song queue', orders: 'Orders', serviceRequests: 'Service', members: 'Members',
    menuAdmin: 'Menu', team: 'Staff accounts', tableQr: 'Tables & QR', permissions: 'Role permissions',
    tonightQueue: 'Tonight’s live queue', queueSub: 'Guest song requests. Update each request as it reaches the stage.', incoming: 'INCOMING', nowPlaying: 'NOW PLAYING',
    pending: 'Pending', approved: 'Approved', singing: 'Singing', sung: 'Sung', rejected: 'Rejected',
    choose: 'Choose', approve: 'Approve', reject: 'Reject', markSung: 'Mark sung', startSong: 'Start song', delete: 'Delete', addSong: 'Add a song',
    title: 'Title', tableCol: 'Table', dedicationCol: 'Dedication', status: 'Status', action: 'Action',
    freshOrders: 'Orders', ordersSub: 'Enter each order into your POS, then mark it completed.', orderNew: 'New', orderCompleted: 'Completed', orderCancelled: 'Cancelled', markCompleted: 'Mark as completed', posOrderHelp: 'Mark completed after entering the order into your POS.', activeOrders: 'active orders', completedBy: 'Completed by', staffMember: 'Staff', new: 'New', preparing: 'Preparing', ready: 'Ready', served: 'Served', paid: 'Paid', unpaid: 'Awaiting payment', markPreparing: 'Start preparing', markReady: 'Mark ready', markServed: 'Mark served', markPaid: 'Mark paid',
    serviceTitle: 'Table requests', serviceSub: 'Requests from tables.', closeRequest: 'Mark done',
    memberDirectory: 'Member directory', memberSub: 'Look up guests and keep their benefits up to date.', searchMember: 'Search name or phone', enrollMember: 'Enroll member', adjustPoints: 'Points adjustment', adjustBeer: 'Beer servings', reason: 'Reason for adjustment', saveAdjustment: 'Save adjustment', addMember: 'Create member',
    fullName: 'Full name', newPin: 'Initial PIN', pointBalance: 'POINTS', beerCount: 'BEER', lookupOnly: 'Member details are view-only for this role.',
    menuControl: 'Menu availability', menuSub: 'Pause an item when the kitchen or bar runs out.', available: 'Available', soldOut: 'Sold out',
    teamTitle: 'Staff accounts', teamSub: 'Create accounts and keep access tidy.', addStaff: 'Add staff member', role: 'Role', active: 'Active', inactive: 'Inactive', deactivate: 'Deactivate', activate: 'Activate',
    permissionsTitle: 'Set access by role', permissionsSub: 'Owners control what each role can view and change.', viewOnly: 'view',
    tablesTitle: 'Table QR codes', tablesSub: 'Print a QR and place it on each table.', openQr: 'Open guest page',
    en: 'EN', bm: 'BM', house: 'MENU', unavailable: 'Currently unavailable',
    cancel: 'Cancel', save: 'Save', close: 'Close', loading: 'Loading…', noSongs: 'No requests here yet.', noOrders: 'All clear for now.', noService: 'No open requests.', noMembers: 'No members match that search.',
    orderReceived: 'Order sent. Our team has been notified.', serviceReceived: 'The team has been notified.', singerAdded: 'Added to the queue.', demoReset: 'Demo data is saved in this browser.',
  },
  bm: {
    menu: 'Menu', songs: 'Lagu', member: 'Ahli', liveMusic: 'Muzik langsung setiap malam',
    guestTitle: 'Pesan terus dari meja anda', guestCopy: 'Lihat menu, minta lagu atau panggil staf.',
    table: 'MEJA', menuTitle: 'Lihat menu', menuCopy: 'Pilih makanan dan minuman dari meja anda.',
    foodGroup: 'Makanan', beverageGroup: 'Minuman', food: 'Hidangan utama', bites: 'Makanan sampingan', draught: 'Bir draf', bottle: 'Bir botol', cocktails: 'Koktel', mocktails: 'Mocktail', soft: 'Tanpa alkohol', spirits: 'Wiski, brendi & gin', add: 'Tambah', cart: 'Pesanan anda', emptyCart: 'Bakul anda masih kosong.',
    payCounter: 'Hantar pesanan', subtotal: 'Jumlah kecil', noCharge: 'Bayaran tidak dikutip dalam talian.',
    requestSent: 'Pesanan dihantar kepada pasukan', requestSong: 'Minta lagu', songCopy: 'Beritahu lagu yang anda ingin dengar malam ini.',
    songTitle: 'Tajuk lagu', artist: 'Artis', dedication: 'Dedikasi (pilihan)', submitRequest: 'Hantar permintaan lagu',
    requestNote: 'Setiap permintaan akan disemak oleh penyanyi.', requestSuccess: 'Permintaan anda telah dihantar kepada penyanyi.',
    callStaff: 'Panggil staf', water: 'Minta air', bill: 'Minta bil', help: 'Perlukan bantuan?',
    memberTitle: 'Log masuk ahli', memberCopy: 'Gunakan nombor telefon dan PIN 6 digit yang didaftarkan dengan pasukan kami.',
    phone: 'Nombor telefon', pin: 'PIN 6 digit', signIn: 'Log masuk', memberWelcome: 'Gembira melihat anda.', points: 'Mata', beerBalance: 'Bir simpanan', servings: 'hidangan',
    availablePoints: 'Mata tersedia', storedDrinks: 'Minuman disimpan', storedDrinksCopy: 'Bir dan minuman keras yang disimpan di premis', storageUnavailable: 'Maklumat simpanan tidak tersedia buat sementara. Sila tanya staf.', noStoredItems: 'Tiada minuman disimpan untuk akaun anda.', transactionHistory: 'Sejarah transaksi', transactionHistoryCopy: 'Item yang disimpan dan diambil baru-baru ini', noTransactions: 'Belum ada transaksi simpanan.', storedOn: 'Disimpan', expiresOn: 'Luput', expired: 'Telah luput', storedIn: 'Disimpan masuk', takenOut: 'Diambil keluar', typeDraught: 'Bir draf', typeBottle: 'Bir botol', typeWhisky: 'Wiski', typeSpirit: 'Minuman keras lain', typeOther: 'Item simpanan lain', unitServings: 'mug', unitItems: 'botol', legacyStorage: 'Baki bir lama: {count} mug. Jenisnya belum direkodkan; sila minta staf mengenal pastinya.',
    noAccount: 'Keahlian didaftarkan oleh staf di premis. Minta bantuan staf untuk mendaftar.', memberOnly: 'Ahli boleh melihat baki selepas log masuk.',
    staff: 'Staf', staffAccess: 'LOG MASUK STAF', staffLogin: 'Log masuk papan pemuka staf', staffUserId: 'ID pengguna', staffPasscode: 'Kod akses', staffIntro: 'Gunakan ID pengguna dan kod akses anda.',
    enter: 'Teruskan', backGuest: 'Kembali ke halaman tetamu', demo: 'LOG MASUK PANTAS', sampleLogins: 'Pilih peranan', liveMode: 'Disambungkan', demoMode: 'Data pratonton',
    hello: 'Selamat malam', operations: 'Papan pemuka staf', signedInAs: 'LOG MASUK SEBAGAI', signOut: 'Log keluar',
    overview: 'Ringkasan', liveQueue: 'Senarai lagu', orders: 'Pesanan', serviceRequests: 'Servis', members: 'Ahli',
    menuAdmin: 'Menu', team: 'Akaun staf', tableQr: 'Meja & QR', permissions: 'Kebenaran peranan',
    tonightQueue: 'Senarai lagu malam ini', queueSub: 'Permintaan lagu tetamu. Kemas kini status apabila lagu dimainkan.', incoming: 'MENUNGGU', nowPlaying: 'SEDANG DIMAINKAN',
    pending: 'Menunggu', approved: 'Diluluskan', singing: 'Sedang dimainkan', sung: 'Selesai', rejected: 'Ditolak',
    choose: 'Pilih', approve: 'Luluskan', reject: 'Tolak', markSung: 'Tandakan selesai', startSong: 'Mulakan lagu', delete: 'Padam', addSong: 'Tambah lagu',
    title: 'Tajuk', tableCol: 'Meja', dedicationCol: 'Dedikasi', status: 'Status', action: 'Tindakan',
    freshOrders: 'Pesanan dari tetamu', ordersSub: 'Masukkan pesanan ke dalam POS, kemudian tandakan selesai.', orderNew: 'Baharu', orderCompleted: 'Selesai', orderCancelled: 'Dibatalkan', markCompleted: 'Tandakan selesai', posOrderHelp: 'Tandakan selesai selepas memasukkan pesanan ke dalam POS.', activeOrders: 'pesanan aktif', completedBy: 'Diselesaikan oleh', staffMember: 'Staf', new: 'Baharu', preparing: 'Disediakan', ready: 'Sedia', served: 'Dihidangkan', paid: 'Dibayar', unpaid: 'Menunggu bayaran', markPreparing: 'Mula sediakan', markReady: 'Tandakan sedia', markServed: 'Tandakan dihidang', markPaid: 'Tandakan dibayar',
    serviceTitle: 'Permintaan tetamu', serviceSub: 'Permintaan daripada meja.', closeRequest: 'Tandakan selesai',
    memberDirectory: 'Senarai ahli', memberSub: 'Cari ahli dan kemas kini manfaat mereka.', searchMember: 'Cari nama atau telefon', enrollMember: 'Daftar ahli', adjustPoints: 'Pelarasan mata', adjustBeer: 'Hidangan bir', reason: 'Sebab pelarasan', saveAdjustment: 'Simpan pelarasan', addMember: 'Cipta ahli',
    fullName: 'Nama penuh', newPin: 'PIN awal', pointBalance: 'MATA', beerCount: 'BIR', lookupOnly: 'Maklumat ahli hanya boleh dilihat untuk peranan ini.',
    menuControl: 'Ketersediaan menu', menuSub: 'Hentikan item apabila stok dapur atau bar habis.', available: 'Ada', soldOut: 'Habis',
    teamTitle: 'Pasukan malam ini.', teamSub: 'Cipta akaun dan urus akses.', addStaff: 'Tambah staf', role: 'Peranan', active: 'Aktif', inactive: 'Tidak aktif', deactivate: 'Nyahaktif', activate: 'Aktifkan',
    permissionsTitle: 'Tetapkan akses mengikut peranan', permissionsSub: 'Pemilik mengawal perkara yang boleh dilihat dan diubah.', viewOnly: 'lihat',
    tablesTitle: 'Satu kod untuk setiap meja.', tablesSub: 'Cetak kod QR dan letakkan di setiap meja.', openQr: 'Buka halaman tetamu',
    en: 'EN', bm: 'BM', house: 'KEGEMARAN RUMAH', unavailable: 'Tidak tersedia buat masa ini',
    cancel: 'Batal', save: 'Simpan', close: 'Tutup', loading: 'Memuatkan…', noSongs: 'Belum ada permintaan.', noOrders: 'Tiada pesanan baharu.', noService: 'Tiada permintaan terbuka.', noMembers: 'Tiada ahli ditemui.',
    orderReceived: 'Pesanan dihantar. Pasukan kami telah dimaklumkan.', serviceReceived: 'Pasukan kami telah dimaklumkan.', singerAdded: 'Ditambah ke dalam senarai.', demoReset: 'Data demo disimpan dalam pelayar ini.',
  },
}

const zhCopy = {
  ordersSub: '将订单输入 POS 后标记完成。', orderNew: '新订单', orderCompleted: '已完成', orderCancelled: '已取消', markCompleted: '标记完成', posOrderHelp: '将订单输入 POS 后，请标记完成。', activeOrders: '笔待处理订单', completedBy: '完成人', staffMember: '店员',
  menu: '菜单', songs: '点歌', member: '会员', liveMusic: '每晚都有现场音乐',
  guestTitle: '在餐桌直接点餐', guestCopy: '浏览菜单、点歌，或联系店员。',
  table: '桌号', menuTitle: '浏览菜单', menuCopy: '在餐桌选择食物和饮料。',
  foodGroup: '食物', beverageGroup: '饮料', food: '主食', bites: '小食', draught: '生啤', bottle: '瓶装啤酒', cocktails: '鸡尾酒', mocktails: '无酒精鸡尾酒', soft: '无酒精饮料', spirits: '威士忌、白兰地与金酒',
  add: '加入', cart: '您的订单', emptyCart: '购物车还是空的。', payCounter: '提交订单', subtotal: '小计', noCharge: '无需在线付款。',
  requestSent: '订单已发送给店员', requestSong: '点一首歌', songCopy: '告诉我们今晚您想听哪首歌。', songTitle: '歌曲名称', artist: '歌手', dedication: '祝福留言（选填）', submitRequest: '提交点歌',
  requestNote: '所有点歌会由驻唱歌手确认。', requestSuccess: '您的点歌已提交给歌手。', callStaff: '呼叫店员', water: '请送饮用水', bill: '买单', help: '需要帮忙吗？',
  memberTitle: '会员登录', memberCopy: '请输入已登记的手机号码和 6 位 PIN。', phone: '手机号码', pin: '6位数 PIN', signIn: '登录', memberWelcome: '欢迎回来。', points: '积分', beerBalance: '预存啤酒', servings: '份',
  availablePoints: '可用积分', storedDrinks: '寄存酒类', storedDrinksCopy: '查看寄存在店内的啤酒与酒类', storageUnavailable: '暂时无法读取寄存记录，请向店员查询。', noStoredItems: '目前没有寄存在您账户下的酒类。', transactionHistory: '寄存记录', transactionHistoryCopy: '最近存入与取出的酒类', noTransactions: '暂无寄存交易记录。', storedOn: '存入日期', expiresOn: '到期日期', expired: '已过期', storedIn: '存入', takenOut: '取出', typeDraught: '生啤', typeBottle: '瓶装啤酒', typeWhisky: '威士忌', typeSpirit: '其他烈酒', typeOther: '其他寄存物品', unitServings: '杯', unitItems: '瓶', legacyStorage: '旧系统还记录有 {count} 杯啤酒寄存，但未注明啤酒类型。请向店员确认。',
  noAccount: '会员由店员现场协助登记。请向店员咨询。', memberOnly: '登录后可查看会员余额。', staff: '员工', house: '店家推荐', unavailable: '暂时售罄',
  stageTime: '每晚现场驻唱', stageCaption: '每晚现场驻唱', yourTable: '您的桌号', browseMenu: '浏览菜单',
  earnAndKeep: '累积并保留', pointsAndBeer: '积分与预存啤酒', madeForRegulars: '为常客准备', benefitsAtTable: '在餐桌轻松查看会员礼遇',
  backGuest: '返回菜单', memberBadge: 'DYRB 会员', pointsAvailable: '可用积分', prepaidNextTime: '留待下次享用', accountLinked: '会员账户绑定手机：', pinHelp: '如需重设 PIN 或更改账户，请向店员咨询。', liveMode: '已连接', demoMode: '预览数据', demo: '快速登录', sampleLogins: '选择角色', staffAccess: '员工登录', staffLogin: '员工工作台登录', staffUserId: '员工账号', staffPasscode: '登录密码', staffIntro: '使用分配给您的员工账号和登录密码。', operations: '员工工作台', tonightQueue: '今晚点歌', queueSub: '查看顾客点歌，并更新演唱状态。',
  songAsideKicker: 'DYRB 现场音乐', songAsideTitle: '点一首今晚难忘的歌。', songAsideCopy: '选一首大家都能一起唱的歌。驻唱歌手确认后，歌曲才会加入演出队列。', freeRequests: '免费点歌',
  serviceKicker: '为您服务', footerPromise: '您的餐桌 · 您的夜晚',
  cancel: '取消', save: '保存', close: '关闭', loading: '加载中…', en: 'EN', bm: 'BM', zh: '中文',
  orderReceived: '订单已发送，店员已收到通知。', serviceReceived: '店员已收到通知。', singerAdded: '已加入点歌队列。', demoReset: '演示数据保存在此浏览器中。',
}

function getCopy(language) {
  return language === 'zh' ? { ...copy.en, ...zhCopy } : copy[language]
}

const zhMenuNames = {
  'Signature Fried Rice with Grilled Chicken Chop': '招牌炒饭配烤鸡扒',
  'Signature Fried Rice with Fried Chicken Chop': '招牌炒饭配炸鸡扒',
  'Teriyaki Grilled Chicken Chop with Fried Rice': '日式照烧鸡扒配炒饭',
  'Tomyam Fried Rice': '东炎炒饭',
  'Signature Black Pepper Chicken Chop': '招牌黑胡椒鸡扒',
  'Salted Egg Chicken Fried Rice': '咸蛋鸡肉炒饭',
  'Signature Mala Spicy Spaghetti with Chicken Chop': '招牌麻辣鸡扒意大利面',
  'Signature Fried Rice with Fried Egg': '招牌炒饭配煎蛋',
  'Enoki Mushroom': '金针菇', 'Oyster Mushroom': '鲍鱼菇', 'Broccoli': '西兰花', 'Lotus Root': '莲藕',
  'Taiwan Sausage (8 pcs)': '台湾香肠（8块）', 'Luncheon Meat': '午餐肉', 'Sausage': '香肠', 'Crispy Fucuk': '脆腐竹',
  'Chicken Popcorn': '鸡米花', 'Shoestring Potato Fries': '细薯条', 'Crispy Mixed Seafood Ball (8 pcs)': '香炸海鲜丸（8粒）',
  'Smoked Duck Skewer (3 pcs)': '烟熏鸭肉串（3串）', 'Chicken Skewer (3 pcs)': '鸡肉串（3串）', 'Pork Skewer (3 pcs)': '猪肉串（3串）',
  'DYRB Special (Haaland)': 'DYRB 特调（Haaland）', 'Blue Lagoon': '蓝色珊瑚礁', 'Daiquiri': '代基里', 'Dry Martini': '干马天尼',
  'Long Island Ice Tea': '长岛冰茶', 'Margarita': '玛格丽特', 'Negroni': '内格罗尼', 'Screwdriver': '螺丝起子', 'Shandy': '香迪啤酒',
  'Tequila Sunrise': '龙舌兰日出', 'See You Tomorrow': '明天见', 'Grave Yard': '坟场特调',
  'DYRB Special Virgin Haaland': 'DYRB 特调无酒精版（Haaland）', 'Virgin Blue Lagoon': '无酒精蓝色珊瑚礁', 'Virgin Sunrise': '无酒精日出',
  'Orange Juice': '橙汁', 'Mango Juice': '芒果汁', 'Lemonade': '柠檬水', 'Fresh Lemon Juice': '鲜榨柠檬汁', 'Fresh Lime Juice': '鲜榨青柠汁',
  'Fresh Lemon Tea': '鲜柠檬茶', 'Fresh Honey Lemon': '鲜蜂蜜柠檬', 'Cranberry Juice': '蔓越莓汁', 'Ayataka Green Tea': '绫鹰绿茶',
  'Coke': '可乐', 'Sprite': '雪碧', 'Ginger Ale': '姜汁汽水', 'Soda Water': '苏打水', 'Tonic Water': '汤力水', 'Mineral Water · 500ml': '矿泉水 · 500毫升',
}

function localizedMenuName(item, language) {
  const cleanPeriod = (name = '') => name
    .replace(/\s*·\s*(?:Happy Hour|After 8pm|Waktu Gembira|Selepas 8 malam|欢乐时光|晚上8点后)\s*·\s*/gi, ' · ')
    .replace(/\s*·\s*(?:Happy Hour|After 8pm|Waktu Gembira|Selepas 8 malam|欢乐时光|晚上8点后)\s*$/gi, '')
  const cleanServing = (name = '') => {
    if (item.category === 'draught') return name.replace(/\s*·\s*\d+\s*(?:mugs?|cawan|杯)\s*$/i, '')
    if (item.category === 'bottle') return name.replace(/\s*·\s*\d+\s*(?:bottles?|botol|瓶)\s*$/i, '')
    if (item.category === 'spirits') return name.replace(/\s*·\s*(?:single|twin|单份|双份)\s*$/i, '')
    return name
  }
  if (language === 'bm') return cleanServing(cleanPeriod(item.bm || item.name))
  if (language !== 'zh') return cleanServing(cleanPeriod(item.name))
  const cleanName = cleanServing(cleanPeriod(item.name))
  if (zhMenuNames[cleanName]) return zhMenuNames[cleanName]
  const replacements = [
    ['Carlsberg Extra Cold', '嘉士伯超冰啤酒'], ['Carlsberg Smooth', '嘉士伯顺滑啤酒'], ["Connor’s", '康纳啤酒'],
    ['Sapporo Premium Beer', '札幌高级啤酒'], ['Happy Hour', '欢乐时光'], ['After 8pm', '晚上8点后'],
    ['Before 8pm', '晚上8点前'], ['1 mug', '1杯'], ['10 mugs', '10杯'], ['1 bottle', '1瓶'], ['5 bottles', '5瓶'], ['24 bottles', '24瓶'],
    ['Singleton of Glen Ord 12 Yrs', '格兰欧德 12年'], ['Macallan 12 Yrs Double Cask', '麦卡伦 12年双桶'],
    ['Hennessy VSOP', '轩尼诗 VSOP'], ['Martell VSOP', '马爹利 VSOP'], ['Martell Cordon Bleu', '马爹利蓝带'],
    ['Roku Suntory Japanese Gin', '六金酒（日式）'], [' · Single', ' · 单份'], [' · Twin', ' · 双份'],
  ]
  return cleanPeriod(replacements.reduce((name, [from, to]) => name.replaceAll(from, to), cleanName))
}

function localizedMenuServing(item, language) {
  if (!['draught', 'bottle', 'spirits'].includes(item.category)) return ''
  const source = `${item.name || ''} ${item.bm || ''}`
  if (item.category === 'spirits') {
    const pour = source.match(/\b(single|twin)\b|单份|双份/i)?.[0]?.toLowerCase()
    if (!pour) return ''
    const isSingle = pour === 'single' || pour === '单份'
    return language === 'zh' ? (isSingle ? '单份' : '双份') : (isSingle ? 'Single' : 'Twin')
  }
  const match = source.match(/(?:·\s*)?(\d+)\s*(mugs?|cawan|杯|bottles?|botol|瓶)/i)
  if (!match) return ''
  const count = Number(match[1])
  if (language === 'zh') return `${match[1]}${item.category === 'bottle' ? '瓶' : '杯'}`
  if (item.category === 'bottle') return `${match[1]} ${count === 1 ? 'bottle' : 'bottles'}`
  return `${match[1]} ${count === 1 ? 'mug' : 'mugs'}`
}

function draughtPeriod(item) {
  if (item.category !== 'draught') return ''
  const period = `${item.description || ''} ${item.descriptionBm || ''} ${item.name || ''} ${item.bm || ''}`.toLowerCase()
  if (/before 8|sebelum 8|happy hour|waktu gembira|欢乐时光/.test(period)) return 'happy-hour'
  if (/after 8|selepas 8|晚上8点后/.test(period)) return 'after-eight'
  return ''
}

function isBeforeEightInMalaysia() {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', hourCycle: 'h23' }).format(new Date()))
  return hour < 20
}

function cartAtCurrentDraughtPrice(cart, menu, beforeEight) {
  const targetPeriod = beforeEight ? 'happy-hour' : 'after-eight'
  return cart.map((entry) => {
    if (entry.item.category !== 'draught' || !draughtPeriod(entry.item)) return entry
    const name = localizedMenuName(entry.item, 'en').toLowerCase()
    const serving = localizedMenuServing(entry.item, 'en')
    const counterpart = menu.find((candidate) => candidate.category === 'draught'
      && draughtPeriod(candidate) === targetPeriod
      && localizedMenuName(candidate, 'en').toLowerCase() === name
      && localizedMenuServing(candidate, 'en') === serving)
    return counterpart ? { ...entry, item: counterpart } : entry
  })
}

function localizedMenuDescription(item, language) {
  if (language === 'bm') return item.descriptionBm
  if (language !== 'zh') return item.description
  return (item.description || '')
    .replaceAll('Before 8pm', '晚上8点前')
    .replaceAll('After 8pm', '晚上8点后')
    .replaceAll('Whisky', '威士忌')
    .replaceAll('Brandy', '白兰地')
    .replaceAll('Gin', '金酒')
}

function localizedMenuPeriod(item, language) {
  const period = draughtPeriod(item)
  const beforeEight = period === 'happy-hour'
  const afterEight = period === 'after-eight'
  if (language === 'zh') return beforeEight ? '优惠时段 · 晚上8点前' : afterEight ? '晚上8点后' : ''
  if (language === 'bm') return beforeEight ? 'Waktu gembira · sebelum 8 malam' : afterEight ? 'Selepas 8 malam' : ''
  return beforeEight ? 'Happy hour · Before 8pm' : afterEight ? 'After 8pm' : ''
}

const navMeta = {
  overview: { icon: LayoutDashboard, permission: null }, songs: { icon: Music2, permission: 'songs.view' },
  orders: { icon: ClipboardList, permission: 'orders.view' }, service: { icon: Bell, permission: 'service.view' },
  members: { icon: Users, permission: 'members.lookup' }, menu: { icon: Utensils, permission: 'menu.view' },
  staff: { icon: UserRound, permission: 'staff.manage' }, tables: { icon: QrCode, permission: 'tables.manage' },
  permissions: { icon: Shield, permission: 'permissions.manage' },
}

const beveragePhotoClasses = {
  draught: 'beverage-photo-draught', bottle: 'beverage-photo-bottle', cocktails: 'beverage-photo-cocktails',
  mocktails: 'beverage-photo-mocktails', soft: 'beverage-photo-soft', spirits: 'beverage-photo-spirits',
}

const staffSections = new Set(['overview', 'songs', 'orders', 'service', 'members', 'menu', 'staff', 'tables', 'permissions'])

function routeState(pathname = window.location.pathname, search = window.location.search) {
  const path = pathname.replace(/\/+$/, '') || '/'
  const params = new URLSearchParams(search)
  if (path === '/staff' || (path === '/' && params.get('staff') === '1')) return { mode: 'login', tab: 'menu', section: '' }
  if (path.startsWith('/staff/')) {
    const section = path.split('/')[2]
    return { mode: 'dashboard', tab: 'menu', section: staffSections.has(section) ? section : 'overview' }
  }
  if (path === '/songs') return { mode: 'guest', tab: 'songs', section: '' }
  if (path === '/member' || path === '/member/login') return { mode: 'member-login', tab: 'member', section: '' }
  if (path === '/member/account') return { mode: 'member-account', tab: 'member', section: '' }
  return { mode: 'guest', tab: 'menu', section: '' }
}

function ValidatedForm({ onSubmit, children, ...props }) {
  const [validationError, setValidationError] = useState('')
  function submit(event) {
    event.preventDefault()
    const invalid = [...event.currentTarget.elements].find(field => field.willValidate && !field.validity.valid)
    if (invalid) {
      const label = invalid.labels?.[0]?.textContent?.trim() || 'This field'
      setValidationError(`${label}: ${invalid.validationMessage}`)
      invalid.focus(); return
    }
    setValidationError(''); onSubmit?.(event)
  }
  return <form {...props} noValidate onSubmit={submit} onInput={() => setValidationError('')}>{children}{validationError && <p className="form-error" role="alert">{validationError}</p>}</form>
}

function useModalFocus(open, onClose, selector) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement
    const panel = document.querySelector(selector)
    if (!panel) return
    const controls = () => [...panel.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]')].filter(el => el.getClientRects().length)
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    controls()[0]?.focus()
    function keydown(event) {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current() }
      if (event.key === 'Tab') {
        const list = controls(), first = list[0], last = list[list.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', keydown)
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', keydown); if (previous?.isConnected) previous.focus() }
  }, [open, selector])
}

function App() {
  const initialRoute = routeState()
  const [mode, setMode] = useState(initialRoute.mode)
  const [language, setLanguage] = useState('en')
  const [tableCode, setTableCode] = useState(() => new URLSearchParams(location.search).get('table') || (isLive ? '' : '08'))
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(!isLive)
  const [guestTab, setGuestTab] = useState(initialRoute.tab)
  const [activeSection, setActiveSection] = useState(initialRoute.section)
  const [toast, setToast] = useState('')
  const [toastTone, setToastTone] = useState('info')
  const toastTimer = useRef(null)
  const t = getCopy(language)
  useEffect(() => { document.documentElement.lang = language === 'bm' ? 'ms' : language; document.title = `${mode === 'dashboard' ? (t[sectionLabels[activeSection]] || t.operations) : mode === 'login' ? t.staffLogin : guestTab === 'songs' ? t.requestSong : guestTab === 'member' || mode.startsWith('member') ? t.member : t.menu} · DYRB` }, [mode, guestTab, activeSection, language])
  const notify = useCallback((message, tone = 'info') => { clearTimeout(toastTimer.current); setToast(message); setToastTone(tone); toastTimer.current = window.setTimeout(() => setToast(''), tone === 'error' ? 7000 : 4000) }, [])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  function navigate(path) {
    window.history.pushState({}, '', path)
    syncRoute()
  }
  function syncRoute() {
    const next = routeState()
    setMode(next.mode); setGuestTab(next.tab)
    if (next.section) setActiveSection(next.section)
    setTableCode(new URLSearchParams(location.search).get('table') || (isLive ? '' : '08'))
  }
  function navigateGuestTab(tab) {
    const path = tab === 'songs' ? '/songs' : tab === 'member' ? '/member/login' : '/menu'
    navigate(`${path}?table=${encodeURIComponent(tableCode)}`)
  }
  function navigateStaffSection(section) {
    setActiveSection(section)
    navigate(`/staff/${section}`)
  }

  useEffect(() => {
    const onPopState = () => syncRoute()
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (!isLive) return
    let active = true
    async function restoreSession() {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        const authUser = data.session?.user
        if (!authUser) return
        const { data: member } = await supabase.from('members').select('id,display_name,phone,active').eq('id', authUser.id).maybeSingle()
        if (member?.active) {
          if (active) setSession({ id: member.id, name: member.display_name, phone: member.phone, type: 'member', role: 'member' })
          return
        }
        const { data: staff } = await supabase.from('staff_profiles').select('user_id,display_name,role,active').eq('user_id', authUser.id).maybeSingle()
        if (staff?.active && active) setSession({ id: staff.user_id, name: staff.display_name, role: staff.role, type: 'staff' })
        else await supabase.auth.signOut()
      } catch (error) { notify(error.message || 'Unable to restore your sign-in.', 'error') }
      finally { if (active) setAuthReady(true) }
    }
    restoreSession()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!authReady) return
    let destination = ''
    if ((mode === 'login' || mode === 'dashboard') && session?.type === 'member') destination = `/member/account?table=${encodeURIComponent(tableCode)}`
    else if (mode === 'login' && session?.type === 'staff') destination = `/staff/${activeSection || 'overview'}`
    else if (mode === 'member-account' && session?.type !== 'member') destination = `/member/login?table=${encodeURIComponent(tableCode)}`
    else if (mode === 'member-login' && session?.type === 'member') destination = `/member/account?table=${encodeURIComponent(tableCode)}`
    else if (mode === 'member-login' && session?.type === 'staff') destination = `/staff/${activeSection || 'overview'}`
    if (destination) { window.history.replaceState({}, '', destination); syncRoute() }
  }, [authReady, mode, session?.type, tableCode, activeSection])

  async function signOut() {
    try { await logout() } catch (error) { notify(error.message, 'error') }
    setSession(null); navigateGuestTab('menu')
  }

  async function handleLogin(phone, pin, target = 'staff') {
    const user = await login(phone, pin, target)
    if (target === 'member' && user.type !== 'member') throw new Error('Use a member account to sign in here.')
    setSession(user)
    if (user.type === 'staff') {
      const perms = await getPermissions(user.role)
      const first = (user.role === 'singer' ? ['songs'] : ['overview', 'songs', 'orders', 'service', 'members', 'menu', 'staff', 'tables', 'permissions']).find((key) => !navMeta[key]?.permission || perms.includes(navMeta[key].permission))
      navigateStaffSection(first || 'songs')
    } else navigate(`/member/account?table=${encodeURIComponent(tableCode)}`)
  }

  return <div className="app-shell">
    {mode === 'guest' && <GuestPage key={tableCode} tableCode={tableCode} language={language} setLanguage={setLanguage} tab={guestTab} onTabChange={navigateGuestTab} onStaff={() => navigate('/staff')} notify={notify} />}
    {mode === 'member-login' && <MemberLoginPage tableCode={tableCode} language={language} setLanguage={setLanguage} t={t} onLogin={(phone, pin) => handleLogin(phone, pin, 'member')} onTabChange={navigateGuestTab} onStaff={() => navigate('/staff')} notify={notify} />}
    {(mode === 'login' || (mode === 'dashboard' && !session)) && <StaffLogin t={t} language={language} onLanguage={setLanguage} onBack={() => navigateGuestTab('menu')} onLogin={handleLogin} notify={notify} />}
    {mode === 'member-account' && authReady && session?.type === 'member' && <MemberPage t={t} language={language} setLanguage={setLanguage} member={session} onBack={signOut} notify={notify} />}
    {mode === 'dashboard' && session?.type === 'staff' && <Dashboard user={session} t={t} language={language} onLanguage={setLanguage} activeSection={activeSection} setActiveSection={navigateStaffSection} onSignOut={signOut} notify={notify} />}
    {toast && <div className={`toast toast-${toastTone}`} role={toastTone === 'error' ? 'alert' : 'status'}>{toastTone === 'error' ? <CircleHelp size={17} /> : <CheckCircle2 size={17} />}{toast}</div>}
  </div>
}

function Brand({ compact = false }) {
  return <div className={`brand-lockup ${compact ? 'compact' : ''}`}><span className="brand-mark"><img src="/images/dyrb-logo.png" alt="" /></span><span><strong>DYRB</strong><small>第一热吧</small></span></div>
}

function LanguageSwitch({ language, setLanguage, guest = false }) {
  return <div className="language-switch" aria-label="Language">
    <button aria-pressed={language === 'en'} className={language === 'en' ? 'selected' : ''} onClick={() => setLanguage('en')}>EN</button>
    <span />
    <button aria-pressed={language === 'bm'} className={language === 'bm' ? 'selected' : ''} onClick={() => setLanguage('bm')}>BM</button>
    {guest && <><span /><button aria-pressed={language === 'zh'} className={language === 'zh' ? 'selected' : ''} onClick={() => setLanguage('zh')}>中文</button></>}
  </div>
}

function GuestPage({ tableCode, language, setLanguage, tab, onTabChange, onStaff, notify }) {
  const t = getCopy(language)
  const setTab = onTabChange
  const [items, setItems] = useState([])
  const [cart, setCart] = useState(() => { try { const saved = JSON.parse(sessionStorage.getItem(`dyrb-cart-${tableCode}`) || '[]'); return Array.isArray(saved) ? saved.filter(x => x.item?.id && Number.isInteger(x.qty) && x.qty > 0 && x.qty <= 20) : [] } catch { return [] } })
  useEffect(() => { try { sessionStorage.setItem(`dyrb-cart-${tableCode}`, JSON.stringify(cart)) } catch {} }, [cart, tableCode])
  const [addFeedback, setAddFeedback] = useState({})
  const addFeedbackTimers = useRef(new Map())
  const [cartOpen, setCartOpen] = useState(false)
  const [menu, setMenu] = useState([])
  const [beforeEight, setBeforeEight] = useState(isBeforeEightInMalaysia)
  const [menuGroup, setMenuGroup] = useState('food')
  const [category, setCategory] = useState('mains')
  const [songForm, setSongForm] = useState({ title: '', artist: '', dedication: '' })
  const [sending, setSending] = useState(false)
  const [songSent, setSongSent] = useState(false)
  const [serviceSent, setServiceSent] = useState('')
  const [serviceBusy, setServiceBusy] = useState(false)
  const [menuError, setMenuError] = useState('')
  const [menuLoading, setMenuLoading] = useState(true)
  const loadMenu = useCallback(async () => {
    setMenuError(''); setMenuLoading(true)
    try { setMenu(await getMenu()) } catch { setMenuError('The menu could not be loaded. Please try again or ask staff for help.') }
    finally { setMenuLoading(false) }
  }, [])

  useEffect(() => { loadMenu(); const off = listenForDemoChanges(loadMenu); let channel
    if (isLive) channel = supabase.channel('guest-menu').on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, loadMenu).on('postgres_changes', { event: '*', schema: 'public', table: 'menu_events' }, loadMenu).subscribe()
    const poll = window.setInterval(loadMenu, 30000)
    return () => { clearInterval(poll); off(); if (channel) supabase.removeChannel(channel) }
  }, [loadMenu])
  useModalFocus(cartOpen, () => setCartOpen(false), '.mobile-cart-sheet')
  useEffect(() => {
    const timer = window.setInterval(() => setBeforeEight(isBeforeEightInMalaysia()), 15000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    setCart((current) => {
      const remapped = cartAtCurrentDraughtPrice(current, menu, beforeEight)
      return remapped.some((entry, index) => entry.item.id !== current[index].item.id) ? remapped : current
    })
  }, [beforeEight, menu])
  useEffect(() => () => addFeedbackTimers.current.forEach((timer) => clearTimeout(timer)), [])
  const categories = menuGroup === 'food'
    ? [{ id: 'mains', label: t.food }, { id: 'bites', label: t.bites }]
    : [{ id: 'draught', label: t.draught }, { id: 'bottle', label: t.bottle }, { id: 'cocktails', label: t.cocktails }, { id: 'mocktails', label: t.mocktails }, { id: 'soft', label: t.soft }, { id: 'spirits', label: t.spirits }]
  useEffect(() => { if (menu.length && !menu.some(item => item.category === category)) setCategory(menu.find(item => menuGroup === 'food' ? ['mains', 'bites'].includes(item.category) : !['mains', 'bites'].includes(item.category))?.category || 'mains') }, [menu, category, menuGroup])
  function selectMenuGroup(group) { setMenuGroup(group); setCategory(group === 'food' ? 'mains' : 'draught') }
  const filtered = menu.filter((x) => x.category === category && (category !== 'draught' || !draughtPeriod(x) || draughtPeriod(x) === (beforeEight ? 'happy-hour' : 'after-eight')))
  const menuCards = (() => {
    if (!['draught', 'bottle', 'spirits'].includes(category)) return filtered.map((item) => ({ key: item.id, item, variants: [item] }))
    const groups = new Map()
    filtered.forEach((item) => {
      const key = `${item.category}|${localizedMenuName(item, 'en').toLowerCase()}|${draughtPeriod(item)}`
      const group = groups.get(key) || { key, item, variants: [] }
      group.variants.push(item)
      groups.set(key, group)
    })
    return [...groups.values()]
  })()
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const total = cart.reduce((sum, item) => sum + item.item.price * item.qty, 0)
  function addItem(item) {
    if (addFeedback[item.id] || sending || !item.available) return
    setCart((current) => { const found = current.find((x) => x.item.id === item.id); return found ? current.map((x) => x.item.id === item.id ? { ...x, qty: Math.min(20, x.qty + 1) } : x) : [...current, { item, qty: 1 }] })
    setAddFeedback((current) => ({ ...current, [item.id]: 'loading' }))
    const previousTimer = addFeedbackTimers.current.get(item.id)
    if (previousTimer) clearTimeout(previousTimer)
    const loadingTimer = setTimeout(() => {
      setAddFeedback((current) => ({ ...current, [item.id]: 'success' }))
      const successTimer = setTimeout(() => {
        setAddFeedback((current) => { const next = { ...current }; delete next[item.id]; return next })
        addFeedbackTimers.current.delete(item.id)
      }, 600)
      addFeedbackTimers.current.set(item.id, successTimer)
    }, 150)
    addFeedbackTimers.current.set(item.id, loadingTimer)
  }
  function changeQty(id, step) { if (sending) return; setCart((current) => current.map((x) => x.item.id === id ? { ...x, qty: Math.min(20, x.qty + step) } : x).filter((x) => x.qty > 0)) }
  function renderAddControl(item) {
    const quantity = cart.find((entry) => entry.item.id === item.id)?.qty || 0
    const feedback = addFeedback[item.id]
    const itemName = localizedMenuName(item, language)
    const serving = localizedMenuServing(item, language)
    const fullName = [itemName, serving].filter(Boolean).join(' ')
    return item.available ? quantity > 0 && !feedback ? <div className="menu-qty-control" aria-label={`${fullName}, quantity ${quantity}`}>
      <button aria-label={`Remove one ${fullName}`} onClick={() => changeQty(item.id, -1)}><Minus size={14} /></button>
      <span aria-live="polite">{quantity}</span>
      <button aria-label={`Add one ${fullName}`} onClick={() => changeQty(item.id, 1)}><Plus size={14} /></button>
    </div> : <button className={`add-button ${feedback ? `is-${feedback}` : ''}`} onClick={() => addItem(item)} disabled={Boolean(feedback)} aria-label={feedback === 'loading' ? `Adding ${fullName}` : feedback === 'success' ? `${fullName} added` : `${t.add} ${fullName}`} aria-busy={feedback === 'loading'}>
      <span className="add-button-content"><Plus size={15} /><span>{t.add}</span></span>
      {feedback === 'loading' && <span className="add-button-spinner" aria-hidden="true" />}
      {feedback === 'success' && <Check size={16} className="add-button-check" aria-hidden="true" />}
    </button> : <span className="sold-out-label">{t.unavailable}</span>
  }
  async function sendOrder() {
    if (!tableCode) { notify('Scan the QR code at your table before ordering.'); return }
    if (!cart.length || sending) return
    setSending(true)
    const currentCart = cartAtCurrentDraughtPrice(cart, menu, isBeforeEightInMalaysia())
    setCart(currentCart)
    try {
      const latestMenu = await getMenu()
      const unavailable = currentCart.find(entry => !latestMenu.find(item => item.id === entry.item.id && item.available))
      if (unavailable) throw new Error(`${unavailable.item.name} is no longer available. Remove it from your basket before sending.`)
      const checkedCart = currentCart.map(entry => ({ ...entry, item: latestMenu.find(item => item.id === entry.item.id) }))
      if (checkedCart.some((entry, index) => entry.item.price !== cart[index].item.price)) { setCart(checkedCart); notify('Prices have changed. Please review your basket and send again.'); return }
      await submitOrder(tableCode, checkedCart); setCart([]); setCartOpen(false); notify(t.orderReceived) }
    catch (error) { notify(error.message, 'error') } finally { setSending(false) }
  }
  async function sendSong(event) {
    event.preventDefault()
    if (!tableCode) { notify('Scan the QR code at your table before requesting a song.'); return }
    if (!songForm.title.trim() || sending) return
    setSending(true)
    try { await submitSong({ ...songForm, title: songForm.title.trim(), artist: songForm.artist.trim(), table: tableCode }); setSongForm({ title: '', artist: '', dedication: '' }); setSongSent(true); notify(t.requestSuccess) }
    catch (error) { notify(error.message, 'error') } finally { setSending(false) }
  }
  async function requestService(type) {
    if (!tableCode) { notify('Scan the QR code at your table or speak to staff.'); return }
    if (serviceBusy) return
    setServiceBusy(true)
    try { await submitService(tableCode, type); setServiceSent(type); notify(t.serviceReceived) }
    catch (error) { notify(error.message, 'error') } finally { setServiceBusy(false) }
  }

  return <main className="guest-page">
    <header className="guest-topbar">
      <Brand />
      <div className="guest-top-right"><div className="table-badge"><span className="live-dot" />{t.table} <strong>{tableCode}</strong></div><LanguageSwitch language={language} setLanguage={setLanguage} guest /><button className="staff-link" onClick={onStaff}><UserRound size={15} />{t.staff}</button></div>
    </header>
    {!tableCode && <div className="form-error" role="alert">Scan the QR code at your table before sending an order or request. Ask staff if you need help.</div>}
    <div className="guest-layout">
      <section className="guest-main-column">
        <div className="guest-section-heading"><div>{tab !== 'member' && <><h2>{tab === 'menu' ? t.menuTitle : t.requestSong}</h2><p>{tab === 'menu' ? t.menuCopy : t.songCopy}</p></>}</div>
          <nav className="guest-tabs" aria-label="Guest services">
            <button className={tab === 'menu' ? 'active' : ''} onClick={() => setTab('menu')}><Utensils size={17} />{t.menu}</button>
            <button className={tab === 'songs' ? 'active' : ''} onClick={() => setTab('songs')}><Music2 size={17} />{t.songs}</button>
            <button className={tab === 'member' ? 'active' : ''} onClick={() => setTab('member')}><UserRound size={17} />{t.member}</button>
          </nav>
        </div>

        {tab === 'menu' && <div className="menu-area">
          <div className="menu-group-tabs" role="group" aria-label={language === 'zh' ? '菜单分类' : 'Menu type'}>
            <button className={menuGroup === 'food' ? 'active' : ''} aria-pressed={menuGroup === 'food'} onClick={() => selectMenuGroup('food')}><Utensils size={15} />{t.foodGroup}</button>
            <button className={menuGroup === 'beverages' ? 'active' : ''} aria-pressed={menuGroup === 'beverages'} onClick={() => selectMenuGroup('beverages')}><Beer size={15} />{t.beverageGroup}</button>
          </div>
          {menu.some(item => item.eventId) && <div className="event-menu-banner"><strong>{menu.find(item => item.eventId)?.eventName || 'Special event'}</strong><span>{language === 'bm' ? 'Menu makanan khas' : language === 'zh' ? '特别活动餐单' : 'Special event food menu'}</span></div>}<div className="menu-category-row"><div className="category-tabs">{categories.filter(item => menu.some(row => row.category === item.id)).map((item) => <button key={item.id} className={category === item.id ? 'active' : ''} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</button>)}</div></div>
          <div className="menu-list">{menuLoading && !menu.length && <div className="loading-screen" role="status">{t.loading}</div>}{menuError && <div className="form-error" role="alert">{menuError}<button className="secondary-button" onClick={loadMenu}>Try again</button></div>}{!menuLoading && !menuError && !menuCards.length && <EmptyState icon={Utensils} title="No items in this category yet." />}{menuCards.map(({ item, variants }, index) => {
            const itemName = localizedMenuName(item, language)
            const itemDescription = localizedMenuDescription(item, language)
            const itemPeriod = localizedMenuPeriod(item, language)
            const beveragePhoto = beveragePhotoClasses[item.category]
            if (variants.length > 1) return <article key={item.id} className={`menu-item menu-item-combined ${variants.every((variant) => !variant.available) ? 'disabled' : ''}`}>
              <div className={`menu-thumb ${item.image ? 'has-image' : beveragePhoto || `thumb-${index + 1}`}`}>{item.image ? <img src={item.image} alt="" /> : beveragePhoto ? null : <Beer size={26} />}</div>
              <div className="menu-item-copy">
                <div className="menu-item-title-row"><div className="menu-item-heading">{itemPeriod && <span className="menu-period-label">{itemPeriod}</span>}<h3>{itemName}</h3></div></div>
                {item.category !== 'draught' && itemDescription && <p>{itemDescription}</p>}
                <div className="menu-variant-list">
                  <div className="menu-variant-head"><span />{item.tag && <span className="item-tag menu-item-code">{item.tag}</span>}</div>
                  {variants.map((variant) => <div className="menu-variant-row" key={variant.id}>
                    <div className="menu-variant-info"><span>{localizedMenuServing(variant, language)}</span><strong>{formatMoney(variant.price)}</strong></div>
                    {renderAddControl(variant)}
                  </div>)}
                </div>
              </div>
            </article>
            return <article key={item.id} className={`menu-item ${!item.available ? 'disabled' : ''}`}>
            <div className={`menu-thumb ${item.image ? 'has-image' : beveragePhoto || `thumb-${index + 1}`}`}>{item.image ? <img src={item.image} alt="" /> : beveragePhoto ? null : ['draught', 'bottle', 'spirits'].includes(item.category) ? <Beer size={26} /> : <Coffee size={25} />}</div>
            <div className="menu-item-copy"><div className="menu-item-title-row"><div className="menu-item-heading"><h3>{itemName}</h3></div></div>{itemDescription && <p>{itemDescription}</p>}<div className="menu-item-price"><strong>{formatMoney(item.price)}</strong></div></div>
            <div className="menu-item-action">{item.tag && <span className="item-tag menu-item-code">{item.tag}</span>}{renderAddControl(item)}</div>
          </article>})}</div>
        </div>}

        {tab === 'songs' && <div className="guest-feature-grid song-request-layout">
          <ValidatedForm className="song-request-form" onSubmit={sendSong}><div className="form-title"><span className="form-icon"><Music2 size={19} /></span><div><h3>{t.requestSong}</h3></div></div>
            <label>{t.songTitle}<input required value={songForm.title} onChange={(e) => setSongForm({ ...songForm, title: e.target.value })} placeholder={language === 'zh' ? '例如：月亮代表我的心' : 'e.g. Sempurna'} maxLength={100} /></label>
            <label><span className="form-label-row"><span>{t.artist}</span><span className="optional-field-label">{language === 'zh' ? '（选填）' : language === 'bm' ? '(pilihan)' : '(optional)'}</span></span><input value={songForm.artist} onChange={(e) => setSongForm({ ...songForm, artist: e.target.value })} placeholder={language === 'zh' ? '歌手名称' : 'e.g. Andra & The Backbone'} maxLength={100} /></label>
            <label>{t.dedication}<textarea className="resize-none" value={songForm.dedication} onChange={(e) => setSongForm({ ...songForm, dedication: e.target.value })} placeholder={language === 'zh' ? '写一句祝福给特别的人……' : 'A little message for someone special…'} maxLength={280} rows={3} /></label>
            {songSent && <div className="inline-success"><CheckCircle2 size={16} />{t.requestSuccess}</div>}
            <button className="primary-button full" disabled={sending}>{sending ? t.loading : <>{t.submitRequest}<ArrowRight size={16} /></>}</button>
          </ValidatedForm>
        </div>}

      </section>

        <aside className="guest-rail">
        <div className="cart-panel"><div className="panel-heading"><div><span className="section-eyebrow">{language === 'zh' ? t.table : 'TABLE'} {tableCode}</span><h3>{t.cart}</h3></div><span className="cart-count">{totalCount}</span></div>
          {!cart.length ? <div className="empty-cart"><span className="empty-cart-icon"><ShoppingBag size={23} /></span><p>{t.emptyCart}</p><span>{t.noCharge}</span></div> : <div className="cart-lines">{cart.map(({ item, qty }) => <div className="cart-line" key={item.id}><div><strong>{localizedMenuName(item, language)}</strong>{localizedMenuServing(item, language) && <span className="cart-serving">{localizedMenuServing(item, language)}</span>}<small>{formatMoney(item.price)}{item.category === 'draught' ? ` · ${localizedMenuPeriod(item, language)}` : ''}</small></div><div className="qty-control"><button aria-label="Remove one" onClick={() => changeQty(item.id, -1)}><Minus size={13} /></button><span>{qty}</span><button aria-label="Add one" onClick={() => changeQty(item.id, 1)}><Plus size={13} /></button></div></div>)}</div>}
          {cart.length > 0 && <><div className="cart-subtotal"><span>{t.subtotal}</span><strong>{formatMoney(total)}</strong></div><button className="primary-button full checkout-button" onClick={sendOrder} disabled={sending}>{sending ? t.loading : <>{t.payCounter}<ArrowRight size={16} /></>}</button></>}
          {!cart.length && <button className="secondary-button full browse-button" onClick={() => { setTab('menu'); document.querySelector('.guest-section-heading')?.scrollIntoView({ behavior: 'smooth' }) }}>{language === 'zh' ? t.browseMenu : 'Browse the menu'}<ArrowRight size={15} /></button>}
        </div>
        <div className="service-panel"><div className="service-header"><span className="service-icon"><Bell size={17} /></span><div><span className="section-eyebrow">{language === 'zh' ? t.serviceKicker : 'AT YOUR SERVICE'}</span><h3>{t.help}</h3></div></div>
          <div className="service-actions"><button disabled={serviceBusy} onClick={() => requestService('Call staff')}><span><UserRound size={16} />{t.callStaff}</span><ChevronRight size={15} /></button><button disabled={serviceBusy} onClick={() => requestService('Request water')}><span><GlassWater size={16} />{t.water}</span><ChevronRight size={15} /></button><button disabled={serviceBusy} onClick={() => requestService('Request the bill')}><span><Wallet size={16} />{t.bill}</span><ChevronRight size={15} /></button></div>
          {serviceSent && <div className="service-confirm"><Check size={13} />{t.serviceReceived}</div>}
        </div>
        <div className="rail-footer"><span><Shield size={14} />{language === 'zh' ? t.footerPromise : 'Your table · your night'}</span><span>DYRB · MALAYSIA</span></div>
      </aside>
    </div>
    <div className="mobile-cart-bar"><button onClick={() => setCartOpen(true)}><span className="mobile-cart-count">{totalCount}</span><ShoppingCart size={18} />{t.cart}<strong>{formatMoney(total)}</strong><ChevronUpSmall /></button></div>
    {cartOpen && <div className="mobile-cart-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setCartOpen(false) }}><div className="mobile-cart-sheet" role="dialog" aria-modal="true" aria-label={t.cart}><button aria-label={t.close} className="sheet-close" onClick={() => setCartOpen(false)}><X size={18} /></button><div className="panel-heading"><div><span className="section-eyebrow">{language === 'zh' ? t.table : 'TABLE'} {tableCode}</span><h3>{t.cart}</h3></div><span className="cart-count">{totalCount}</span></div>{cart.length ? <><div className="cart-lines">{cart.map(({ item, qty }) => <div className="cart-line" key={item.id}><div><strong>{localizedMenuName(item, language)}</strong>{localizedMenuServing(item, language) && <span className="cart-serving">{localizedMenuServing(item, language)}</span>}<small>{formatMoney(item.price)}{item.category === 'draught' ? ` · ${localizedMenuPeriod(item, language)}` : ''}</small></div><div className="qty-control"><button aria-label={`Remove one ${item.name}`} disabled={sending} onClick={() => changeQty(item.id, -1)}><Minus size={13} /></button><span>{qty}</span><button aria-label={`Add one ${item.name}`} disabled={sending || qty >= 20} onClick={() => changeQty(item.id, 1)}><Plus size={13} /></button></div></div>)}</div><div className="cart-subtotal"><span>{t.subtotal}</span><strong>{formatMoney(total)}</strong></div><button className="primary-button full" disabled={sending} onClick={sendOrder}>{sending ? t.loading : t.payCounter}<ArrowRight size={16} /></button></> : <p className="empty-cart-copy">{t.emptyCart}</p>}</div></div>}
  </main>
}

function ChevronUpSmall() { return <ChevronDown className="rotate-up" size={16} /> }

function MemberLoginPage({ tableCode, language, setLanguage, t, onLogin, onTabChange, onStaff, notify }) {
  return <main className="guest-page member-login-route">
    <header className="guest-topbar"><Brand /><div className="guest-top-right"><div className="table-badge"><span className="live-dot" />{t.table} <strong>{tableCode}</strong></div><LanguageSwitch language={language} setLanguage={setLanguage} guest /><button className="staff-link" onClick={onStaff}><UserRound size={15} />{t.staff}</button></div></header>
    <div className="member-login-route-content"><nav className="guest-tabs" aria-label="Guest services"><button onClick={() => onTabChange('menu')}><Utensils size={17} />{t.menu}</button><button onClick={() => onTabChange('songs')}><Music2 size={17} />{t.songs}</button><button className="active" aria-current="page" onClick={() => onTabChange('member')}><UserRound size={17} />{t.member}</button></nav><MemberLoginInline t={t} language={language} onLogin={onLogin} notify={notify} /></div>
  </main>
}

function MemberLoginInline({ t, language, onLogin, notify }) {
  const [loading, setLoading] = useState(false)
  async function submit(e) { e.preventDefault(); const form = e.currentTarget; setLoading(true); try { await onLogin(form.phone.value.trim(), form.pin.value) } catch (error) { notify(error.message || 'Unable to sign in.', 'error'); setLoading(false) } }
  return <div className="member-login-wrap"><div className="member-login-card">
    <div className="member-login-heading"><span className="section-eyebrow">{language === 'zh' ? t.memberBadge : 'DYRB MEMBERS'}</span><h3>{t.memberTitle}</h3><p>{t.memberCopy}</p></div>
    <ValidatedForm onSubmit={submit}><label>{t.phone}<input name="phone" type="tel" required autoComplete="tel" placeholder="01X XXX XXXX" /></label><label>{t.pin}<input name="pin" type="password" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required autoComplete="current-password" placeholder="••••••" /></label><button className="primary-button full" disabled={loading}>{loading ? t.loading : <>{t.signIn}<ArrowRight size={16} /></>}</button></ValidatedForm>
    <div className="member-signup-note"><CircleHelp size={15} />{t.noAccount}</div>
  </div></div>
}

function MemberPage({ t, language, setLanguage, member, onBack, notify }) {
  return <div className="member-page"><header className="member-page-header"><Brand compact /><div className="guest-top-right"><LanguageSwitch language={language} setLanguage={setLanguage} guest /><button className="staff-link" onClick={onBack}><ArrowLeft size={15} />{t.backGuest}</button></div></header><main className="member-balance-shell guest-page"><MemberBalanceCard t={t} language={language} member={member} onSignOut={onBack} /></main></div>
}

function MemberBalanceCard({ t, language, member, onSignOut }) {
  const [points, setPoints] = useState(member.points || 0)
  const [legacyBeer, setLegacyBeer] = useState(0)
  const [batches, setBatches] = useState([])
  const [transactions, setTransactions] = useState([])
  const [storageError, setStorageError] = useState('')
  useEffect(() => {
    let active = true
    async function load() {
      try {
        if (isLive) {
          const { data, error } = await supabase.from('member_balance_summary').select('points,beer_servings').eq('member_id', member.id).maybeSingle()
          if (error) throw error
          if (active) { setPoints(data?.points || 0); setLegacyBeer(data?.beer_servings || 0) }
        } else {
          const row = JSON.parse(localStorage.getItem('malam-demo-v2') || '{}').members?.find((x) => x.id === member.id)
          if (active) setPoints(row?.points ?? member.points ?? 0)
        }
        const stored = await getMemberStoredItems(member.id)
        if (active) { setBatches(stored.batches); setTransactions(stored.transactions); if (!isLive) setLegacyBeer(stored.legacyCount || 0); setStorageError('') }
      } catch (error) { if (active) setStorageError(error.message || 'Stored item history is not available.') }
    }
    load()
    const off = !isLive ? listenForDemoChanges(load) : () => {}
    return () => { active = false; off?.() }
  }, [member])
  const itemTypeLabel = (type) => ({ draught: t.typeDraught, bottle: t.typeBottle, whisky: t.typeWhisky, spirit: t.typeSpirit, other: t.typeOther }[type] || type)
  const itemUnitLabel = (type) => type === 'draught' ? t.unitServings : t.unitItems
  const dateLocale = language === 'zh' ? 'zh-CN' : language === 'bm' ? 'ms-MY' : 'en-MY'
  const dateLabel = (value, includeTime = false) => value ? new Intl.DateTimeFormat(dateLocale, { timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short', year: 'numeric', ...(includeTime ? { hour: 'numeric', minute: '2-digit' } : {}) }).format(new Date(value)) : '—'
  const now = Date.now()
  return <div className="member-login-wrap"><section className="member-login-card member-inline-success" aria-label={t.memberTitle}>
    <header className="member-account-header"><div><span className="section-eyebrow">DYRB MEMBER ACCOUNT</span><h3>{member.name}</h3>{member.phone && <small>{member.phone}</small>}</div><button className="secondary-button member-signout" onClick={onSignOut}><LogOut size={14} />{t.signOut}</button></header>
    <div className="inline-balances member-points-only"><div><div className="member-balance-label"><span>{t.points}</span><Ticket size={16} /></div><strong>{points}</strong><small>{t.availablePoints}</small></div></div>
    <section className="member-storage-section"><div className="member-storage-heading"><div><h4>{t.storedDrinks}</h4><p>{t.storedDrinksCopy}</p></div></div>
      {storageError ? <p className="member-storage-empty">{t.storageUnavailable}</p> : batches.filter((batch) => batch.quantityRemaining > 0 && (!batch.expiresAt || batch.expiresAt > Date.now())).length ? <div className="member-stored-list">{batches.filter((batch) => batch.quantityRemaining > 0 && (!batch.expiresAt || batch.expiresAt > Date.now())).map((batch) => {
        const expired = batch.expiresAt && batch.expiresAt <= now
        return <article className={`member-stored-item ${expired ? 'expired' : ''}`} key={batch.id}><div className="member-stored-main"><span className="member-stored-type">{itemTypeLabel(batch.itemType)}</span><strong>{batch.itemName}</strong><b>{batch.quantityRemaining} <small>{itemUnitLabel(batch.itemType)}</small></b></div><div className="member-stored-dates"><span><small>{t.storedOn}</small>{dateLabel(batch.storedAt)}</span>{batch.expiresAt && <span><small>{t.expiresOn}</small>{dateLabel(batch.expiresAt)}{expired && <em>{t.expired}</em>}</span>}</div></article>
      })}</div> : <p className="member-storage-empty">{t.noStoredItems}</p>}{!storageError && legacyBeer > 0 && <p className="member-legacy-storage">{t.legacyStorage.replace('{count}', legacyBeer)}</p>}
    </section>
    <section className="member-activity-section"><div className="member-storage-heading"><div><h4>{t.transactionHistory}</h4><p>{t.transactionHistoryCopy}</p></div></div>
      {transactions.length ? <div className="member-transactions">{transactions.map((entry) => <article className="member-transaction" key={entry.id}><span className={`member-transaction-icon ${entry.transactionType}`} aria-hidden="true">{entry.transactionType === 'in' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</span><div className="member-transaction-copy"><strong>{entry.itemName}</strong><small><b>{entry.transactionType === 'in' ? t.storedIn : t.takenOut}</b> · {itemTypeLabel(entry.itemType)} · {dateLabel(entry.createdAt, true)}</small>{entry.reason && <small>{entry.reason}</small>}</div><b className={entry.transactionType === 'in' ? 'in' : 'out'}>{entry.transactionType === 'in' ? '+' : '−'}{entry.quantity} {itemUnitLabel(entry.itemType)}</b></article>)}</div> : <p className="member-storage-empty">{t.noTransactions}</p>}
    </section>
  </section></div>
}

const demoCredentials = [
  { name: 'Owner', phone: '0123456789', pin: '111111', color: 'owner' },
  { name: 'Boss', phone: '0123456790', pin: '222222', color: 'boss' },
  { name: 'Manager', phone: '0123456791', pin: '333333', color: 'manager' },
  { name: 'Staff', phone: '0123456792', pin: '444444', color: 'staff' },
  { name: 'Singer', phone: '0123456793', pin: '555555', color: 'singer' },
]

function StaffLogin({ t, language, onLanguage, onBack, onLogin, notify }) {
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(e) { e.preventDefault(); setLoading(true); try { await onLogin(phone.trim(), pin, 'staff') } catch (error) { notify(error.message || 'Unable to sign in.', 'error') } finally { setLoading(false) } }
  return <main className="staff-login-page"><button className="back-guest" onClick={onBack}><ArrowLeft size={15} />{t.backGuest}</button><div className="staff-login-card"><Brand /><div className="login-kicker"><Shield size={14} />{t.staffAccess}</div><h1>{t.staffLogin}</h1><p className="login-intro">{t.staffIntro}</p><ValidatedForm onSubmit={submit} className="staff-login-form"><label>{t.staffUserId}<input type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} pattern="[a-zA-Z][a-zA-Z0-9._-]{2,31}" maxLength={32} placeholder="e.g. aden" value={phone} onChange={(e) => setPhone(e.target.value)} required /></label><label>{t.staffPasscode}<input type="password" inputMode="numeric" autoComplete="current-password" placeholder="••••••" pattern="[0-9]{6}" minLength={6} maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} required /></label><button className="primary-button full" disabled={loading}>{loading ? t.loading : <>{t.enter}<ArrowRight size={16} /></>}</button></ValidatedForm>
      {!isLive && <div className="demo-login-area"><div className="demo-divider"><span />{t.demo}<span /></div><p>{t.sampleLogins} · Preview accounts</p><div className="demo-login-pills">{demoCredentials.map((item) => <button key={item.name} className={`demo-pill ${item.color}`} onClick={() => { setPhone(item.color); setPin(item.pin) }}><span className="demo-avatar">{item.name.slice(0, 1)}</span><span>{item.name}</span></button>)}</div><div className="demo-pin-caption">Owner 111111 · Boss 222222 · Manager 333333 · Staff 444444 · Singer 555555</div></div>}
      <div className="login-footer"><span>{isLive ? <><span className="live-dot" />{t.liveMode}</> : <><span className="live-dot demo-dot" />{t.demoMode}</>}</span><LanguageSwitch language={language} setLanguage={onLanguage} /></div>
    </div></main>
}

const sectionLabels = { overview: 'overview', songs: 'liveQueue', orders: 'orders', service: 'serviceRequests', members: 'members', menu: 'menuAdmin', staff: 'team', tables: 'tableQr', permissions: 'permissions' }

function Dashboard({ user, t, language, onLanguage, activeSection, setActiveSection, onSignOut, notify }) {
  const [data, setData] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [dialog, setDialog] = useState(null)
  const [search, setSearch] = useState('')
  const [loadError, setLoadError] = useState('')
  const actionLock = useRef(false)
  const refreshFlight = useRef(null)
  const allowedNav = useMemo(() => {
    const keys = user.role === 'singer' ? ['songs'] : ['overview', 'songs', 'orders', 'service', 'members', 'menu', 'staff', 'tables', 'permissions']
    return keys.filter((key) => key === 'overview' || permissions.includes(navMeta[key].permission))
  }, [user.role, permissions])
  const refresh = useCallback(() => {
    if (refreshFlight.current) return refreshFlight.current
    refreshFlight.current = (async () => {
      try { const next = await getOperations(user.role); setLoadError(''); setData(next); setPermissions(Array.isArray(next.permissions) ? next.permissions : await getPermissions(user.role)) }
      catch (error) { setLoadError('Could not load the dashboard. Check your connection and try again.') }
      finally { setLoading(false) }
    })().finally(() => { refreshFlight.current = null })
    return refreshFlight.current
  }, [user.role, notify])
  useEffect(() => { refresh(); const off = listenForDemoChanges(refresh); let channel
    if (isLive) channel = supabase.channel(`operations-${user.id}`).on('postgres_changes', { event: '*', schema: 'public' }, refresh).subscribe()
    const refreshVisible = () => { if (document.visibilityState === 'visible') refresh() }
    const poll = isLive ? window.setInterval(refreshVisible, 10000) : null
    if (isLive) {
      window.addEventListener('focus', refreshVisible)
      window.addEventListener('online', refreshVisible)
      document.addEventListener('visibilitychange', refreshVisible)
    }
    return () => {
      off(); if (channel) supabase.removeChannel(channel)
      if (poll !== null) window.clearInterval(poll)
      window.removeEventListener('focus', refreshVisible)
      window.removeEventListener('online', refreshVisible)
      document.removeEventListener('visibilitychange', refreshVisible)
    }
  }, [refresh, user.id])
  useEffect(() => { if (allowedNav.length && !allowedNav.includes(activeSection)) setActiveSection(allowedNav[0]) }, [allowedNav, activeSection, setActiveSection])

  async function run(action) {
    if (actionLock.current) return false
    actionLock.current = true; setBusy(true)
    try { await action(); setDialog(null); notify('Changes saved.', 'success'); await refresh(); return true }
    catch (error) { notify(error.message || 'The action could not be completed. Try again.', 'error'); return false }
    finally { actionLock.current = false; setBusy(false) }
  }
  const can = (permission) => permissions.includes(permission)
  const navNames = { overview: t.overview, songs: t.liveQueue, orders: t.orders, service: t.serviceRequests, members: t.members, menu: t.menuAdmin, staff: t.team, tables: t.tableQr, permissions: t.permissions }
  const pendingOrders = data?.orders?.filter((o) => !['served', 'cancelled'].includes(o.status)).length || 0
  const openServices = data?.services?.filter((x) => x.status === 'open').length || 0
  const pendingSongs = data?.songs?.filter((x) => x.status === 'pending').length || 0
  return <div className="dashboard-layout">
    <aside className="dashboard-sidebar"><div className="sidebar-brand"><Brand compact /></div><div className="sidebar-venue"><span className="venue-avatar">D</span><div><strong>DYRB</strong><small>第一热吧 · Malaysia</small></div><ChevronDown size={15} /></div><div className="sidebar-section-label">{t.operations}</div><nav className="dashboard-nav">{allowedNav.map((key) => { const Icon = navMeta[key].icon; const count = key === 'songs' ? pendingSongs : key === 'orders' ? pendingOrders : key === 'service' ? openServices : 0; return <button key={key} className={activeSection === key ? 'active' : ''} onClick={() => setActiveSection(key)}><Icon size={17} strokeWidth={1.7} /><span>{navNames[key]}</span>{count > 0 && <em>{count}</em>}</button> })}</nav><div className="sidebar-bottom"><div className="sidebar-profile"><div className={`profile-avatar avatar-${user.role}`}>{user.name?.slice(0, 1) || 'M'}</div><div><strong>{user.name}</strong><small>{roleLabels[user.role]}</small></div><button title={t.signOut} onClick={onSignOut}><LogOut size={16} /></button></div><div className="sidebar-mode"><span className={`mode-led ${isLive ? 'live' : ''}`} />{isLive ? t.liveMode : t.demoMode}</div></div></aside>
    <main className="dashboard-main"><header className="dashboard-topbar"><div className="breadcrumb"><span>{t.operations}</span><ChevronRight size={14} /><strong>{navNames[activeSection] || t.overview}</strong></div><div className="topbar-actions"><LanguageSwitch language={language} setLanguage={onLanguage} /><button className="topbar-signout" aria-label={t.signOut} title={t.signOut} onClick={onSignOut}><LogOut size={17} /></button><div className="topbar-avatar">{user.name?.slice(0, 1) || 'M'}</div></div></header>
      <div className="dashboard-content">{loadError && <div className="form-error" role="alert">{loadError}<button className="secondary-button" onClick={refresh}>Try again</button></div>}{loading && !data ? <div className="loading-screen"><div className="loader-ring" />{t.loading}</div> : data ? <>
        {activeSection === 'overview' && <OverviewPage user={user} data={data} permissions={permissions} setActiveSection={setActiveSection} />}
        {activeSection === 'songs' && <SongsPage data={data} canManage={can('songs.manage')} t={t} run={run} busy={busy} setDialog={setDialog} />}
        {activeSection === 'orders' && <OrdersPage language={language} data={data} canManage={can('orders.manage')} t={t} run={run} busy={busy} />}
        {activeSection === 'service' && <ServicePage data={data} canManage={can('service.manage')} t={t} run={run} busy={busy} />}
        {activeSection === 'members' && <MembersPage data={data} canAdjust={can('members.adjust')} canEnroll={can('members.enroll')} t={t} search={search} setSearch={setSearch} run={run} busy={busy} setDialog={setDialog} />}
        {activeSection === 'menu' && <MenuAdminPage data={data} canManage={can('menu.manage')} t={t} run={run} busy={busy} />}
        {activeSection === 'staff' && <StaffPage data={data} role={user.role} userId={user.id} t={t} run={run} busy={busy} setDialog={setDialog} />}
        {activeSection === 'tables' && <TablesPage data={data} t={t} />}
        {activeSection === 'permissions' && user.role === 'owner' && <PermissionsPage data={data} t={t} busy={busy} run={run} />}
      </> : null}</div>
    </main>
    {dialog && <ActionDialog config={dialog} t={t} onClose={() => { if (!busy) setDialog(null) }} onSubmit={(action) => run(action)} busy={busy} />}
  </div>
}

function OverviewPage({ user, data, permissions, setActiveSection }) {
  const songCount = data?.songs?.filter((x) => x.status === 'pending').length || 0
  const orderCount = data?.orders?.filter((x) => !['served', 'cancelled'].includes(x.status)).length || 0
  const serviceCount = data?.services?.filter((x) => x.status === 'open').length || 0
  const modules = [
    { key: 'songs', label: 'Song requests', value: songCount, unit: 'waiting for a decision', icon: Music2, tone: 'gold', permission: 'songs.view' },
    { key: 'orders', label: 'Active orders', value: orderCount, unit: 'on the floor', icon: ShoppingBag, tone: 'blue', permission: 'orders.view' },
    { key: 'service', label: 'Table requests', value: serviceCount, unit: 'need attention', icon: Bell, tone: 'rose', permission: 'service.view' },
  ].filter((x) => permissions.includes(x.permission))
  return <div className="page-stack"><div className="page-heading-row"><div><span className="section-eyebrow">{roleLabels[user.role]}</span><h1>{`Welcome back, ${user.name?.split(' ')[0] || roleLabels[user.role]}.`}</h1><p>Orders, song requests and table calls in one place.</p></div><div className="live-session-pill"><span className="live-dot" />Live music</div></div>
    <div className={`summary-grid summary-${modules.length}`}>{modules.map(({ key, label, value, unit, icon: Icon, tone }) => <button className="summary-card" key={key} onClick={() => setActiveSection(key)}><div className="summary-card-top"><span className={`summary-icon ${tone}`}><Icon size={18} /></span><ArrowUpRight size={16} /></div><strong>{value}</strong><span className="summary-label">{label}</span><small>{unit}</small></button>)}</div>
    <div className="overview-lower">{permissions.includes('songs.view') && <section className="surface-card overview-queue"><div className="card-title-row"><div><span className="section-eyebrow">GUEST REQUESTS</span><h2>Song queue</h2></div><button className="text-link" onClick={() => setActiveSection('songs')}>View requests<ArrowRight size={14} /></button></div>{data?.songs?.filter((x) => ['pending', 'approved', 'singing'].includes(x.status)).slice(0, 4).map((song, i) => <div className="mini-song-row" key={song.id}><span className="song-position">{String(i + 1).padStart(2, '0')}</span><span className="mini-song-disc"><Disc3 size={17} /></span><div className="mini-song-copy"><strong>{song.title}</strong><small>{song.artist}</small></div><span className={`status-pill ${song.status}`}>{song.status}</span><span className="mini-song-table">T{song.table}</span></div>)}{!songCount && <p className="overview-empty-note">No song requests waiting.</p>}</section>}<section className="surface-card overview-quick-links"><h2>Quick links</h2>{permissions.includes('orders.view') && <button onClick={() => setActiveSection('orders')}><ShoppingBag size={17} /><span>Orders</span><strong>{orderCount}</strong><ChevronRight size={16} /></button>}{permissions.includes('service.view') && <button onClick={() => setActiveSection('service')}><Bell size={17} /><span>Table calls</span><strong>{serviceCount}</strong><ChevronRight size={16} /></button>}</section></div>
    <div className="dashboard-footnote"><span><Activity size={15} />Updates as your team works</span></div></div>
}

function SongsPage({ data, canManage, t, run, busy, setDialog }) {
  const [showAdd, setShowAdd] = useState(false)
  const rows = (data?.songs || []).filter((song) => !['sung', 'rejected', 'deleted'].includes(song.status)).sort((a, b) => b.createdAt - a.createdAt)
  return <div className="page-stack songs-page"><div className="page-heading-row"><div><h1>Song requests</h1></div>{canManage && <button className="primary-button" onClick={() => setShowAdd((x) => !x)}><Plus size={16} />{t.addSong}</button>}</div>
    {showAdd && <ValidatedForm className="add-song-form" onSubmit={(e) => { e.preventDefault(); const form = e.currentTarget; const fd = new FormData(form); const title = fd.get('title')?.toString().trim(); const artist = fd.get('artist')?.toString().trim(); if (!title || !artist) return; run(async () => { await addSingerSong({ title, artist }); form.reset(); setShowAdd(false) });  }}><div><label>Song title<input name="title" required maxLength={100} placeholder="Add a song to tonight’s set" /></label><label>Artist<input name="artist" required maxLength={100} placeholder="Artist name" /></label></div><button className="secondary-button" type="button" onClick={() => setShowAdd(false)}>{t.cancel}</button><button className="primary-button" type="submit" disabled={busy}><Plus size={15} />Add to queue</button></ValidatedForm>}
    <section className="surface-card queue-table-card"><div className="table-card-heading simple-song-heading"><h2>Guest requests <span className="count-chip">{rows.length}</span></h2></div>
      <div className="desktop-table"><table><thead><tr><th>{t.title} & artist</th><th>{t.tableCol}</th><th>{t.dedicationCol}</th><th>{t.action}</th></tr></thead><tbody>{rows.map((song) => <tr key={song.id}><td><div className="song-cell"><span className="song-disc"><Disc3 size={17} /></span><span><strong>{song.title}</strong>{song.artist && <small>{song.artist}</small>}</span></div></td><td><span className="table-chip">{song.table === '—' || song.table === 'HOUSE' ? 'House' : `Table ${song.table}`}</span></td><td className="dedication-cell">{song.dedication || <span>—</span>}</td><td><SongActions song={song} canManage={canManage} t={t} run={run} setDialog={setDialog} busy={busy} /></td></tr>)}</tbody></table>{rows.length === 0 && <EmptyState icon={Music2} title="No song requests right now." />}</div>
      <div className="mobile-song-list">{rows.map((song) => <article className="mobile-song-card" key={song.id}><div className="mobile-song-top"><span className="song-disc"><Disc3 size={18} /></span><div className="mobile-song-title"><strong>{song.title}</strong>{song.artist && <small>{song.artist}</small>}</div></div><div className="mobile-song-meta"><span className="song-table-label">{song.table === '—' || song.table === 'HOUSE' ? 'House' : `Table ${song.table}`}</span></div>{song.dedication && <p className="song-dedication">“{song.dedication}”</p>}<SongActions song={song} canManage={canManage} t={t} run={run} setDialog={setDialog} busy={busy} /></article>)}{rows.length === 0 && <EmptyState icon={Music2} title="No song requests right now." />}</div>
    </section></div>
}

function SongActions({ song, canManage, t, run, setDialog, busy }) {
  if (!canManage) return <span className="status-pill">{t[song.status] || song.status}</span>
  return <div className="row-actions"><span className="status-pill">{t[song.status] || song.status}</span>
    {song.status === 'pending' && <><button className="small-action" disabled={busy} onClick={() => run(() => updateSong(song.id, 'approve'))}>{t.approve}</button><button className="small-action" disabled={busy} onClick={() => run(() => updateSong(song.id, 'reject'))}>{t.reject}</button></>}
    {song.status === 'approved' && <button className="small-action" disabled={busy} onClick={() => run(() => updateSong(song.id, 'singing'))}>{t.startSong}</button>}
    {song.status === 'singing' && <button className="small-action" disabled={busy} onClick={() => run(() => updateSong(song.id, 'sung'))}>{t.markSung}</button>}
    <button className="icon-action delete-action song-remove-action" title="Remove request" aria-label="Remove request" disabled={busy} onClick={() => setDialog({ kind: 'confirm', title: 'Remove this song request?', description: `${song.title} will be removed from the request list.`, confirm: t.delete, danger: true, action: () => updateSong(song.id, 'delete') })}><X size={14} /><span>Remove</span></button>
  </div>
}

function OrdersPage({ data, canManage, t, run, busy, language }) {
  const orders = [...(data?.orders || [])].sort((a, b) => b.createdAt - a.createdAt)
  const dateTime = (value) => new Intl.DateTimeFormat(language === 'zh' ? 'zh-MY' : language === 'bm' ? 'ms-MY' : 'en-GB', { timeZone: 'Asia/Kuala_Lumpur', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  const active = orders.filter((order) => !['served', 'cancelled'].includes(order.status))
  return <div className="page-stack">
    <div className="page-heading-row"><div><span className="section-eyebrow">TABLE SERVICE</span><h1>{t.freshOrders}</h1><p>{t.ordersSub}</p></div></div>
    <div className="order-board-summary"><span className="order-summary-symbol"><ShoppingBag size={19} /></span><div><strong>{active.length} {t.activeOrders}</strong><span>{t.posOrderHelp}</span></div></div>
    <div className="orders-grid">{orders.map((order) => {
      const completed = order.status === 'served'
      const cancelled = order.status === 'cancelled'
      return <article className={`order-card ${order.status}`} key={order.id}>
        <div className="order-card-head"><span className="table-number-block"><small>{t.table}</small><strong>{order.table}</strong></span><div className="order-card-timing"><time dateTime={new Date(order.createdAt).toISOString()}>{dateTime(order.createdAt)} MYT</time><span className={`status-pill ${completed ? 'paid' : 'pending'}`}>{completed ? t.orderCompleted : cancelled ? t.orderCancelled : t.orderNew}</span></div></div>
        <div className="order-items">{order.items?.map((item, i) => <div key={`${item.name}-${i}`}><span><strong>{item.qty}×</strong>{item.name}</span><span>{formatMoney(item.price * item.qty)}</span></div>)}</div>
        <div className="order-total"><span>Total</span><strong>{formatMoney(order.items?.reduce((sum, x) => sum + x.price * x.qty, 0) || 0)}</strong></div>
        {completed && <p className="order-completion-note">{t.completedBy} {order.completedByName || t.staffMember}{order.completedAt ? ` · ${dateTime(order.completedAt)} MYT` : ''}</p>}
        {canManage && !completed && !cancelled && <div className="order-actions"><button className="small-action" disabled={busy} aria-busy={busy} onClick={() => run(() => updateOrder(order.id, { status: 'served' }))}><Check size={14} />{busy ? t.loading : t.markCompleted}</button></div>}
      </article>
    })}</div>
    {orders.length === 0 && <EmptyState icon={ShoppingBag} title={t.noOrders} />}
  </div>
}

function ServicePage({ data, canManage, t, run, busy }) {
  const services = [...(data?.services || [])].sort((a, b) => b.createdAt - a.createdAt)
  const open = services.filter((x) => x.status === 'open')
  const done = services.filter((x) => x.status !== 'open')
  return <div className="page-stack"><div className="page-heading-row"><div><span className="section-eyebrow">GUEST REQUESTS</span><h1>{t.serviceTitle}</h1><p>{t.serviceSub}</p></div><span className="open-count"><span className="live-dot" />{open.length} open</span></div><section className="service-request-list">{open.map((item) => <article className="service-request-card" key={item.id}><div className={`request-type-icon ${item.type.includes('water') ? 'water' : item.type.includes('bill') ? 'bill' : 'call'}`}>{item.type.includes('water') ? <GlassWater size={19} /> : item.type.includes('bill') ? <Wallet size={19} /> : <Bell size={19} />}</div><div className="service-request-main"><span className="section-eyebrow">TABLE {item.table} · {timeAgo(item.createdAt)}</span><h3>{item.type}</h3></div>{canManage && <button className="secondary-button" disabled={busy} onClick={() => run(() => updateService(item.id, 'done'))}><Check size={15} />{t.closeRequest}</button>}</article>)}{!open.length && <EmptyState icon={CheckCircle2} title={t.noService} />}</section>{done.length > 0 && <section className="completed-requests"><div className="section-eyebrow">RECENTLY COMPLETED</div>{done.slice(0, 4).map((item) => <div key={item.id}><CheckCircle2 size={15} /><span>{item.type}</span><strong>Table {item.table}</strong><small>{timeAgo(item.createdAt)}</small></div>)}</section>}</div>
}

function MembersPage({ data, canAdjust, canEnroll, t, search, setSearch, run, busy, setDialog }) {
  const [selectedMember, setSelectedMember] = useState(null)
  useModalFocus(Boolean(selectedMember), () => setSelectedMember(null), '.member-detail-dialog')
  const [storedDetails, setStoredDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const members = (data?.members || []).filter((m) => `${m.name} ${m.phone}`.toLowerCase().includes(search.toLowerCase()))
  const openAdjust = (member) => setDialog({ kind: 'adjust-member', title: `Adjust ${member.name}`, member, action: (body) => adjustMember(member, body.kind, body.delta, body.reason, body) })
  const openResetPin = (member) => setDialog({ kind: 'reset-pin', title: `Reset ${member.name}’s PIN`, member, action: (body) => adminAction('reset-member-pin', { id: member.id, pin: body.pin }) })
  const memberAvatar = (member, index) => <span className={`member-avatar member-color-${index % 5}`}>{member.name?.split(' ').map((x) => x[0]).slice(0, 2).join('')}</span>
  const openDetails = (member) => { setSelectedMember(member); setStoredDetails(null); setDetailsError(''); setDetailsLoading(true); getMemberStoredItems(member.id).then(setStoredDetails).catch((error) => setDetailsError(error.message || 'Unable to load stored item history.')).finally(() => setDetailsLoading(false)) }
  const itemTypeLabel = (type) => ({ draught: 'Draught beer', bottle: 'Bottled beer', whisky: 'Whisky', spirit: 'Liquor / spirits', other: 'Other' }[type] || type)
  const itemUnitLabel = (type) => type === 'draught' ? 'mugs' : 'bottles / items'
  const dateLabel = (value) => value ? new Intl.DateTimeFormat('en-MY', { timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : '—'
  return <div className="page-stack"><div className="page-heading-row"><div><span className="section-eyebrow">MEMBERSHIP</span><h1>{t.memberDirectory}</h1><p>{t.memberSub}</p></div>{canEnroll && <button className="primary-button" onClick={() => setDialog({ kind: 'enroll-member', title: t.enrollMember, action: (body) => adminAction('enroll-member', body) })}><Plus size={16} />{t.enrollMember}</button>}</div>
    <div className="member-controls"><label className="search-field"><Search size={17} /><input placeholder={t.searchMember} value={search} onChange={(e) => setSearch(e.target.value)} /><button aria-label="Clear search" className={search ? '' : 'hidden'} onClick={() => setSearch('')}><X size={14} /></button></label><div className="member-count-label"><Users size={15} />{members.length} members</div></div>
    <section className="surface-card member-table-card"><div className="desktop-table"><table><thead><tr><th>MEMBER</th><th>PHONE</th><th>STATUS</th><th>{t.action}</th></tr></thead><tbody>{members.map((member, i) => <tr key={member.id}><td><button className="member-name-cell member-open-button" onClick={() => openDetails(member)} aria-label={`View ${member.name}'s profile`}>{memberAvatar(member, i)}<strong>{member.name}</strong><ChevronRight size={15} /></button></td><td className="phone-cell">{member.phone}</td><td><span className={`account-status ${member.active ? 'active' : ''}`}><i />{member.active ? t.active : t.inactive}</span></td><td><div className="staff-actions">{canAdjust && <button className="icon-action" title="Adjust balances" aria-label={`Adjust ${member.name}`} onClick={() => openAdjust(member)}><SlidersHorizontal size={15} /></button>}{canEnroll && <button className="text-link" onClick={() => openResetPin(member)}>Reset PIN</button>}{!canAdjust && !canEnroll && <span className="muted-inline">{t.viewOnly}</span>}</div></td></tr>)}</tbody></table>{members.length === 0 && <EmptyState icon={Users} title={t.noMembers} />}</div>
      <div className="mobile-member-list">{members.map((member, i) => <article className="mobile-member-card" key={member.id}>
        <div className="mobile-member-head"><button className="mobile-member-identity member-open-button" onClick={() => openDetails(member)} aria-label={`View ${member.name}'s profile`}>{memberAvatar(member, i)}<div><strong>{member.name}</strong><div className="mobile-member-contact"><small>{member.phone}</small><span className={`account-status ${member.active ? 'active' : ''}`}><i />{member.active ? t.active : t.inactive}</span></div></div><ChevronRight size={15} /></button>
          {(canAdjust || canEnroll) && <div className="mobile-member-actions">{canAdjust && <button className="mobile-member-adjust" aria-label={`Adjust ${member.name} balances`} title="Adjust balances" onClick={() => openAdjust(member)}><SlidersHorizontal size={15} /></button>}{canEnroll && <button className="mobile-member-reset" onClick={() => openResetPin(member)}>Reset PIN</button>}</div>}
        </div>
      </article>)}{members.length === 0 && <EmptyState icon={Users} title={t.noMembers} />}</div>
    </section>{!canAdjust && <div className="dashboard-footnote"><span><Shield size={15} />{t.lookupOnly}</span><span>Member balances are private to managers and owners</span></div>}
    {selectedMember && <div className="modal-backdrop member-detail-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedMember(null) }}><section className="member-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="member-detail-title"><button className="dialog-close" onClick={() => setSelectedMember(null)} aria-label="Close member details"><X size={18} /></button><header className="member-detail-header">{memberAvatar(selectedMember, members.findIndex((member) => member.id === selectedMember.id))}<div><span className="section-eyebrow">MEMBER PROFILE</span><h2 id="member-detail-title">{selectedMember.name}</h2><p>{selectedMember.phone}</p></div><span className={`account-status ${selectedMember.active ? 'active' : ''}`}><i />{selectedMember.active ? t.active : t.inactive}</span></header>
      {canAdjust ? <><div className="member-detail-balances"><div><span>{t.points}</span><strong>{selectedMember.points ?? 0}</strong></div><div><span>Stored drinks</span><strong>{detailsLoading ? '…' : (storedDetails?.batches || []).filter(batch => !batch.expiresAt || batch.expiresAt > Date.now()).reduce((sum, batch) => sum + Number(batch.quantityRemaining || 0), 0)} <small>items</small></strong></div></div>
        <section className="member-detail-section"><div className="member-detail-section-heading"><h3>Stored drinks</h3><span>Current balance</span></div>{detailsLoading ? <p className="member-detail-empty">Loading balances…</p> : detailsError ? <p className="member-detail-empty" role="alert">{detailsError}</p> : <>{(storedDetails?.batches || []).filter((batch) => batch.quantityRemaining > 0 && (!batch.expiresAt || batch.expiresAt > Date.now())).length ? <div className="member-detail-drinks">{storedDetails.batches.filter((batch) => batch.quantityRemaining > 0 && (!batch.expiresAt || batch.expiresAt > Date.now())).map((batch) => <div className="member-detail-drink" key={batch.id}><div><strong>{batch.itemName}</strong><small>{itemTypeLabel(batch.itemType)} · Stored {dateLabel(batch.storedAt).split(',')[0]}{batch.expiresAt ? ` · Expires ${dateLabel(batch.expiresAt).split(',')[0]}` : ''}</small></div><b>{batch.quantityRemaining} <small>{itemUnitLabel(batch.itemType)}</small></b></div>)}</div> : <p className="member-detail-empty">No stored drinks.</p>}{(storedDetails?.legacyCount || selectedMember.legacyBeer || 0) > 0 && <p className="member-detail-legacy">{storedDetails?.legacyCount || selectedMember.legacyBeer} unclassified legacy items</p>}</>}</section>
        <section className="member-detail-section"><div className="member-detail-section-heading"><h3>Recent transactions</h3><span>Latest 50</span></div>{detailsLoading ? <p className="member-detail-empty">Loading transactions…</p> : detailsError ? null : storedDetails?.transactions?.length ? <div className="member-detail-transactions">{storedDetails.transactions.map((entry) => <article key={entry.id}><span className={`member-detail-transaction-mark ${entry.transactionType}`}>{entry.transactionType === 'in' ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}</span><div><strong>{entry.itemName}</strong><small>{entry.transactionType === 'in' ? 'Stored in' : 'Taken out'} · {itemTypeLabel(entry.itemType)} · {dateLabel(entry.createdAt)}</small>{entry.reason && <small>{entry.reason}</small>}</div><b className={entry.transactionType}>{entry.transactionType === 'in' ? '+' : '−'}{entry.quantity} {itemUnitLabel(entry.itemType)}</b></article>)}</div> : <p className="member-detail-empty">No transactions recorded.</p>}</section></> : <p className="member-detail-restricted"><Shield size={16} />Balances are available to managers and owners.</p>}
      <footer className="member-detail-footer"><button className="secondary-button" onClick={() => setSelectedMember(null)}>{t.close || 'Close'}</button>{canAdjust && <button className="primary-button" onClick={() => { setSelectedMember(null); openAdjust(selectedMember) }}><SlidersHorizontal size={15} />Adjust balances</button>}</footer></section></div>}
  </div>
}


function malaysiaInput(value) { return value ? new Date(Date.parse(value) + 8 * 3600000).toISOString().slice(0, 16) : '' }
function EventMenuControl({ event, canManage, busy, run }) {
  const [draft, setDraft] = useState(null)
  const value = draft || event
  if (!value) return <section className="surface-card event-settings">Event settings unavailable. Apply the event-menu database migration to enable this feature.</section>
  const change = (key, next) => setDraft(current => ({ ...(current || event), [key]: next }))
  return <section className="surface-card event-settings"><div><span className="section-eyebrow">SPECIAL EVENT</span><h2>{event.name}</h2><p>Replaces regular food with 5 mains and 8 side dishes. Draught beer, bottle beer, spirits and mocktails stay unchanged.</p><strong>{eventIsActive(event) ? 'Event menu is visible' : 'Regular menu is visible'}</strong></div>
    <ValidatedForm onSubmit={async e => { e.preventDefault(); if (await run(() => saveMenuEvent(value))) setDraft(null) }}>
      <fieldset disabled={!canManage || busy}><label className="event-name-field">Event name<input type="text" required maxLength={80} value={value.name} onChange={e => change('name', e.target.value)} placeholder="e.g. Halloween Night, Christmas Eve" /></label><label className="event-check"><input type="checkbox" checked={value.enabled} onChange={e => change('enabled', e.target.checked)} />Enable event menu</label>
      <p>Leave dates empty to switch manually. Optional dates use Malaysia time (UTC+8); the end time is exclusive.</p>
      <div className="event-date-fields"><label>Starts at (optional)<input type="datetime-local" value={malaysiaInput(value.starts_at)} onChange={e => change('starts_at', e.target.value ? new Date(e.target.value + ':00+08:00').toISOString() : null)} /></label><label>Ends at (optional)<input type="datetime-local" value={malaysiaInput(value.ends_at)} onChange={e => change('ends_at', e.target.value ? new Date(e.target.value + ':00+08:00').toISOString() : null)} /></label></div>
      <p>Cocktails and non-alcoholic drinks are pending. Enable each when confirmed.</p>
      <label className="event-check"><input type="checkbox" checked={value.include_cocktails} onChange={e => change('include_cocktails', e.target.checked)} />Include existing cocktails during event</label>
      <label className="event-check"><input type="checkbox" checked={value.include_soft} onChange={e => change('include_soft', e.target.checked)} />Include existing non-alcoholic drinks during event</label>
      {canManage && <button className="primary-button" disabled={busy || !draft} type="submit">{busy ? 'Saving...' : 'Save event settings'}</button>}
      </fieldset>
    </ValidatedForm></section>
}

function MenuAdminPage({ data, canManage, t, run, busy }) {
  const items = data?.menu || []
  return <div className="page-stack"><div className="page-heading-row"><div><span className="section-eyebrow">GUEST MENU · AVAILABILITY</span><h1>{t.menuControl}</h1><p>{t.menuSub}</p></div>{canManage && <span className="readiness-pill"><span className="live-dot" />Guest menu live</span>}</div><EventMenuControl event={data?.menuEvent} canManage={canManage} busy={busy} run={run} /><section className="surface-card menu-admin-card"><div className="menu-admin-head"><div><h2>Menu items</h2><p>Availability updates immediately on the guest page.</p></div><span>{items.length} items</span></div>{items.map((item, i) => <div className="menu-admin-row" key={item.id}><div className="menu-admin-thumb">{item.image ? <img src={item.image} alt="" /> : ['draught', 'bottle', 'spirits'].includes(item.category) ? <Beer size={19} /> : <Utensils size={19} />}</div><div className="menu-admin-copy"><strong>{item.name}</strong><small>{item.eventId ? `${data?.menuEvent?.name || "Special event"} · ` : "Regular · "}{item.category} · {formatMoney(item.price)}</small></div><span className={`menu-availability ${item.available ? 'on' : 'off'}`}>{item.available ? t.available : t.soldOut}</span><button className={`toggle-switch ${item.available ? 'on' : ''}`} role="switch" aria-checked={item.available} aria-label={`${item.available ? 'Disable' : 'Enable'} ${item.name}`} disabled={!canManage || busy} onClick={() => run(() => saveMenuAvailability(item.id, !item.available))}><span /></button></div>)}</section>{!canManage && <div className="dashboard-footnote"><Shield size={14} />View-only menu access</div>}</div>
}

function StaffPage({ data, role, userId, t, run, busy, setDialog }) {
  const staff = data?.staff || []
  return <div className="page-stack"><div className="page-heading-row"><div><span className="section-eyebrow">VENUE ACCESS</span><h1>{t.teamTitle}</h1><p>{t.teamSub}</p></div><button className="primary-button" onClick={() => setDialog({ kind: 'add-staff', title: t.addStaff, role, action: (body) => adminAction('add-staff', body) })}><Plus size={16} />{t.addStaff}</button></div><div className="staff-access-note"><Shield size={16} /><span><strong>Each person uses their own account.</strong> Bosses can manage accounts, but only the owner can change roles or permissions.</span></div><section className="surface-card staff-table-card"><div className="desktop-table"><table><thead><tr><th>TEAM MEMBER</th><th>USER ID</th><th>ROLE</th><th>STATUS</th><th>{t.action}</th></tr></thead><tbody>{staff.map((item) => <tr key={item.id}><td><div className="member-name-cell"><span className={`profile-avatar avatar-${item.role}`}>{item.name?.slice(0, 1)}</span><strong>{item.name}</strong></div></td><td className="phone-cell">{item.loginId || (!isLive ? item.role : '—')}</td><td><span className={`role-tag role-${item.role}`}>{roleLabels[item.role]}</span></td><td><span className={`account-status ${item.active ? 'active' : ''}`}><i />{item.active ? t.active : t.inactive}</span></td><td>{item.id !== userId && (role === 'owner' || (item.role !== 'owner' && item.role !== 'boss')) && <div className="staff-actions">{role === 'owner' && <select disabled={busy} aria-label={`Change ${item.name}'s role`} value={item.role} onChange={(e) => { const nextRole = e.target.value; setDialog({ kind: 'confirm', title: `Change ${item.name}'s role?`, description: `Their access will change from ${roleLabels[item.role]} to ${roleLabels[nextRole]}.`, confirm: 'Change role', action: () => adminAction('set-staff-role', { id: item.id, role: nextRole }) }) }}>{roles.map((x) => <option value={x} key={x}>{roleLabels[x]}</option>)}</select>}<button className="text-link" disabled={busy} onClick={() => setDialog({ kind: 'confirm', title: `${item.active ? 'Deactivate' : 'Activate'} ${item.name}?`, description: item.active ? 'They will no longer be able to use the staff dashboard.' : 'They will be able to sign in with their assigned role.', confirm: item.active ? t.deactivate : t.activate, action: () => adminAction('toggle-staff', { id: item.id, active: !item.active }) })}>{item.active ? t.deactivate : t.activate}</button></div>}</td></tr>)}</tbody></table></div></section></div>
}

function PermissionsPage({ data, t, busy, run }) {
  const editableRoles = roles.filter((x) => x !== 'owner')
  const saved = data?.permissionRows || []
  function enabled(role, key) {
    const row = saved.find((x) => x.role === role && x.permission_key === key)
    if (row) return row.enabled
    return isLive ? false : (data?.permissions?.[role] || []).includes(key)
  }
  const groups = [
    { name: 'Guest operations', permissions: ['orders.view', 'orders.manage', 'songs.view', 'songs.manage', 'service.view', 'service.manage'] },
    { name: 'Venue setup', permissions: ['menu.view', 'menu.manage', 'tables.manage'] },
    { name: 'Membership', permissions: ['members.lookup', 'members.enroll', 'members.adjust'] },
    { name: 'Administration', permissions: ['staff.manage', 'permissions.manage'] },
  ]
  return <div className="page-stack"><div className="page-heading-row"><div><span className="section-eyebrow">OWNER CONTROLS</span><h1>{t.permissionsTitle}</h1><p>{t.permissionsSub}</p></div><span className="owner-only-pill"><Crown size={14} />Owner only</span></div><div className="permission-callout"><Shield size={18} /><div><strong>Owner always keeps full access.</strong><span>Changes apply to backend data access and dashboard sections. Only the owner can edit this matrix.</span></div></div><section className="permission-matrix surface-card"><div className="permission-matrix-head"><span>CAPABILITY</span>{editableRoles.map((role) => <span key={role}>{roleLabels[role]}</span>)}</div>{groups.map((group) => <div className="permission-group" key={group.name}><div className="permission-group-title">{group.name}</div>{group.permissions.map((key) => <div className="permission-row" key={key}><div><strong>{permissionLabels[key]}</strong></div>{editableRoles.map((role) => <label className="permission-cell" key={role}><span className="sr-only">{roleLabels[role]}: {permissionLabels[key]}</span><input type="checkbox" checked={enabled(role, key)} disabled={busy || key === 'permissions.manage'} onChange={(e) => run(() => savePermission(role, key, e.target.checked))} /></label>)}</div>)}</div>)}<div className="permission-matrix-foot"><Shield size={14} />Boss account administration does not include role or permission grants.</div></section></div>
}

function TablesPage({ data, t }) {
  const tables = data?.tables?.length ? data.tables : (data?.tables || []).map((code) => ({ code }))
  const fallback = ['02', '03', '05', '07', '08', '09', '10', '11', '12']
  const rows = tables.length ? tables : isLive ? [] : fallback.map((code) => ({ code }))
  const tableValue = (row) => typeof row === 'string' ? row : row.code || row.table_code
  const [selected, setSelected] = useState(tableValue(rows[0]) || '08')
  const qrUrl = `${window.location.origin}/menu?table=${encodeURIComponent(selected)}`
  return <div className="page-stack"><div className="page-heading-row"><div><span className="section-eyebrow">TABLE IDENTITY</span><h1>{t.tablesTitle}</h1><p>{t.tablesSub}</p></div><span className="readiness-pill"><QrCode size={15} />{rows.length} table codes</span></div><div className="qr-manager-layout"><section className="surface-card qr-table-list"><div className="menu-admin-head"><div><h2>Tables</h2><p>Choose a table to preview its QR.</p></div></div><div className="table-code-grid">{rows.map((row) => { const code = tableValue(row); return <button className={selected === code ? 'active' : ''} key={code} onClick={() => setSelected(code)}><span className="table-mini-icon"><QrCode size={17} /></span><span><small>TABLE</small><strong>{code}</strong></span><ChevronRight size={15} /></button> })}</div></section><section className="qr-preview-card"><div className="qr-preview-top"><span className="section-eyebrow">TABLE {selected}</span><span className="qr-status"><i />Active</span></div><div className="qr-code-frame"><QRCodeSVG value={qrUrl} size={196} bgColor="#faf7f0" fgColor="#171511" level="H" includeMargin /></div><h2>Scan to order</h2><p>Menu, song requests and service — all at this table.</p><a href={qrUrl} className="secondary-button" target="_blank" rel="noreferrer">{t.openQr}<ArrowUpRight size={15} /></a><div className="qr-url-label">{qrUrl}</div></section></div></div>
}

function ActionDialog({ config, t, onClose, onSubmit, busy }) {
  useModalFocus(true, onClose, '.action-dialog')
  const [kind, setKind] = useState('points')
  const [itemType, setItemType] = useState('draught')
  const [itemName, setItemName] = useState(storedDrinkCatalog.find((item) => item.type === 'draught')?.name || '')
  const [error, setError] = useState('')
  const drinkOptions = storedDrinkCatalog.filter((item) => item.type === itemType)
  function submit(e) { e.preventDefault(); const form = e.currentTarget; const fd = new FormData(form); const body = Object.fromEntries(fd.entries());
    if (config.kind === 'adjust-member') { const amount = Number(body.amount); if (!amount || amount < 1 || !body.reason?.trim() || (kind === 'stored' && !body.itemName)) { setError('Choose a drink, enter a positive amount and add a note.'); return } const signed = body.direction === 'subtract' ? -amount : amount; onSubmit(() => config.action({ kind, delta: signed, reason: body.reason.trim(), itemType: body.itemType, itemName: body.itemName })); return }
    if (config.kind === 'enroll-member' || config.kind === 'add-staff' || config.kind === 'reset-pin') { if (!/^[0-9]{6}$/.test(body.pin || '')) { setError('PIN must be exactly 6 digits.'); return } }
    onSubmit(() => config.action(body))
  }
  if (config.kind === 'confirm') return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}><div className="action-dialog" role="dialog" aria-modal="true" aria-label={config.title}><button aria-label={t.close} disabled={busy} className="dialog-close" onClick={onClose}><X size={18} /></button><span className="dialog-icon danger"><X size={18} /></span><h2>{config.title}</h2><p>{config.description}</p><div className="dialog-actions"><button className="secondary-button" onClick={onClose}>{t.cancel}</button><button disabled={busy} className="primary-button danger-button" onClick={() => onSubmit(config.action)}>{config.confirm}</button></div></div></div>
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}><ValidatedForm className="action-dialog" role="dialog" aria-modal="true" aria-label={config.title} onSubmit={submit}><button type="button" aria-label={t.close} disabled={busy} className="dialog-close" onClick={onClose}><X size={18} /></button><span className="dialog-icon"><Settings2 size={18} /></span><h2>{config.title}</h2>
    {config.kind === 'adjust-member' && <><p>Record every storage and collection so the member can see the item, quantity and date.</p><div className="dialog-segment"><button type="button" className={kind === 'points' ? 'active' : ''} onClick={() => setKind('points')}><Ticket size={14} />Points</button><button type="button" className={kind === 'stored' ? 'active' : ''} onClick={() => setKind('stored')}><Beer size={14} />Stored drinks</button></div>{kind === 'stored' && <div className="form-row"><label>Drink type<select name="itemType" value={itemType} onChange={(event) => { const nextType = event.target.value; setItemType(nextType); setItemName(storedDrinkCatalog.find((item) => item.type === nextType)?.name || '') }}><option value="draught">Draught beer</option><option value="bottle">Bottled beer</option><option value="whisky">Whisky</option><option value="spirit">Liquor / spirits</option></select></label><label>Drink name<select name="itemName" value={itemName} onChange={(event) => setItemName(event.target.value)} required>{drinkOptions.map((item) => <option key={`${item.type}-${item.name}`} value={item.name}>{item.name}</option>)}</select></label></div>}{kind === 'stored' && <small className="stored-expiry-hint">Choose the same drink when it is taken out. Draught beer expires one month after storage.</small>}<div className="form-row"><label>{kind === 'stored' ? 'Transaction' : 'Action'}<select name="direction"><option value="add">{kind === 'stored' ? 'Stored in' : 'Add to balance'}</option><option value="subtract">{kind === 'stored' ? 'Taken out' : 'Deduct from balance'}</option></select></label><label>{kind === 'stored' ? 'Quantity' : 'Amount'}<input name="amount" type="number" min="1" step="1" required placeholder={kind === 'stored' ? 'e.g. 5' : 'e.g. 20'} /></label></div>{kind === 'points' && <label>{t.reason}<input name="reason" maxLength={180} required placeholder="Purchase, redemption, correction…" /></label>}{kind === 'stored' && <label>Note<input name="reason" maxLength={180} required placeholder="Storage, collection, correction…" /></label>}</>}
    {config.kind === 'enroll-member' && <><p>Confirm the member in person before creating an account. They choose their PIN with staff present.</p><label>{t.fullName}<input name="name" required maxLength={100} placeholder="Member name" /></label><label>{t.phone}<input name="phone" required type="tel" placeholder="01X XXX XXXX" /></label><label>{t.newPin}<input name="pin" type="password" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required placeholder="6 digits" /></label></>}
    {config.kind === 'reset-pin' && <><p>Confirm the member in person before setting a new PIN. The change applies immediately.</p><label>{t.newPin}<input name="pin" type="password" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required placeholder="6 digits" autoFocus /></label></>}
    {config.kind === 'add-staff' && <><p>Create a personal account. Staff sign in using their assigned user ID and passcode.</p><label>{t.fullName}<input name="name" required maxLength={100} placeholder="Team member name" /></label><label>{t.staffUserId}<input name="loginId" required autoComplete="off" autoCapitalize="none" spellCheck={false} pattern="[a-zA-Z][a-zA-Z0-9._-]{2,31}" minLength={3} maxLength={32} placeholder="e.g. aden" /></label><label>{t.staffPasscode}<input name="pin" type="password" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required placeholder="6 digits" /></label>{config.role === 'owner' && <label>{t.role}<select name="role" defaultValue="staff">{roles.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}</select></label>}</>}
    {error && <div className="form-error" role="alert">{error}</div>}<div className="dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>{t.cancel}</button><button className="primary-button" disabled={busy}><Check size={15} />{t.save}</button></div>
  </ValidatedForm></div>
}

function EmptyState({ icon: Icon, title }) { return <div className="empty-state"><span><Icon size={20} /></span><strong>{title}</strong></div> }

export default App
