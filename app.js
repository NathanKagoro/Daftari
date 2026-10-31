/* Daftari – offline sales book. Data lives on the device (IndexedDB) and syncs to a Google Sheet when online. */
(() => {
'use strict';
const VERSION = '2.3.0';
const DEFAULT_URL = String((window.DAFTARI_CONFIG || {}).syncUrl || '').trim();   // built-in sync link, set in config.js
const $ = s => document.querySelector(s);
const TABLES = ['products', 'customers', 'sales', 'purchases', 'losses', 'meta'];
const METHODS = ['Cash', 'M-Pesa', 'Mixx by Yas (Tigo Pesa)', 'Airtel Money', 'HaloPesa', 'Bank'];
const REASONS = ['Spoiled', 'Damaged in transit', 'Missing or stolen', 'Customer never paid', 'Other'];
const PERIODS = ['week', 'month', 'lastmonth', 'year', 'all'];
const DEFAULT_ALLOC = [{ id: 'tithe', key: 'tithe', pct: 10 }, { id: 'reinvest', key: 'reinvest', pct: 35 }, { id: 'personal', key: 'personal', pct: 30 }, { id: 'savings', key: 'savings', pct: 25 }];
const DERIVED = ['productName', 'customerName', 'total', 'lossValue', '_synced'];

/* ======================= language ======================= */
const I18N = {
en: {
  app_sub: 'Sales book', nav_home: 'Overview', nav_sales: 'Sales', nav_costs: 'Costs', nav_customers: 'Customers', nav_more: 'More',
  sync_ok: 'Synced', sync_off: 'Offline', sync_busy: 'Syncing', sync_none: 'Not linked', sync_err: 'Sync error',
  tutorial: 'Tutorial', period: 'Period', home_title: 'How business is going',
  p_week: 'This week', p_month: 'This month', p_lastmonth: 'Last month', p_year: 'This year', p_all: 'All time',
  r_week: d => 'This week, from Monday ' + d, r_month: m => m + ', so far', r_year: y => y + ', so far', r_all: 'Everything recorded',
  start_title: 'Start here', start_1: 'Add the products you sell, each with its own price.', start_2: 'Record what you buy under Costs, so the profit is right.', start_3: 'Record each sale. The profit works itself out.',
  add_product: 'Add a product', take_tour: 'Show me around',
  k_profit: 'Profit', k_sales: 'Sales', k_units: 'Items sold', k_owed: 'Owed to you',
  per_item: v => 'About ' + v + ' per item sold', no_sales_yet: 'No sales in this period', n_sales: c => c + (c === 1 ? ' sale' : ' sales'),
  avg_each: v => 'Average ' + v + ' each', n_unpaid: c => c + (c === 1 ? ' unpaid sale' : ' unpaid sales') + ', all time', all_paid: 'Everyone has paid',
  ledger_title: 'How the profit is worked out', l_sales: 'Sales', l_cogs: q => 'Cost of the ' + q + ' items sold, with transport', l_losses: 'Losses', l_profit: 'Profit',
  no_cost_warn: names => 'No cost is recorded for: ' + names + '. Their profit looks higher than it is. Add a purchase under Costs, or a usual cost on the product.',
  alloc_title: 'Where the profit goes', change: 'Change', alloc_none: 'There is no profit to share in this period.',
  al_tithe: 'Tithe', al_reinvest: 'Reinvest in the business', al_personal: 'Personal use', al_savings: 'Savings',
  chart_title: u => 'Sales and profit ' + u, u_day: 'per day', u_month: 'per month', u_year: 'per year', lg_sales: 'Sales', lg_profit: 'Profit',
  chart_tip: (d, s, p) => d + ': sales ' + s + ', profit ' + p,
  byprod_title: 'By product', th_product: 'Product', th_qty: 'Qty', th_sales: 'Sales', th_profit: 'Profit',
  owed_title: 'Not paid yet', owed_none: 'Nothing is owed. Every sale is paid.', mark_paid: 'Mark paid',
  due_title: 'Customers to call', due_hint: 'Regulars who are due or late for their usual order.', due_none: 'No regulars are due right now.',
  due_meta: (g, s) => 'Usually every ' + g + ' days · last bought ' + s, call: 'Call', whatsapp: 'WhatsApp',
  today: 'today', yesterday: 'yesterday', days_ago: d => d + ' days ago',
  sales_title: 'Sales', new_sale: 'New sale', edit_sale: 'Edit sale', search_sales: 'Search product, customer or note',
  no_customer: 'No customer', no_product: 'Product removed', paid: 'Paid', unpaid: 'Not paid', edit: 'Edit',
  sales_empty: 'No sales yet. Tap “New sale” to record your first one.', no_match: 'Nothing matches that search.', show_more: 'Show more',
  costs_title: 'Costs', tab_purchases: 'Purchases', tab_losses: 'Losses', new_purchase: 'New purchase', edit_purchase: 'Edit purchase', new_loss: 'New loss', edit_loss: 'Edit loss',
  purchases_empty: 'No purchases yet. Record what you buy so the profit is right.', losses_empty: 'No losses recorded.',
  p_meta: (c, tr, l) => c + ' each · transport ' + tr + ' · ' + l + ' each with transport', other_money: v => 'other money ' + v,
  customers_title: 'Customers', new_customer: 'New customer', edit_customer: 'Edit customer', search_customers: 'Search name, phone or area',
  customers_empty: 'No customers yet. Add one here, or while recording a sale.',
  c_meta: (o, s) => o + (o === 1 ? ' order' : ' orders') + ' · ' + s + ' spent', c_last: s => 'Last bought ' + s,
  f_none: 'No orders yet', f_new: 'New', f_weekly: 'Weekly', f_2weeks: 'Every 2 weeks', f_monthly: 'Monthly', f_rare: 'Now and then', d_late: 'Late', d_due: 'Due now',
  more_title: 'More', products: 'Products', n_products: c => c + (c === 1 ? ' product' : ' products'), alloc_menu: 'Profit split', business: 'Business name', business_none: 'Not set',
  language: 'Language', sync_menu: 'Google Sheet copy', sync_menu_none: 'Not linked yet. Your data is on this phone only.', sync_menu_ok: s => 'Last synced ' + s, sync_menu_wait: c => c + ' changes waiting to sync',
  backup: 'Download a backup file', backup_sub: 'Saves everything to a file on this phone.', restore: 'Restore from a backup file', restore_sub: 'Adds the records from a backup file.',
  restored: c => c + ' records restored', restore_bad: 'That file is not a Daftari backup.', version: 'Version',
  products_title: 'Products', back: 'Back', new_product: 'New product', edit_product: 'Edit product', products_empty: 'No products yet. Add what you sell, each with its own price.',
  pr_meta: (c, m) => 'Costs you ' + c + ' · you keep ' + m, pr_nocost: 'No cost recorded yet', hidden: 'Hidden', per: 'per',
  date: 'Date', product: 'Product', customer: 'Customer', qty: 'Quantity', unit_price: 'Price each (TZS)', total: 'Total', method: 'Paid with', payment: 'Payment', pay_yes: 'Paid', pay_no: 'Not paid yet',
  notes: 'Notes', m_cash: 'Cash', m_bank: 'Bank', name: 'Name', phone: 'Phone / WhatsApp', area: 'Area',
  new_product_name: 'New product name', new_customer_name: 'New customer name', supplier: 'Bought from', cost_each: 'Cost each (TZS)', transport: 'Transport for this trip (TZS)',
  with_transport: v => v + ' each with transport', reason: 'What happened', r_0: 'Goods spoiled', r_1: 'Damaged in transit', r_2: 'Missing or stolen', r_3: 'Customer never paid', r_4: 'Other',
  money_only: 'None, money only', qty_lost: 'Quantity lost', extra: 'Other money lost (TZS)', loss_hint: 'Lost goods are valued at what they cost you, with transport. Use “Other money lost” for anything else, such as a debt that will never be paid.',
  loss_value: 'Loss', unit: 'Sold by', unit_ph: 'e.g. piece, kg, whole rabbit', price: 'Selling price (TZS)', usual_cost: 'Usual cost to you (TZS)', usual_cost_hint: 'Used until you record a purchase of this product.',
  description: 'Description', active: 'Available for sale', business_ph: 'e.g. Mama Asha Foods',
  save: 'Save', cancel: 'Cancel', delete: 'Delete', confirm_delete: 'Tap again to delete', saved: 'Saved', deleted: 'Deleted', close: 'Close',
  need_product: 'Choose a product.', need_product_name: 'Type the new product’s name.', need_customer_name: 'Type the new customer’s name.', need_qty: 'Enter a quantity above zero.', need_name: 'Type a name.',
  need_loss: 'Enter the quantity lost or the money lost.', need_loss_product: 'Choose the product that was lost.', has_sales: 'This customer has sales, so it can’t be deleted.',
  product_used: 'This product is used in records. Untick “Available for sale” to hide it instead.',
  alloc_edit: 'Profit split', alloc_hint: 'Choose where each shilling of profit goes. The percentages must add up to 100%.', alloc_add: 'Add a category', alloc_reset: 'Reset to default',
  alloc_total: 'Total', alloc_need: v => 'The total is ' + v + '%. It must be 100%.', alloc_names: 'Give every category a name.', category: 'Category', percent: 'Percent', remove: 'Remove',
  sync_title: 'Google Sheet copy', sync_hint: 'The app works without internet and saves everything on this phone. Paste your sync link here once and it will also keep a copy in your Google Sheet whenever there is internet.',
  sync_link: 'Sync link', sync_save: 'Save and sync', sync_now: 'Sync now', open_sheet: 'Open Google Sheet', unlink: 'Unlink', st_status: 'Status', st_last: 'Last synced', st_wait: 'Waiting to sync', never: 'Never',
  sync_bad_url: 'That doesn’t look like a sync link. It should start with https://script.google.com/ and end with /exec.',
  sync_fail_net: 'Could not reach the sheet. Check the internet and the link. In the script, “Who has access” must be “Anyone”.', sync_done: 'Synced with the Google Sheet', unlinked: 'Unlinked. Data stays on this phone.',
  gate_title: 'Connect to your Google Sheet', gate_text: 'Before you start, this app must connect to a Google Sheet so that every record is backed up. Paste your sync link below. This needs internet once.',
  gate_text_auto: 'Before you start, this app connects to its Google Sheet so that every record is backed up. This needs internet once.',
  gate_connect: 'Connect', gate_retry: 'Try again', gate_busy: 'Connecting…',
  gate_fail: 'Could not connect. Check that this phone has internet, then try again. If it keeps failing, the Google Sheet script may need updating.',
  sync_bad_reply: 'The Google Sheet answered, but not in the way this app expects. Its script needs updating.',
  sync_fixed: 'This app is linked to its Google Sheet. The link is built in and cannot be changed here.',
  sync_linked: 'This phone is linked to its Google Sheet. Every record is copied there whenever there is internet.', change_link: 'Change link',
  relink_warn: 'Only change this if your Sheet has a new link. Linking to a different Sheet mixes its records with the ones on this phone.',
  stale: (c, d) => c + (c === 1 ? ' change has' : ' changes have') + ' not been backed up since ' + d + '. Connect this phone to the internet.',
  inst_title: 'Install Daftari on this phone', inst_text: 'Installing puts Daftari on your home screen and lets it work without internet.', inst_btn: 'Install app',
  inst_manual: 'To install:', inst_ios: 'To install on iPhone or iPad:',
  and_1: 'Tap the ⋮ menu at the top right of the browser.', and_2: 'Tap “Install app” or “Add to Home screen”.', and_3: 'Tap “Install”, then open Daftari from your home screen.',
  ios_1: ic => 'Tap the Share button ' + ic + ' in Safari. If you can’t see it, tap ••• first.', ios_2: 'Scroll down and tap “Add to Home Screen”.', ios_3: 'Tap “Add”, then open Daftari from your home screen.',
  inst_browser: 'If these options are missing, open this page in Chrome (Android) or Safari (iPhone).',
  inst_done: 'Daftari is installed. Close this page and open Daftari from your home screen.', inst_skip: 'Use it in the browser instead', inst_continue: 'Continue here',
  inst_menu: 'Install the app', inst_menu_sub: 'Put Daftari on this phone’s home screen.',
  tour_step: (i, c) => 'Step ' + i + ' of ' + c, next: 'Next', prev: 'Back', finish: 'Finish',
  t1h: 'Welcome', t1p: 'This is your sales book. It records sales, costs, losses and customers, then works out the profit for you. It works without internet and saves everything on this phone.',
  t2h: 'Moving around', t2p: 'Use the buttons at the bottom to move between Overview, Sales, Costs, Customers and More.',
  t3h: 'Pick a period', t3p: 'Choose this week, this month, last month, this year or all time. Every number and the chart follow the period you pick.',
  t4h: 'Key numbers', t4p: 'Your profit, total sales, items sold, and money customers still owe you.',
  t5h: 'How profit is worked out', t5p: 'Sales, minus what the goods cost you with transport, minus losses. What is left is the profit.',
  t6h: 'Where the profit goes', t6p: 'The profit is shared out by your percentages, for example tithe, reinvesting, personal use and savings. Tap “Change” to set your own.',
  t7h: 'Chart', t7p: 'Dark bars are sales and red bars are profit. A week or month shows each day. A year shows each month.',
  t8h: 'Record a sale', t8p: 'Tap “New sale”, choose the product and the amount. The price fills in by itself. Choose a customer if you know them, then Save.',
  t9h: 'Fix a mistake', t9p: 'Tap any sale to change it: the product, amount, price, payment or customer. You can add a customer later to a sale you recorded without one.',
  t10h: 'Costs', t10p: 'Under Purchases, record what you buy for the business and the transport. Under Losses, record spoiled or missing goods and debts that will never be paid. Both come off the profit.',
  t11h: 'Customers', t11p: 'Each customer shows how many times they ordered, how much they spent and how often they buy. Tap Call or WhatsApp to reach them.',
  t12h: 'Products and settings', t12p: 'Add products with their own prices, change the profit split, set your business name and switch between English and Kiswahili.',
  t13h: 'Google Sheet copy', t13p: 'Link the app to a Google Sheet once. After that, every record is copied there whenever the phone has internet, so it can be viewed from anywhere.',
  t14h: 'You’re ready', t14p: 'Start by adding your products, then record your first sale. Tap the ? button at the top any time to see this again.'
},
sw: {
  app_sub: 'Daftari la mauzo', nav_home: 'Muhtasari', nav_sales: 'Mauzo', nav_costs: 'Gharama', nav_customers: 'Wateja', nav_more: 'Zaidi',
  sync_ok: 'Imetumwa', sync_off: 'Bila mtandao', sync_busy: 'Inatuma', sync_none: 'Haijaungwa', sync_err: 'Tatizo',
  tutorial: 'Mafunzo', period: 'Kipindi', home_title: 'Hali ya biashara',
  p_week: 'Wiki hii', p_month: 'Mwezi huu', p_lastmonth: 'Mwezi uliopita', p_year: 'Mwaka huu', p_all: 'Tangu mwanzo',
  r_week: d => 'Wiki hii, kuanzia Jumatatu ' + d, r_month: m => m + ', hadi leo', r_year: y => 'Mwaka ' + y + ', hadi leo', r_all: 'Rekodi zote tangu mwanzo',
  start_title: 'Anza hapa', start_1: 'Ongeza bidhaa unazouza, kila moja na bei yake.', start_2: 'Rekodi unachonunua kwenye Gharama, ili faida iwe sahihi.', start_3: 'Rekodi kila mauzo. Faida inajihesabu yenyewe.',
  add_product: 'Ongeza bidhaa', take_tour: 'Nionyeshe jinsi ya kutumia',
  k_profit: 'Faida', k_sales: 'Mauzo', k_units: 'Bidhaa zilizouzwa', k_owed: 'Madeni ya wateja',
  per_item: v => 'Takriban ' + v + ' kwa kila bidhaa', no_sales_yet: 'Hakuna mauzo katika kipindi hiki', n_sales: c => 'Mauzo ' + c,
  avg_each: v => 'Wastani ' + v + ' kila moja', n_unpaid: c => 'Mauzo ' + c + ' hayajalipwa (yote)', all_paid: 'Wote wamelipa',
  ledger_title: 'Jinsi faida inavyopatikana', l_sales: 'Mauzo', l_cogs: q => 'Gharama ya bidhaa ' + q + ' zilizouzwa, pamoja na usafiri', l_losses: 'Hasara', l_profit: 'Faida',
  no_cost_warn: names => 'Hakuna gharama iliyorekodiwa kwa: ' + names + '. Faida yake inaonekana kubwa kuliko ilivyo. Rekodi manunuzi kwenye Gharama, au weka gharama ya kawaida kwenye bidhaa.',
  alloc_title: 'Faida inakwenda wapi', change: 'Badilisha', alloc_none: 'Hakuna faida ya kugawa katika kipindi hiki.',
  al_tithe: 'Zaka', al_reinvest: 'Kuwekeza tena kwenye biashara', al_personal: 'Matumizi binafsi', al_savings: 'Akiba',
  chart_title: u => 'Mauzo na faida ' + u, u_day: 'kwa siku', u_month: 'kwa mwezi', u_year: 'kwa mwaka', lg_sales: 'Mauzo', lg_profit: 'Faida',
  chart_tip: (d, s, p) => d + ': mauzo ' + s + ', faida ' + p,
  byprod_title: 'Kwa kila bidhaa', th_product: 'Bidhaa', th_qty: 'Idadi', th_sales: 'Mauzo', th_profit: 'Faida',
  owed_title: 'Bado hawajalipa', owed_none: 'Hakuna deni. Mauzo yote yamelipwa.', mark_paid: 'Amelipa',
  due_title: 'Wateja wa kupigia simu', due_hint: 'Wateja wa kawaida ambao muda wao wa kununua umefika au umepita.', due_none: 'Hakuna mteja anayesubiriwa kwa sasa.',
  due_meta: (g, s) => 'Kwa kawaida kila siku ' + g + ' · alinunua ' + s, call: 'Piga simu', whatsapp: 'WhatsApp',
  today: 'leo', yesterday: 'jana', days_ago: d => 'siku ' + d + ' zilizopita',
  sales_title: 'Mauzo', new_sale: 'Mauzo mapya', edit_sale: 'Hariri mauzo', search_sales: 'Tafuta bidhaa, mteja au maelezo',
  no_customer: 'Hakuna mteja', no_product: 'Bidhaa imeondolewa', paid: 'Amelipa', unpaid: 'Hajalipa', edit: 'Hariri',
  sales_empty: 'Bado hakuna mauzo. Bonyeza “Mauzo mapya” kurekodi ya kwanza.', no_match: 'Hakuna kinacholingana na utafutaji.', show_more: 'Onyesha zaidi',
  costs_title: 'Gharama', tab_purchases: 'Manunuzi', tab_losses: 'Hasara', new_purchase: 'Manunuzi mapya', edit_purchase: 'Hariri manunuzi', new_loss: 'Hasara mpya', edit_loss: 'Hariri hasara',
  purchases_empty: 'Bado hakuna manunuzi. Rekodi unachonunua ili faida iwe sahihi.', losses_empty: 'Hakuna hasara iliyorekodiwa.',
  p_meta: (c, tr, l) => c + ' kila moja · usafiri ' + tr + ' · ' + l + ' kila moja pamoja na usafiri', other_money: v => 'pesa nyingine ' + v,
  customers_title: 'Wateja', new_customer: 'Mteja mpya', edit_customer: 'Hariri mteja', search_customers: 'Tafuta jina, simu au eneo',
  customers_empty: 'Bado hakuna wateja. Ongeza hapa, au wakati wa kurekodi mauzo.',
  c_meta: (o, s) => 'Oda ' + o + ' · ametumia ' + s, c_last: s => 'Alinunua ' + s,
  f_none: 'Bado hajanunua', f_new: 'Mpya', f_weekly: 'Kila wiki', f_2weeks: 'Kila wiki 2', f_monthly: 'Kila mwezi', f_rare: 'Mara chache', d_late: 'Amechelewa', d_due: 'Muda umefika',
  more_title: 'Zaidi', products: 'Bidhaa', n_products: c => 'Bidhaa ' + c, alloc_menu: 'Mgawanyo wa faida', business: 'Jina la biashara', business_none: 'Halijawekwa',
  language: 'Lugha', sync_menu: 'Nakala kwenye Google Sheet', sync_menu_none: 'Bado haijaunganishwa. Taarifa ziko kwenye simu hii tu.', sync_menu_ok: s => 'Ilitumwa mara ya mwisho ' + s, sync_menu_wait: c => 'Mabadiliko ' + c + ' yanasubiri kutumwa',
  backup: 'Pakua faili la akiba', backup_sub: 'Inahifadhi kila kitu kwenye faili ndani ya simu hii.', restore: 'Rejesha kutoka faili la akiba', restore_sub: 'Inaongeza rekodi zilizo kwenye faili la akiba.',
  restored: c => 'Rekodi ' + c + ' zimerejeshwa', restore_bad: 'Faili hilo si faili la akiba la Daftari.', version: 'Toleo',
  products_title: 'Bidhaa', back: 'Rudi', new_product: 'Bidhaa mpya', edit_product: 'Hariri bidhaa', products_empty: 'Bado hakuna bidhaa. Ongeza unachouza, kila kimoja na bei yake.',
  pr_meta: (c, m) => 'Inakugharimu ' + c + ' · unabaki na ' + m, pr_nocost: 'Bado hakuna gharama iliyorekodiwa', hidden: 'Imefichwa', per: 'kwa',
  date: 'Tarehe', product: 'Bidhaa', customer: 'Mteja', qty: 'Idadi', unit_price: 'Bei ya kila moja (TZS)', total: 'Jumla', method: 'Njia ya malipo', payment: 'Malipo', pay_yes: 'Amelipa', pay_no: 'Bado hajalipa',
  notes: 'Maelezo', m_cash: 'Taslimu', m_bank: 'Benki', name: 'Jina', phone: 'Simu / WhatsApp', area: 'Eneo',
  new_product_name: 'Jina la bidhaa mpya', new_customer_name: 'Jina la mteja mpya', supplier: 'Umenunua kwa', cost_each: 'Gharama ya kila moja (TZS)', transport: 'Usafiri wa safari hii (TZS)',
  with_transport: v => v + ' kila moja pamoja na usafiri', reason: 'Nini kilitokea', r_0: 'Bidhaa iliharibika', r_1: 'Iliharibika njiani', r_2: 'Imepotea au kuibiwa', r_3: 'Mteja hakulipa', r_4: 'Nyingine',
  money_only: 'Hakuna, ni pesa tu', qty_lost: 'Idadi iliyopotea', extra: 'Pesa nyingine iliyopotea (TZS)', loss_hint: 'Bidhaa iliyopotea inahesabiwa kwa gharama uliyonunulia pamoja na usafiri. Tumia “Pesa nyingine iliyopotea” kwa hasara nyingine, kama deni lisilolipwa.',
  loss_value: 'Hasara', unit: 'Inauzwa kwa', unit_ph: 'mf. kipande, kilo, sungura mzima', price: 'Bei ya kuuza (TZS)', usual_cost: 'Gharama yako ya kawaida (TZS)', usual_cost_hint: 'Inatumika hadi utakaporekodi manunuzi ya bidhaa hii.',
  description: 'Maelezo ya bidhaa', active: 'Inapatikana kwa mauzo', business_ph: 'mf. Mama Asha Foods',
  save: 'Hifadhi', cancel: 'Ghairi', delete: 'Futa', confirm_delete: 'Gusa tena kufuta', saved: 'Imehifadhiwa', deleted: 'Imefutwa', close: 'Funga',
  need_product: 'Chagua bidhaa.', need_product_name: 'Andika jina la bidhaa mpya.', need_customer_name: 'Andika jina la mteja mpya.', need_qty: 'Weka idadi iliyo zaidi ya sifuri.', need_name: 'Andika jina.',
  need_loss: 'Weka idadi iliyopotea au pesa iliyopotea.', need_loss_product: 'Chagua bidhaa iliyopotea.', has_sales: 'Mteja huyu ana mauzo, hawezi kufutwa.',
  product_used: 'Bidhaa hii imetumika kwenye rekodi. Ondoa tiki ya “Inapatikana kwa mauzo” ili kuificha.',
  alloc_edit: 'Mgawanyo wa faida', alloc_hint: 'Chagua kila shilingi ya faida inakwenda wapi. Asilimia zote lazima zijumlishe 100%.', alloc_add: 'Ongeza kundi', alloc_reset: 'Rudisha za mwanzo',
  alloc_total: 'Jumla', alloc_need: v => 'Jumla ni ' + v + '%. Lazima iwe 100%.', alloc_names: 'Kila kundi liwe na jina.', category: 'Kundi', percent: 'Asilimia', remove: 'Ondoa',
  sync_title: 'Nakala kwenye Google Sheet', sync_hint: 'Daftari linafanya kazi bila mtandao na linahifadhi kila kitu kwenye simu hii. Bandika kiungo chako cha kusawazisha hapa mara moja, nalo litatunza nakala kwenye Google Sheet kila mtandao unapopatikana.',
  sync_link: 'Kiungo cha kusawazisha', sync_save: 'Hifadhi na utume', sync_now: 'Tuma sasa', open_sheet: 'Fungua Google Sheet', unlink: 'Tenganisha', st_status: 'Hali', st_last: 'Mara ya mwisho kutumwa', st_wait: 'Yanasubiri kutumwa', never: 'Bado',
  sync_bad_url: 'Hicho hakionekani kuwa kiungo cha kusawazisha. Kinapaswa kuanza na https://script.google.com/ na kuishia na /exec.',
  sync_fail_net: 'Imeshindikana kufikia Sheet. Angalia mtandao na kiungo. Kwenye script, “Who has access” lazima iwe “Anyone”.', sync_done: 'Imesawazishwa na Google Sheet', unlinked: 'Imetenganishwa. Taarifa zinabaki kwenye simu hii.',
  gate_title: 'Unganisha na Google Sheet', gate_text: 'Kabla ya kuanza, daftari lazima liunganishwe na Google Sheet ili kila rekodi iwe na nakala. Bandika kiungo chako cha kusawazisha hapa chini. Mtandao unahitajika mara moja tu.',
  gate_text_auto: 'Kabla ya kuanza, daftari linaunganishwa na Google Sheet yake ili kila rekodi iwe na nakala. Mtandao unahitajika mara moja tu.',
  gate_connect: 'Unganisha', gate_retry: 'Jaribu tena', gate_busy: 'Inaunganisha…',
  gate_fail: 'Imeshindikana kuunganisha. Hakikisha simu ina mtandao, kisha jaribu tena. Ikiendelea kushindikana, huenda script ya Google Sheet inahitaji kusasishwa.',
  sync_bad_reply: 'Google Sheet imejibu, lakini si kwa namna daftari linavyotarajia. Script yake inahitaji kusasishwa.',
  sync_fixed: 'Daftari limeunganishwa na Google Sheet yake. Kiungo kimewekwa ndani na hakiwezi kubadilishwa hapa.',
  sync_linked: 'Simu hii imeunganishwa na Google Sheet yake. Kila rekodi inanakiliwa huko mtandao unapopatikana.', change_link: 'Badilisha kiungo',
  relink_warn: 'Badilisha tu kama Sheet yako imepata kiungo kipya. Kuunganisha na Sheet nyingine kunachanganya rekodi zake na zilizo kwenye simu hii.',
  stale: (c, d) => 'Mabadiliko ' + c + ' hayajapata nakala tangu ' + d + '. Unganisha simu hii na mtandao.',
  inst_title: 'Weka Daftari kwenye simu hii', inst_text: 'Ukiliweka, Daftari linakaa kwenye skrini ya mwanzo ya simu na linafanya kazi bila mtandao.', inst_btn: 'Weka app',
  inst_manual: 'Jinsi ya kuweka:', inst_ios: 'Jinsi ya kuweka kwenye iPhone au iPad:',
  and_1: 'Bonyeza menyu ya ⋮ juu kulia kwenye kivinjari.', and_2: 'Bonyeza “Install app” au “Add to Home screen”.', and_3: 'Bonyeza “Install”, kisha fungua Daftari kutoka skrini ya mwanzo.',
  ios_1: ic => 'Bonyeza kitufe cha Share ' + ic + ' kwenye Safari. Usipokiona, bonyeza ••• kwanza.', ios_2: 'Shuka chini, kisha bonyeza “Add to Home Screen”.', ios_3: 'Bonyeza “Add”, kisha fungua Daftari kutoka skrini ya mwanzo.',
  inst_browser: 'Usipoona chaguo hizi, fungua ukurasa huu kwenye Chrome (Android) au Safari (iPhone).',
  inst_done: 'Daftari limewekwa. Funga ukurasa huu, kisha fungua Daftari kutoka skrini ya mwanzo.', inst_skip: 'Tumia kwenye kivinjari badala yake', inst_continue: 'Endelea hapa',
  inst_menu: 'Weka app kwenye simu', inst_menu_sub: 'Weka Daftari kwenye skrini ya mwanzo ya simu hii.',
  tour_step: (i, c) => 'Hatua ' + i + ' kati ya ' + c, next: 'Mbele', prev: 'Nyuma', finish: 'Maliza',
  t1h: 'Karibu', t1p: 'Hili ni daftari lako la mauzo. Linarekodi mauzo, gharama, hasara na wateja, kisha linakokotoa faida. Linafanya kazi bila mtandao na linahifadhi kila kitu kwenye simu hii.',
  t2h: 'Kuhamia sehemu', t2p: 'Tumia vitufe vya chini kuhamia Muhtasari, Mauzo, Gharama, Wateja na Zaidi.',
  t3h: 'Chagua kipindi', t3p: 'Chagua wiki hii, mwezi huu, mwezi uliopita, mwaka huu au tangu mwanzo. Namba zote na chati zinafuata kipindi unachochagua.',
  t4h: 'Namba muhimu', t4p: 'Faida yako, jumla ya mauzo, bidhaa zilizouzwa, na pesa ambazo wateja bado wanadaiwa.',
  t5h: 'Jinsi faida inavyopatikana', t5p: 'Mauzo, toa gharama ya bidhaa pamoja na usafiri, toa hasara. Kinachobaki ndiyo faida.',
  t6h: 'Faida inakwenda wapi', t6p: 'Faida inagawanywa kwa asilimia zako, kwa mfano zaka, kuwekeza tena, matumizi binafsi na akiba. Bonyeza “Badilisha” kuweka zako.',
  t7h: 'Chati', t7p: 'Mistari myeusi ni mauzo, myekundu ni faida. Wiki au mwezi unaonyesha kila siku. Mwaka unaonyesha kila mwezi.',
  t8h: 'Rekodi mauzo', t8p: 'Bonyeza “Mauzo mapya”, chagua bidhaa na idadi. Bei inajijaza yenyewe. Chagua mteja kama unamjua, kisha Hifadhi.',
  t9h: 'Rekebisha kosa', t9p: 'Gusa mauzo yoyote kuyabadilisha: bidhaa, idadi, bei, malipo au mteja. Unaweza kuongeza mteja baadaye kwenye mauzo uliyorekodi bila mteja.',
  t10h: 'Gharama', t10p: 'Kwenye Manunuzi, rekodi unachonunua kwa ajili ya biashara pamoja na usafiri. Kwenye Hasara, rekodi bidhaa zilizoharibika au kupotea na madeni yasiyolipwa. Zote zinatolewa kwenye faida.',
  t11h: 'Wateja', t11p: 'Kila mteja anaonyesha ameagiza mara ngapi, ametumia kiasi gani na hununua mara ngapi. Bonyeza Piga simu au WhatsApp kumfikia.',
  t12h: 'Bidhaa na mipangilio', t12p: 'Ongeza bidhaa na bei zake, badilisha mgawanyo wa faida, weka jina la biashara na ubadilishe kati ya English na Kiswahili.',
  t13h: 'Nakala kwenye Google Sheet', t13p: 'Unganisha daftari na Google Sheet mara moja. Baada ya hapo, kila rekodi inanakiliwa huko simu inapopata mtandao, ili ionekane popote.',
  t14h: 'Uko tayari', t14p: 'Anza kwa kuongeza bidhaa zako, kisha rekodi mauzo yako ya kwanza. Bonyeza kitufe cha ? juu wakati wowote kuona haya tena.'
}};
const CAL = {
  en: { mon: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], monf: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  sw: { mon: ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ago', 'Sep', 'Okt', 'Nov', 'Des'], monf: ['Januari', 'Februari', 'Machi', 'Aprili', 'Mei', 'Juni', 'Julai', 'Agosti', 'Septemba', 'Oktoba', 'Novemba', 'Desemba'], day: ['Jtt', 'Jnn', 'Jtn', 'Alh', 'Iju', 'Jms', 'Jpl'] }
};

/* ======================= state ======================= */
let DB = {}; TABLES.forEach(t => DB[t] = {});
let L = { lang: 'en', syncUrl: '', cursor: 0, lastSync: 0, lastError: '', sheetUrl: '' };
const ui = { view: 'home', period: 'month', costTab: 'purchases', q: { sales: '', customers: '' }, limit: 60, form: null, al: [] };
let C = {};            // unit cost per product, recomputed on every render
let syncing = false, syncTimer = 0, syncState = '';

const t = (k, ...a) => { let s = (I18N[L.lang] || I18N.en)[k]; if (s === undefined) s = I18N.en[k]; if (s === undefined) return k; return typeof s === 'function' ? s(...a) : s; };
const cal = () => CAL[L.lang] || CAL.en;

/* ======================= storage (IndexedDB, falls back to localStorage) ======================= */
const store = {
  db: null,
  open() { return new Promise(res => { try { const r = indexedDB.open('daftari', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => { this.db = r.result; res(); }; r.onerror = () => res(); r.onblocked = () => res(); } catch (e) { res(); } }); },
  get(k) { return new Promise(res => { if (!this.db) { try { res(JSON.parse(localStorage.getItem('dk_' + k))); } catch (e) { res(null); } return; } try { const q = this.db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result === undefined ? null : q.result); q.onerror = () => res(null); } catch (e) { res(null); } }); },
  set(k, v) { return new Promise(res => { if (!this.db) { try { localStorage.setItem('dk_' + k, JSON.stringify(v)); } catch (e) {} res(); return; } try { const tx = this.db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = () => res(); tx.onerror = () => res(); tx.onabort = () => res(); } catch (e) { res(); } }); }
};
const persist = tb => store.set('t_' + tb, DB[tb]);
const persistLocal = () => store.set('local', L);

/* ======================= helpers ======================= */
const n = v => { const x = parseFloat(v); return isFinite(x) ? x : 0; };
const money = v => 'TZS ' + Math.round(v).toLocaleString('en-US');
const short = v => { const a = Math.abs(v), s = v < 0 ? '−' : ''; if (a >= 1e6) return s + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.?0+$/, '') + 'M'; if (a >= 1e3) return s + Math.round(a / 1e3) + 'K'; return s + Math.round(a); };
const qn = v => (Math.round(n(v) * 100) / 100).toLocaleString('en-US');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = x => String(x).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const today = () => iso(new Date());
const pd = s => { const p = String(s).split('-').map(Number); return new Date(p[0], (p[1] || 1) - 1, p[2] || 1); };
const nice = s => { if (!s) return ''; const d = pd(s); return d.getDate() + ' ' + cal().mon[d.getMonth()] + ' ' + d.getFullYear(); };
const daysBetween = (a, b) => Math.round((pd(b) - pd(a)) / 864e5);
const daysAgo = d => d <= 0 ? t('today') : d === 1 ? t('yesterday') : t('days_ago', d);
const byDateDesc = (a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || '');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const chip = (cls, text) => `<span class="chip ${cls}">${esc(text)}</span>`;
const mlabel = m => m === 'Cash' ? t('m_cash') : m === 'Bank' ? t('m_bank') : (m || '');
const rlabel = r => { const i = REASONS.indexOf(r); return i >= 0 ? t('r_' + i) : (r || ''); };
function ago(ms) { if (!ms) return t('never'); const d = new Date(ms); const day = iso(d) === today() ? t('today') : nice(iso(d)); return day + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
function waNumber(p) { let d = String(p || '').replace(/\D/g, ''); if (d.length === 10 && d[0] === '0') d = '255' + d.slice(1); else if (d.length === 9) d = '255' + d; return d; }

/* ======================= data access ======================= */
const rows = tb => Object.values(DB[tb]).filter(r => !r.deleted);
const get = (tb, id) => { const r = id ? DB[tb][id] : null; return r && !r.deleted ? r : null; };
function put(tb, rec) {
  let now = new Date().toISOString();
  if (!rec.id) rec.id = uid();
  const prev = DB[tb][rec.id];
  if (prev && prev.updatedAt >= now) now = new Date(Date.parse(prev.updatedAt) + 1).toISOString();
  if (tb !== 'meta' && !rec.createdAt) rec.createdAt = now;
  rec.updatedAt = now; rec._dirty = 1; delete rec.deleted;
  DB[tb][rec.id] = rec; persist(tb); queueSync(); return rec.id;
}
function remove(tb, id) {
  const prev = DB[tb][id]; if (!prev) return;
  let now = new Date().toISOString(); if (prev.updatedAt >= now) now = new Date(Date.parse(prev.updatedAt) + 1).toISOString();
  DB[tb][id] = { id, deleted: true, updatedAt: now, _dirty: 1 }; persist(tb); queueSync();
}
function touch(tb, pred) { let c = 0; Object.values(DB[tb]).forEach(r => { if (!r.deleted && pred(r)) { r._dirty = 1; c++; } }); if (c) { persist(tb); queueSync(); } }
const metaStr = (k, d) => { const r = get('meta', k); return r ? String(r.value == null ? '' : r.value) : d; };
const setMeta = (k, v) => put('meta', { id: k, value: String(v) });
function alloc() { try { const a = JSON.parse(metaStr('alloc', '')); if (Array.isArray(a) && a.length) return a; } catch (e) {} return DEFAULT_ALLOC.map(a => Object.assign({}, a)); }
const aname = a => a.name || (a.key ? t('al_' + a.key) : '');
const pname = id => { const p = get('products', id); return p ? p.name : ''; };
const cname = id => { const c = get('customers', id); return c ? c.name : ''; };
const dirtyCount = () => TABLES.reduce((a, tb) => a + Object.values(DB[tb]).filter(r => r._dirty).length, 0);

/* ======================= maths ======================= */
function costMap() {
  const m = {}; rows('purchases').forEach(p => { const x = m[p.productId] || (m[p.productId] = { q: 0, c: 0 }); x.q += n(p.qty); x.c += n(p.qty) * n(p.cost) + n(p.transport); });
  const out = {}; rows('products').forEach(p => { const x = m[p.id]; out[p.id] = x && x.q > 0 ? x.c / x.q : n(p.cost); });
  Object.keys(m).forEach(id => { if (!(id in out) && m[id].q > 0) out[id] = m[id].c / m[id].q; });
  return out;
}
const lossValue = l => n(l.qty) * (C[l.productId] || 0) + n(l.extra);
const inR = (r, x) => (x.date || '') >= r[0] && (x.date || '') <= r[1];
function range(p) {
  const now = new Date(), td = iso(now);
  if (p === 'week') { const d = new Date(now); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return [iso(d), td, t('r_week', nice(iso(d)))]; }
  if (p === 'month') return [iso(new Date(now.getFullYear(), now.getMonth(), 1)), td, t('r_month', cal().monf[now.getMonth()] + ' ' + now.getFullYear())];
  if (p === 'lastmonth') { const a = new Date(now.getFullYear(), now.getMonth() - 1, 1), b = new Date(now.getFullYear(), now.getMonth(), 0); return [iso(a), iso(b), cal().monf[a.getMonth()] + ' ' + a.getFullYear()]; }
  if (p === 'year') return [now.getFullYear() + '-01-01', td, t('r_year', now.getFullYear())];
  return ['0000-01-01', '9999-12-31', t('r_all')];
}
function summary(r) {
  const s = { rev: 0, sold: 0, cogs: 0, lost: 0, count: 0, by: {} };
  rows('sales').forEach(x => { if (!inR(r, x)) return; const q = n(x.qty), rv = q * n(x.price), cg = q * (C[x.productId] || 0); s.rev += rv; s.sold += q; s.cogs += cg; s.count++; const b = s.by[x.productId] || (s.by[x.productId] = { q: 0, rev: 0, cogs: 0 }); b.q += q; b.rev += rv; b.cogs += cg; });
  rows('losses').forEach(x => { if (inR(r, x)) s.lost += lossValue(x); });
  s.profit = s.rev - s.cogs - s.lost; return s;
}
function customerStats() {
  const m = {}; rows('customers').forEach(c => m[c.id] = { orders: 0, spent: 0, dates: [] });
  rows('sales').forEach(s => { const x = m[s.customerId]; if (!x) return; x.orders++; x.spent += n(s.qty) * n(s.price); x.dates.push(s.date); });
  const td = today();
  Object.values(m).forEach(x => {
    const d = [...new Set(x.dates)].sort(); x.last = d[d.length - 1] || '';
    x.gap = d.length >= 2 ? daysBetween(d[0], d[d.length - 1]) / (d.length - 1) : null;
    x.since = x.last ? daysBetween(x.last, td) : null;
    x.freq = !d.length ? ['plain', 'f_none'] : x.gap === null ? ['plain', 'f_new'] : x.gap <= 10 ? ['good', 'f_weekly'] : x.gap <= 20 ? ['good', 'f_2weeks'] : x.gap <= 40 ? ['plain', 'f_monthly'] : ['plain', 'f_rare'];
    x.due = null; if (x.gap !== null && x.gap > 0) { if (x.since > x.gap * 1.3) x.due = ['bad', 'd_late']; else if (x.since >= x.gap * 0.85) x.due = ['warn', 'd_due']; }
  });
  return m;
}

/* ======================= sync with the Google Sheet ======================= */
function decorate(tb, r) {
  if (r.deleted) return { id: r.id, deleted: true, updatedAt: r.updatedAt };
  const o = Object.assign({}, r); delete o._dirty;
  if (tb === 'sales') { o.productName = pname(r.productId); o.customerName = cname(r.customerId); o.total = n(r.qty) * n(r.price); }
  if (tb === 'purchases') { o.productName = pname(r.productId); o.total = n(r.qty) * n(r.cost) + n(r.transport); }
  if (tb === 'losses') { o.productName = pname(r.productId); o.lossValue = Math.round(lossValue(r)); }
  return o;
}
function applyRow(tb, r) {
  if (!r || !r.id) return false; const id = String(r.id), u = String(r.updatedAt || ''), loc = DB[tb][id];
  if (loc && (loc.updatedAt > u || (loc.updatedAt === u && (loc._dirty || !loc.deleted)))) return false;
  const o = Object.assign({}, r); DERIVED.forEach(k => delete o[k]); o.id = id; DB[tb][id] = o; return true;
}
function queueSync() { clearTimeout(syncTimer); if (L.linked) syncTimer = setTimeout(sync, 1500); renderChrome(); }
async function sync() {
  if (syncing || !L.syncUrl) return false;
  if (!navigator.onLine) { L.lastError = 'net'; setSync('off'); return false; }
  syncing = true; setSync('busy');
  let ok = false, changedByPull = false;
  try {
    C = costMap();
    const changes = {}, sent = [];
    TABLES.forEach(tb => { const d = Object.values(DB[tb]).filter(r => r._dirty); if (d.length) { changes[tb] = d.map(r => decorate(tb, r)); d.forEach(r => sent.push([tb, r.id, r.updatedAt])); } });
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 45000);
    let out;
    try {
      let res;
      try { res = await fetch(L.syncUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ v: 1, since: L.cursor || 0, changes }), signal: ctl.signal, redirect: 'follow' }); } catch (e) { throw { net: true }; }
      try { out = await res.json(); } catch (e) { throw { message: 'badreply' }; }
    } finally { clearTimeout(timer); }
    if (!out || !out.ok) throw { message: (out && out.error) || 'Sync failed' };
    const touched = new Set();
    sent.forEach(([tb, id, u]) => { const r = DB[tb][id]; if (r && r.updatedAt === u) { if (r.deleted) delete DB[tb][id]; else delete r._dirty; touched.add(tb); } });
    TABLES.forEach(tb => (out.rows && out.rows[tb] || []).forEach(r => { if (applyRow(tb, r)) { touched.add(tb); changedByPull = true; } }));
    (out.deleted || []).forEach(d => { const tb = d.t, loc = DB[tb] && DB[tb][d.id]; if (loc && String(d.updatedAt) >= loc.updatedAt) { delete DB[tb][d.id]; touched.add(tb); changedByPull = true; } });
    touched.forEach(persist);
    L.cursor = out.now; L.lastSync = Date.now(); L.lastError = ''; L.linked = true; if (out.sheetUrl) L.sheetUrl = out.sheetUrl; persistLocal();
    ok = true;
  } catch (e) {
    L.lastError = e && e.net ? 'net' : String((e && e.message) || e); persistLocal();
  }
  syncing = false;
  setSync(ok ? 'ok' : L.lastError === 'net' ? 'off' : 'err');
  if (changedByPull) render();
  if (ok && dirtyCount()) queueSync();
  return ok;
}
function setSync(s) { syncState = s; renderChrome(); }
const validUrl = u => /^https:\/\/script\.google(usercontent)?\.com\/.+\/exec(\?.*)?$/.test(u) || /^https?:\/\/(localhost|127\.0\.0\.1)/.test(u);
const errText = () => L.lastError === 'net' ? t('gate_fail') : L.lastError === 'badreply' ? t('sync_bad_reply') : t('sync_err') + ': ' + L.lastError;
function setLink(url) { if (url !== L.syncUrl) { L.syncUrl = url; L.cursor = 0; L.sheetUrl = ''; TABLES.forEach(tb => { Object.values(DB[tb]).forEach(r => { r._dirty = 1; }); persist(tb); }); } L.lastError = ''; }
async function idle() { clearTimeout(syncTimer); for (let i = 0; i < 200 && syncing; i++) await new Promise(r => setTimeout(r, 250)); }

/* ======================= first-run gate: the app only opens after one successful sync ======================= */
let gateUrl = '';
const lock = on => { document.querySelectorAll('header.band, main, nav.nav').forEach(el => { el.inert = on; }); const g = $('#gate'); g.hidden = !on; if (!on) g.innerHTML = ''; };
const langSeg = () => `<div class="seg"><button type="button" data-act="lang" data-v="en" aria-pressed="${L.lang === 'en'}">English</button><button type="button" data-act="lang" data-v="sw" aria-pressed="${L.lang === 'sw'}">Kiswahili</button></div>`;

/* ----- install screen: shown first when the app is opened in a browser tab instead of from the home screen ----- */
const standalone = () => navigator.standalone === true || ['standalone', 'fullscreen', 'minimal-ui'].some(m => matchMedia('(display-mode: ' + m + ')').matches);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const SHARE = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M8 7l4-4 4 4M7 11H5v10h14V11h-2"/></svg>';
let installEvt = null, installed = false;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (ui.installOpen) showInstall(); else if (ui.view === 'more') render(); });
window.addEventListener('appinstalled', () => { installed = true; installEvt = null; if (ui.installOpen) showInstall(); });
function showInstall() {
  ui.installOpen = true; lock(true);
  const steps = isIOS ? [t('ios_1', SHARE), t('ios_2'), t('ios_3')] : [t('and_1'), t('and_2'), t('and_3')];
  $('#gate').innerHTML = `<div class="gatecard" id="installCard"><span class="mark">${MARK}</span><h2 id="gateTitle">${t('inst_title')}</h2>` +
    (installed ? `<p>${t('inst_done')}</p>` : `<p>${t('inst_text')}</p>` +
      (installEvt ? `<button class="btn primary block" type="button" data-act="install" id="installBtn">${t('inst_btn')}</button>`
        : `<div class="howto"><b>${t(isIOS ? 'inst_ios' : 'inst_manual')}</b><ol class="steps">${steps.map(x => `<li>${x}</li>`).join('')}</ol><p class="hint">${t('inst_browser')}</p></div>`)) +
    `<button class="btn block" type="button" data-act="skip-install" id="skipInstall">${t(installed ? 'inst_continue' : 'inst_skip')}</button>${langSeg()}</div>`;
}
async function proceed() { ui.installOpen = false; if (L.linked) { lock(false); renderAll(); sync(); } else { showGate(); if (DEFAULT_URL) await gateConnect(); } }

function showGate(msg) {
  const g = $('#gate'); if (!g.hidden && $('#g-url')) gateUrl = v('g-url');
  lock(true);
  g.innerHTML = `<div class="gatecard"><span class="mark">${MARK}</span><h2 id="gateTitle">${t('gate_title')}</h2><p>${t(DEFAULT_URL ? 'gate_text_auto' : 'gate_text')}</p><form id="gateForm" novalidate>` +
    (DEFAULT_URL ? '' : inp('g-url', t('sync_link'), gateUrl || L.syncUrl, 'type="url" inputmode="url" placeholder="https://script.google.com/macros/s/…/exec" autocapitalize="off" autocomplete="off" spellcheck="false"')) +
    `<div class="msg" id="gmsg" role="alert">${esc(msg || '')}</div><button class="btn primary block" type="submit" id="gateBtn">${t(DEFAULT_URL ? 'gate_retry' : 'gate_connect')}</button></form>` +
    langSeg() + `</div>`;
  $('#gateForm').addEventListener('submit', e => { e.preventDefault(); gateConnect(); });
}
let gateBusy = false;
async function gateConnect() {
  if (gateBusy) return; const url = DEFAULT_URL || v('g-url').trim();
  if (!validUrl(url)) { $('#gmsg').textContent = t('sync_bad_url'); return; }
  gateBusy = true; gateUrl = url;
  const busy = () => { const b = $('#gateBtn'); if (b) { b.disabled = true; b.textContent = t('gate_busy'); } const m = $('#gmsg'); if (m) m.textContent = ''; };
  busy(); await idle(); setLink(url); await persistLocal(); busy();
  const ok = await sync(); gateBusy = false;
  if (ok) { await persistLocal(); lock(false); renderAll(); }
  else showGate(errText());
}

/* ======================= chrome: header + bottom nav ======================= */
const MARK = '<svg viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" fill="#0F0E0E"/><rect x="112" y="88" width="288" height="336" rx="30" fill="#C8211E"/><rect x="112" y="88" width="52" height="336" rx="26" fill="#A91B18"/><path d="M318 88h50v124l-25-22-25 22z" fill="#F2B705"/><rect x="196" y="250" width="164" height="22" rx="11" fill="#fff"/><rect x="196" y="302" width="164" height="22" rx="11" fill="#fff"/><rect x="196" y="354" width="104" height="22" rx="11" fill="#fff"/></svg>';
const ICON = {
  home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  sales: '<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>',
  costs: '<svg viewBox="0 0 24 24"><path d="M3 4h2l2.5 11h10L20 7H6.5"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/></svg>',
  customers: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.8c1.700.8 2.700 2.500 3 5.200"/></svg>',
  more: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/></svg>'
};
function renderChrome() {
  const biz = metaStr('business', '').trim();
  let st = syncState;
  if (!L.syncUrl) st = 'none'; else if (!navigator.onLine) st = 'off'; else if (!st) st = L.lastError ? (L.lastError === 'net' ? 'off' : 'err') : 'ok';
  $('#band').innerHTML = `<span class="mark">${MARK}</span><div class="brand"><h1>${esc(biz || 'Daftari')}</h1><p>${esc(biz ? 'Daftari · ' + t('app_sub') : t('app_sub'))}</p></div>` +
    `<button class="syncchip ${st}" data-act="form" data-f="sync" id="syncChip"><i></i><span>${t('sync_' + st)}</span></button>` +
    `<button class="guide" data-act="tour" id="guideBtn" aria-label="${t('tutorial')}" title="${t('tutorial')}">?</button>`;
  const cur = ui.view === 'products' ? 'more' : ui.view;
  $('#nav').innerHTML = ['home', 'sales', 'costs', 'customers', 'more'].map(v => `<button data-act="nav" data-v="${v}"${cur === v ? ' aria-current="page"' : ''}>${ICON[v]}<span>${t('nav_' + v)}</span></button>`).join('');
  document.documentElement.lang = L.lang;
}

/* ======================= views ======================= */
function vHome() {
  const r = range(ui.period), s = summary(r);
  const owed = rows('sales').filter(x => x.paid === false).sort(byDateDesc);
  const ow = owed.reduce((a, x) => a + n(x.qty) * n(x.price), 0);
  const fresh = !rows('sales').length && !rows('products').length && !rows('purchases').length;
  let h = '';
  const waiting = dirtyCount();
  if (L.syncUrl && waiting && Date.now() - (L.lastSync || 0) > 48 * 3600e3) h += `<div class="warnbox" id="staleBox">${esc(t('stale', waiting, ago(L.lastSync)))}</div>`;
  if (fresh) h += `<section class="panel" id="startPanel"><h3>${t('start_title')}</h3><ol class="steps"><li>${t('start_1')}</li><li>${t('start_2')}</li><li>${t('start_3')}</li></ol><div class="actions"><button class="btn primary" data-act="new" data-f="product">${t('add_product')}</button><button class="btn" data-act="tour">${t('take_tour')}</button></div></section>`;
  h += `<div class="row"><div><h2>${t('home_title')}</h2><p class="sub">${esc(r[2])}</p></div><button class="btn primary" data-act="new" data-f="sale">+ ${t('new_sale')}</button></div>`;
  h += `<div class="seg" id="periodSeg" role="group" aria-label="${t('period')}">${PERIODS.map(p => `<button type="button" data-act="period" data-p="${p}" aria-pressed="${ui.period === p}">${t('p_' + p)}</button>`).join('')}</div>`;
  h += `<div class="kpis">` +
    `<div class="kpi hero"><span class="l">${t('k_profit')}</span><span class="v${s.profit < 0 ? ' neg' : ''}">${money(s.profit)}</span><span class="s">${s.sold ? t('per_item', money(s.profit / s.sold)) : t('no_sales_yet')}</span></div>` +
    `<div class="kpi"><span class="l">${t('k_sales')}</span><span class="v">${money(s.rev)}</span><span class="s">${t('n_sales', s.count)}</span></div>` +
    `<div class="kpi"><span class="l">${t('k_units')}</span><span class="v">${qn(s.sold)}</span><span class="s">${s.sold ? t('avg_each', money(s.rev / s.sold)) : '—'}</span></div>` +
    `<div class="kpi"><span class="l">${t('k_owed')}</span><span class="v">${money(ow)}</span><span class="s">${owed.length ? t('n_unpaid', owed.length) : t('all_paid')}</span></div></div>`;
  const noCost = Object.keys(s.by).filter(id => !(C[id] > 0) && get('products', id)).map(pname);
  h += `<section class="panel" id="ledgerPanel"><h3>${t('ledger_title')}</h3><div class="ledger">` +
    `<div><span>${t('l_sales')}</span><span>${money(s.rev)}</span></div>` +
    `<div><span>${t('l_cogs', qn(s.sold))}</span><span class="minus">− ${money(s.cogs)}</span></div>` +
    `<div><span>${t('l_losses')}</span><span class="minus">− ${money(s.lost)}</span></div>` +
    `<div class="tot"><span>${t('l_profit')}</span><span>${money(s.profit)}</span></div></div>` +
    (noCost.length ? `<div class="warnbox">${esc(t('no_cost_warn', noCost.join(', ')))}</div>` : '') + `</section>`;
  const base = Math.max(0, s.profit);
  h += `<section class="panel" id="allocPanel"><div class="row"><h3>${t('alloc_title')}</h3><button class="btn sm" data-act="form" data-f="alloc">${t('change')}</button></div>` +
    (s.profit <= 0 ? `<p class="hint">${t('alloc_none')}</p>` : '') +
    `<div class="alloc">${alloc().map(a => `<div><div class="al-top"><span>${esc(aname(a))}<small>${qn(a.pct)}%</small></span><b class="num">${money(base * n(a.pct) / 100)}</b></div><div class="al-bar"><i style="width:${Math.max(0, Math.min(100, n(a.pct)))}%"></i></div></div>`).join('')}</div></section>`;
  h += chartPanel();
  const by = Object.keys(s.by).map(id => Object.assign({ id }, s.by[id])).sort((a, b) => b.rev - a.rev);
  if (by.length) h += `<section class="panel" id="prodPanel"><h3>${t('byprod_title')}</h3><div class="tw"><table><thead><tr><th>${t('th_product')}</th><th class="r">${t('th_qty')}</th><th class="r">${t('th_sales')}</th><th class="r">${t('th_profit')}</th></tr></thead><tbody>${by.map(b => `<tr><td>${esc(pname(b.id) || t('no_product'))}</td><td class="r">${qn(b.q)}</td><td class="r">${money(b.rev)}</td><td class="r">${money(b.rev - b.cogs)}</td></tr>`).join('')}</tbody></table></div></section>`;
  h += `<section class="panel" id="owedPanel"><h3>${t('owed_title')}</h3>` + (owed.length ? `<div>${owed.slice(0, 10).map(x =>
    `<div class="li"><div><div class="who">${esc(cname(x.customerId) || t('no_customer'))}</div><div class="meta">${nice(x.date)} · ${esc(pname(x.productId))} ×&nbsp;${qn(x.qty)}</div></div><div class="right"><b class="num">${money(n(x.qty) * n(x.price))}</b><button class="btn sm" data-act="paid" data-id="${x.id}">${t('mark_paid')}</button></div></div>`).join('')}</div>` : `<p class="hint">${t('owed_none')}</p>`) + `</section>`;
  const st = customerStats(), due = rows('customers').filter(c => st[c.id].due).sort((a, b) => st[b.id].since - st[a.id].since);
  h += `<section class="panel" id="duePanel"><h3>${t('due_title')}</h3><p class="hint">${t('due_hint')}</p>` + (due.length ? `<div>${due.slice(0, 10).map(c => { const x = st[c.id]; return `<div class="li"><div><div class="who">${esc(c.name)}</div><div class="meta">${t('due_meta', Math.round(x.gap), daysAgo(x.since))}</div></div><div class="right">${chip(x.due[0], t(x.due[1]))}${c.phone ? `<a class="btn sm" href="tel:${esc(String(c.phone).replace(/[^\d+]/g, ''))}">${t('call')}</a>` : ''}</div></div>`; }).join('')}</div>` : `<p class="hint">${t('due_none')}</p>`) + `</section>`;
  return h;
}
function buckets(p) {
  const now = new Date(), out = [], k = cal();
  const day = (d, lab) => ({ from: iso(d), to: iso(d), lab, tip: nice(iso(d)) });
  if (p === 'week') { const m = new Date(now); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); for (let i = 0; i < 7; i++) { const d = new Date(m); d.setDate(m.getDate() + i); out.push(day(d, k.day[i])); } return { unit: 'u_day', b: out, every: 1 }; }
  if (p === 'month' || p === 'lastmonth') { const y = now.getFullYear(), mo = now.getMonth() - (p === 'month' ? 0 : 1), last = new Date(y, mo + 1, 0).getDate(); for (let i = 1; i <= last; i++) out.push(day(new Date(y, mo, i), String(i))); return { unit: 'u_day', b: out, every: 5 }; }
  const month = (y, m) => { const a = new Date(y, m, 1), z = new Date(y, m + 1, 0); return { from: iso(a), to: iso(z), lab: k.mon[a.getMonth()], tip: k.monf[a.getMonth()] + ' ' + a.getFullYear() }; };
  if (p === 'year') { for (let m = 0; m < 12; m++) out.push(month(now.getFullYear(), m)); return { unit: 'u_month', b: out, every: 1 }; }
  const dates = [...rows('sales'), ...rows('losses'), ...rows('purchases')].map(x => x.date).filter(Boolean).sort();
  const first = dates.length ? pd(dates[0]) : now;
  const months = Math.max(1, (now.getFullYear() - first.getFullYear()) * 12 + now.getMonth() - first.getMonth() + 1);
  if (months > 24) { for (let y = first.getFullYear(); y <= now.getFullYear(); y++) out.push({ from: y + '-01-01', to: y + '-12-31', lab: String(y), tip: String(y) }); return { unit: 'u_year', b: out, every: 1 }; }
  for (let i = 0; i < months; i++) { const b = month(first.getFullYear(), first.getMonth() + i); if (months > 12) b.lab += " '" + String(pd(b.from).getFullYear()).slice(2); out.push(b); }
  return { unit: 'u_month', b: out, every: months > 12 ? 3 : 1 };
}
const niceStep = x => { if (x <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(x))), f = x / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; };
function chartPanel() {
  const { unit, b, every } = buckets(ui.period), td = today();
  const data = b.map(x => { const s = summary([x.from, x.to]); return Object.assign({ rev: s.rev, pro: s.profit, future: x.from > td }, x); });
  const W = Math.max(280, Math.min(726, ($('#view').clientWidth || 360) - 66)), H = 220, Lf = 44, R = 6, T = 14, B = 26;
  let max = Math.max(1, ...data.map(m => Math.max(m.rev, m.pro))), min = Math.min(0, ...data.map(m => m.pro));
  const step = niceStep((max - min) / 4); max = Math.ceil(max / step) * step; min = Math.floor(min / step) * step;
  const y = v => T + (max - v) / (max - min) * (H - T - B);
  const cw = (W - Lf - R) / data.length, bw = Math.max(2, Math.min(26, cw * 0.38)), gap = cw > 12 ? 2 : 1, lab = W < 480 && every === 5 ? 10 : every;
  let g = '';
  for (let v = min; v <= max + 1e-6; v += step) g += `<line x1="${Lf}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${Lf - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${short(v)}</text>`;
  g += `<line x1="${Lf}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}" stroke="var(--muted)" stroke-width="1"/>`;
  data.forEach((m, i) => {
    const cx = Lf + cw * i + cw / 2, isNow = m.from <= td && td <= m.to, r1 = y(m.rev), p0 = y(Math.max(0, m.pro)), p1 = y(Math.min(0, m.pro));
    g += `<g><title>${esc(t('chart_tip', m.tip, money(m.rev), money(m.pro)))}</title><rect x="${cx - cw / 2}" y="${T}" width="${cw}" height="${H - T - B}" fill="transparent"/>` +
      `<rect x="${cx - bw - gap / 2}" y="${r1}" width="${bw}" height="${Math.max(0, y(0) - r1)}" rx="1.5" fill="var(--ink)"/>` +
      `<rect x="${cx + gap / 2}" y="${p0}" width="${bw}" height="${Math.max(0, p1 - p0)}" rx="1.5" fill="var(--red)"/></g>`;
    if (i % lab === 0 || isNow || (lab > 1 && i === data.length - 1 && (data.length - 1) % lab >= 3)) g += `<text x="${cx}" y="${H - 8}" text-anchor="middle" font-size="11" fill="${m.future ? 'var(--line)' : 'var(--muted)'}" font-weight="${isNow ? 700 : 400}">${esc(m.lab)}</text>`;
  });
  const title = t('chart_title', t(unit));
  return `<section class="panel chart" id="chartPanel"><div class="row"><h3>${title}</h3><div class="legend"><span><i style="background:var(--ink)"></i>${t('lg_sales')}</span><span><i style="background:var(--red)"></i>${t('lg_profit')}</span></div></div><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}" font-family="Barlow, system-ui, sans-serif">${g}</svg></section>`;
}

function listHead(title, f, addLabel, search) {
  return `<div class="row"><h2>${title}</h2><button class="btn primary" id="addBtn" data-act="new" data-f="${f}">+ ${addLabel}</button></div>` +
    (search ? `<input class="search" type="search" id="q" value="${esc(ui.q[search] || '')}" placeholder="${esc(t('search_' + search))}" aria-label="${esc(t('search_' + search))}" data-q="${search}">` : '');
}
const more = total => total > ui.limit ? `<button class="btn block" data-act="more">${t('show_more')}</button>` : '';
function saleCard(x) {
  const c = cname(x.customerId);
  return `<button class="card" data-act="edit" data-f="sale" data-id="${x.id}"><span class="c1"><b>${esc(pname(x.productId) || t('no_product'))} <span class="x">× ${qn(x.qty)}</span></b><b class="num">${money(n(x.qty) * n(x.price))}</b></span>` +
    `<span class="c2"><span>${nice(x.date)} · ${c ? esc(c) : `<em>${t('no_customer')}</em>`} · ${esc(mlabel(x.method))}</span>${x.paid === false ? chip('bad', t('unpaid')) : chip('good', t('paid'))}</span>` +
    (x.notes ? `<span class="c3">${esc(x.notes)}</span>` : '') + `<span class="edit">${t('edit')} ›</span></button>`;
}
function listSales() {
  const q = ui.q.sales.trim().toLowerCase();
  let l = rows('sales').sort(byDateDesc);
  if (q) l = l.filter(x => (pname(x.productId) + ' ' + cname(x.customerId) + ' ' + (x.notes || '') + ' ' + mlabel(x.method)).toLowerCase().includes(q));
  if (!l.length) return `<div class="empty">${q ? t('no_match') : t('sales_empty')}</div>`;
  return l.slice(0, ui.limit).map(saleCard).join('') + more(l.length);
}
const vSales = () => listHead(t('sales_title'), 'sale', t('new_sale'), 'sales') + `<div class="list" id="list">${listSales()}</div>`;
function vCosts() {
  const p = ui.costTab === 'purchases';
  let h = listHead(t('costs_title'), p ? 'purchase' : 'loss', p ? t('new_purchase') : t('new_loss')) +
    `<div class="seg" id="costSeg" role="group"><button type="button" data-act="costtab" data-v="purchases" aria-pressed="${p}">${t('tab_purchases')}</button><button type="button" data-act="costtab" data-v="losses" aria-pressed="${!p}">${t('tab_losses')}</button></div><div class="list" id="list">`;
  if (p) {
    const l = rows('purchases').sort(byDateDesc);
    h += l.length ? l.slice(0, ui.limit).map(x => { const q = n(x.qty), tot = q * n(x.cost) + n(x.transport); return `<button class="card" data-act="edit" data-f="purchase" data-id="${x.id}"><span class="c1"><b>${esc(pname(x.productId) || t('no_product'))} <span class="x">× ${qn(q)}</span></b><b class="num">${money(tot)}</b></span><span class="c2"><span>${nice(x.date)}${x.supplier ? ' · ' + esc(x.supplier) : ''}</span></span><span class="c3">${esc(t('p_meta', money(n(x.cost)), money(n(x.transport)), q ? money(tot / q) : '—'))}</span>${x.notes ? `<span class="c3">${esc(x.notes)}</span>` : ''}<span class="edit">${t('edit')} ›</span></button>`; }).join('') + more(l.length) : `<div class="empty">${t('purchases_empty')}</div>`;
  } else {
    const l = rows('losses').sort(byDateDesc);
    h += l.length ? l.slice(0, ui.limit).map(x => `<button class="card" data-act="edit" data-f="loss" data-id="${x.id}"><span class="c1"><b>${esc(rlabel(x.reason))}</b><b class="num">${money(lossValue(x))}</b></span><span class="c2"><span>${nice(x.date)}${n(x.qty) ? ' · ' + esc(pname(x.productId) || t('no_product')) + ' × ' + qn(x.qty) : ''}${n(x.extra) ? ' · ' + esc(t('other_money', money(n(x.extra)))) : ''}</span></span>${x.notes ? `<span class="c3">${esc(x.notes)}</span>` : ''}<span class="edit">${t('edit')} ›</span></button>`).join('') + more(l.length) : `<div class="empty">${t('losses_empty')}</div>`;
  }
  return h + `</div>`;
}
function listCustomers() {
  const st = customerStats(), q = ui.q.customers.trim().toLowerCase();
  let l = rows('customers').sort((a, b) => st[b.id].spent - st[a.id].spent || String(a.name).localeCompare(String(b.name)));
  if (q) l = l.filter(c => ((c.name || '') + ' ' + (c.phone || '') + ' ' + (c.area || '')).toLowerCase().includes(q));
  if (!l.length) return `<div class="empty">${q ? t('no_match') : t('customers_empty')}</div>`;
  return l.slice(0, ui.limit).map(c => {
    const x = st[c.id], tel = String(c.phone || '').replace(/[^\d+]/g, '');
    return `<div class="cardwrap"><button class="card" data-act="edit" data-f="customer" data-id="${c.id}"><span class="c1"><b>${esc(c.name)}</b><span>${chip(x.freq[0], t(x.freq[1]))}${x.due ? ' ' + chip(x.due[0], t(x.due[1])) : ''}</span></span>` +
      `<span class="c2"><span>${esc([c.phone, c.area].filter(Boolean).join(' · ') || '—')}</span></span><span class="c3">${esc(t('c_meta', x.orders, money(x.spent)))}${x.last ? ' · ' + esc(t('c_last', daysAgo(x.since))) : ''}</span>${c.notes ? `<span class="c3">${esc(c.notes)}</span>` : ''}<span class="edit">${t('edit')} ›</span></button>` +
      (tel ? `<div class="acts"><a class="btn sm" href="tel:${esc(tel)}">${t('call')}</a><a class="btn sm" href="https://wa.me/${esc(waNumber(c.phone))}" target="_blank" rel="noopener">${t('whatsapp')}</a></div>` : '') + `</div>`;
  }).join('') + more(l.length);
}
const vCustomers = () => listHead(t('customers_title'), 'customer', t('new_customer'), 'customers') + `<div class="list" id="list">${listCustomers()}</div>`;
function vProducts() {
  const l = rows('products').sort((a, b) => (b.active !== false) - (a.active !== false) || String(a.name).localeCompare(String(b.name)));
  return `<div><button class="btn sm" data-act="nav" data-v="more">‹ ${t('back')}</button></div>` + listHead(t('products_title'), 'product', t('new_product')) + `<div class="list" id="list">` +
    (l.length ? l.map(p => { const c = C[p.id] || 0; return `<button class="card" data-act="edit" data-f="product" data-id="${p.id}"><span class="c1"><b>${esc(p.name)}</b><b class="num">${money(n(p.price))}</b></span><span class="c2"><span>${p.unit ? esc(t('per') + ' ' + p.unit) : ''}</span>${p.active === false ? chip('plain', t('hidden')) : ''}</span>${p.description ? `<span class="c3">${esc(p.description)}</span>` : ''}<span class="c3">${c > 0 ? esc(t('pr_meta', money(c), money(n(p.price) - c))) : t('pr_nocost')}</span><span class="edit">${t('edit')} ›</span></button>`; }).join('') : `<div class="empty">${t('products_empty')}</div>`) + `</div>`;
}
function vMore() {
  const d = dirtyCount(), biz = metaStr('business', '').trim();
  const syncSub = !L.syncUrl ? t('sync_menu_none') : d ? t('sync_menu_wait', d) : t('sync_menu_ok', ago(L.lastSync));
  return `<h2>${t('more_title')}</h2>` +
    `<div class="menu" id="menuMain"><button data-act="nav" data-v="products"><span><span class="mt">${t('products')}</span><br><span class="ms">${t('n_products', rows('products').length)}</span></span><span class="go">›</span></button>` +
    `<button data-act="form" data-f="alloc"><span><span class="mt">${t('alloc_menu')}</span><br><span class="ms">${esc(alloc().map(a => aname(a) + ' ' + qn(a.pct) + '%').join(' · '))}</span></span><span class="go">›</span></button>` +
    `<button data-act="form" data-f="business"><span><span class="mt">${t('business')}</span><br><span class="ms">${esc(biz || t('business_none'))}</span></span><span class="go">›</span></button>` +
    `<div class="mi"><span class="mt">${t('language')}</span><span class="seg" id="langSeg"><button type="button" data-act="lang" data-v="en" aria-pressed="${L.lang === 'en'}">English</button><button type="button" data-act="lang" data-v="sw" aria-pressed="${L.lang === 'sw'}">Kiswahili</button></span></div></div>` +
    `<div class="menu" id="menuSync"><button data-act="form" data-f="sync"><span><span class="mt">${t('sync_menu')}</span><br><span class="ms">${esc(syncSub)}</span></span><span class="go">›</span></button>` +
    `<button data-act="backup"><span><span class="mt">${t('backup')}</span><br><span class="ms">${t('backup_sub')}</span></span><span class="go">›</span></button>` +
    `<button data-act="restore"><span><span class="mt">${t('restore')}</span><br><span class="ms">${t('restore_sub')}</span></span><span class="go">›</span></button></div>` +
    `<div class="menu">${standalone() ? '' : `<button data-act="open-install" id="menuInstall"><span><span class="mt">${t('inst_menu')}</span><br><span class="ms">${t('inst_menu_sub')}</span></span><span class="go">›</span></button>`}<button data-act="tour"><span class="mt">${t('tutorial')}</span><span class="go">›</span></button></div>` +
    `<p class="foot">Daftari · ${t('version')} ${VERSION}</p><input type="file" id="restoreFile" accept="application/json,.json" hidden>`;
}
const VIEWS = { home: vHome, sales: vSales, costs: vCosts, customers: vCustomers, more: vMore, products: vProducts };
function render() {
  C = costMap();
  const a = document.activeElement, refocus = a && a.id === 'q';
  $('#view').innerHTML = (VIEWS[ui.view] || vHome)();
  if (refocus) { const el = $('#q'); if (el) { el.focus(); try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) {} } }
  if (tour.open) tour.place();
}
function renderAll() { renderChrome(); render(); }
function go(v) { ui.view = v; ui.limit = 60; renderAll(); window.scrollTo(0, 0); }

/* ======================= forms ======================= */
const v = id => { const el = document.getElementById(id); return el ? el.value : ''; };
const fld = (id, label, inner) => `<div class="f"><label for="${id}">${label}</label>${inner}</div>`;
const inp = (id, label, val, attrs) => fld(id, label, `<input id="${id}" value="${esc(val == null ? '' : val)}" ${attrs || ''}>`);
const num = (id, label, val, attrs) => inp(id, label, val, 'type="number" inputmode="decimal" min="0" step="any" ' + (attrs || ''));
const area = (id, label, val, ph) => fld(id, label, `<textarea id="${id}" placeholder="${esc(ph || '')}">${esc(val || '')}</textarea>`);
const sel = (id, label, opts, val) => fld(id, label, `<select id="${id}">${opts.map(o => `<option value="${esc(o[0])}"${String(o[0]) === String(val == null ? '' : val) ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`);
const head = title => `<div class="sheet-head"><h3 id="sheetTitle">${title}</h3><button type="button" data-act="close" aria-label="${t('close')}">×</button></div>`;
const foot = (id, saveLabel) => `<div class="msg" id="fmsg" role="alert"></div><div class="actions"><button class="btn primary" type="submit">${saveLabel || t('save')}</button>${id ? `<button class="btn danger" type="button" data-act="del">${t('delete')}</button>` : ''}<button class="btn" type="button" data-act="close">${t('cancel')}</button></div>`;
const fail = m => { $('#fmsg').textContent = m; return false; };
function productOpts(cur) { const l = rows('products').filter(p => p.active !== false || p.id === cur).sort((a, b) => String(a.name).localeCompare(String(b.name))); return l.map(p => [p.id, p.name + (p.unit ? ' (' + p.unit + ')' : '')]).concat([['__new', '+ ' + t('new_product')]]); }
function lastProduct() { const s = rows('sales').sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))[0]; if (s && get('products', s.productId) && get('products', s.productId).active !== false) return s.productId; const p = rows('products').filter(p => p.active !== false)[0]; return p ? p.id : '__new'; }
function resolveProduct(prefix, price) {
  let pid = v(prefix + '-product');
  if (pid === '__new') { const nm = v(prefix + '-pname').trim(); if (!nm) return fail(t('need_product_name')); pid = put('products', { name: nm, unit: '', price: prefix === 's' ? price : 0, cost: prefix === 't' ? price : 0, description: '', active: true }); }
  if (!pid) return fail(t('need_product'));
  return pid;
}
const newProductBox = (prefix, show) => `<div class="newbox" id="${prefix}-pbox"${show ? '' : ' hidden'}>${inp(prefix + '-pname', t('new_product_name'), '')}</div>`;

const FORMS = {
  sale: {
    tb: 'sales', title: id => id ? t('edit_sale') : t('new_sale'),
    html(id) {
      const x = id ? get('sales', id) : { date: today(), productId: lastProduct(), customerId: '', qty: '', method: 'Cash', paid: true, notes: '' };
      const p = get('products', x.productId), price = id ? x.price : (p ? p.price : '');
      const custs = rows('customers').sort((a, b) => String(a.name).localeCompare(String(b.name))).map(c => [c.id, c.name + (c.phone ? ' · ' + c.phone : '')]);
      return inp('s-date', t('date'), x.date, 'type="date" required') + sel('s-product', t('product'), productOpts(x.productId), x.productId) + newProductBox('s', x.productId === '__new') +
        sel('s-customer', t('customer'), [['', t('no_customer')], ['__new', '+ ' + t('new_customer')]].concat(custs), x.customerId) +
        `<div class="newbox" id="s-cbox" hidden>${inp('s-cname', t('new_customer_name'), '')}${inp('s-cphone', t('phone'), '', 'inputmode="tel" placeholder="07…"')}</div>` +
        `<div class="f2">${num('s-qty', `<span id="s-qtylab">${t('qty')}</span>`, x.qty, 'required')}${num('s-price', t('unit_price'), price, 'required')}</div><div class="calc" id="s-total"></div>` +
        `<div class="f2">${sel('s-method', t('method'), METHODS.map(m => [m, mlabel(m)]), x.method || 'Cash')}${sel('s-paid', t('payment'), [['yes', t('pay_yes')], ['no', t('pay_no')]], x.paid === false ? 'no' : 'yes')}</div>` + area('s-notes', t('notes'), x.notes);
    },
    init() {
      const calc = () => { $('#s-total').textContent = t('total') + ': ' + money(n(v('s-qty')) * n(v('s-price'))); };
      const unit = () => { const p = get('products', v('s-product')); $('#s-qtylab').textContent = t('qty') + (p && p.unit ? ' (' + p.unit + ')' : ''); };
      $('#s-product').addEventListener('change', () => { const pid = v('s-product'), p = get('products', pid); $('#s-pbox').hidden = pid !== '__new'; if (p) $('#s-price').value = p.price; if (pid === '__new') { $('#s-price').value = ''; $('#s-pname').focus(); } unit(); calc(); });
      $('#s-customer').addEventListener('change', () => { $('#s-cbox').hidden = v('s-customer') !== '__new'; if (v('s-customer') === '__new') $('#s-cname').focus(); });
      $('#s-qty').addEventListener('input', calc); $('#s-price').addEventListener('input', calc); unit(); calc();
    },
    save(id) {
      const qty = n(v('s-qty')), price = n(v('s-price'));
      if (!(qty > 0)) return fail(t('need_qty'));
      if (v('s-customer') === '__new' && !v('s-cname').trim()) return fail(t('need_customer_name'));
      const pid = resolveProduct('s', price); if (!pid) return false;
      let cid = v('s-customer'); if (cid === '__new') cid = put('customers', { name: v('s-cname').trim(), phone: v('s-cphone').trim(), area: '', notes: '' });
      put('sales', Object.assign({}, id ? get('sales', id) : {}, { date: v('s-date') || today(), productId: pid, customerId: cid || '', qty, price, method: v('s-method'), paid: v('s-paid') === 'yes', notes: v('s-notes').trim() }));
      return true;
    }
  },
  purchase: {
    tb: 'purchases', title: id => id ? t('edit_purchase') : t('new_purchase'),
    html(id) {
      const x = id ? get('purchases', id) : { date: today(), productId: lastProduct(), supplier: '', qty: '', cost: '', transport: 0, notes: '' };
      return inp('t-date', t('date'), x.date, 'type="date" required') + sel('t-product', t('product'), productOpts(x.productId), x.productId) + newProductBox('t', x.productId === '__new') + inp('t-supplier', t('supplier'), x.supplier) +
        `<div class="f2">${num('t-qty', t('qty'), x.qty, 'required')}${num('t-cost', t('cost_each'), x.cost, 'required')}</div>` + num('t-transport', t('transport'), x.transport) + `<div class="calc" id="t-total"></div>` + area('t-notes', t('notes'), x.notes);
    },
    init() {
      const calc = () => { const q = n(v('t-qty')), tot = q * n(v('t-cost')) + n(v('t-transport')); $('#t-total').textContent = t('total') + ': ' + money(tot) + (q ? ' · ' + t('with_transport', money(tot / q)) : ''); };
      $('#t-product').addEventListener('change', () => { $('#t-pbox').hidden = v('t-product') !== '__new'; if (v('t-product') === '__new') $('#t-pname').focus(); });
      ['t-qty', 't-cost', 't-transport'].forEach(i => document.getElementById(i).addEventListener('input', calc)); calc();
    },
    save(id) {
      const qty = n(v('t-qty')); if (!(qty > 0)) return fail(t('need_qty'));
      const pid = resolveProduct('t', n(v('t-cost'))); if (!pid) return false;
      put('purchases', Object.assign({}, id ? get('purchases', id) : {}, { date: v('t-date') || today(), productId: pid, supplier: v('t-supplier').trim(), qty, cost: n(v('t-cost')), transport: n(v('t-transport')), notes: v('t-notes').trim() }));
      return true;
    }
  },
  loss: {
    tb: 'losses', title: id => id ? t('edit_loss') : t('new_loss'),
    html(id) {
      const x = id ? get('losses', id) : { date: today(), reason: REASONS[0], productId: '', qty: 0, extra: 0, notes: '' };
      const prods = rows('products').sort((a, b) => String(a.name).localeCompare(String(b.name))).map(p => [p.id, p.name]);
      const reasons = REASONS.map((r, i) => [r, t('r_' + i)]); if (x.reason && REASONS.indexOf(x.reason) < 0) reasons.push([x.reason, x.reason]);
      return inp('l-date', t('date'), x.date, 'type="date" required') + sel('l-reason', t('reason'), reasons, x.reason) + sel('l-product', t('product'), [['', t('money_only')]].concat(prods), x.productId) +
        `<div class="f2">${num('l-qty', t('qty_lost'), x.qty)}${num('l-extra', t('extra'), x.extra)}</div><p class="hint">${t('loss_hint')}</p><div class="calc" id="l-total"></div>` + area('l-notes', t('notes'), x.notes);
    },
    init() {
      const calc = () => { $('#l-total').textContent = t('loss_value') + ': ' + money(n(v('l-qty')) * (C[v('l-product')] || 0) + n(v('l-extra'))); };
      ['l-qty', 'l-extra', 'l-product'].forEach(i => document.getElementById(i).addEventListener('input', calc)); calc();
    },
    save(id) {
      const qty = n(v('l-qty')), extra = n(v('l-extra'));
      if (!(qty > 0) && !(extra > 0)) return fail(t('need_loss'));
      if (qty > 0 && !v('l-product')) return fail(t('need_loss_product'));
      put('losses', Object.assign({}, id ? get('losses', id) : {}, { date: v('l-date') || today(), reason: v('l-reason'), productId: v('l-product'), qty, extra, notes: v('l-notes').trim() }));
      return true;
    }
  },
  customer: {
    tb: 'customers', title: id => id ? t('edit_customer') : t('new_customer'),
    html(id) { const x = id ? get('customers', id) : {}; return inp('c-name', t('name'), x.name, 'required') + inp('c-phone', t('phone'), x.phone, 'inputmode="tel" placeholder="07…"') + inp('c-area', t('area'), x.area) + area('c-notes', t('notes'), x.notes); },
    save(id) {
      const name = v('c-name').trim(); if (!name) return fail(t('need_name'));
      const old = id ? get('customers', id) : null;
      put('customers', Object.assign({}, old || {}, { name, phone: v('c-phone').trim(), area: v('c-area').trim(), notes: v('c-notes').trim() }));
      if (old && old.name !== name) touch('sales', s => s.customerId === id);
      return true;
    },
    canDelete(id) { return rows('sales').some(s => s.customerId === id) ? t('has_sales') : ''; }
  },
  product: {
    tb: 'products', title: id => id ? t('edit_product') : t('new_product'),
    html(id) {
      const x = id ? get('products', id) : { active: true };
      return inp('p-name', t('name'), x.name, 'required') + `<div class="f2">${num('p-price', t('price'), x.price, 'required')}${inp('p-unit', t('unit'), x.unit, `placeholder="${esc(t('unit_ph'))}"`)}</div>` +
        num('p-cost', t('usual_cost'), x.cost || '') + `<p class="hint">${t('usual_cost_hint')}</p>` + area('p-desc', t('description'), x.description) +
        `<label class="check"><input type="checkbox" id="p-active"${x.active === false ? '' : ' checked'}><span>${t('active')}</span></label>`;
    },
    save(id) {
      const name = v('p-name').trim(); if (!name) return fail(t('need_name'));
      const old = id ? get('products', id) : null;
      put('products', Object.assign({}, old || {}, { name, unit: v('p-unit').trim(), price: n(v('p-price')), cost: n(v('p-cost')), description: v('p-desc').trim(), active: $('#p-active').checked }));
      if (old && old.name !== name) ['sales', 'purchases', 'losses'].forEach(tb => touch(tb, r => r.productId === id));
      return true;
    },
    canDelete(id) { return ['sales', 'purchases', 'losses'].some(tb => rows(tb).some(r => r.productId === id)) ? t('product_used') : ''; }
  },
  business: {
    title: () => t('business'),
    html() { return inp('b-name', t('business'), metaStr('business', ''), `placeholder="${esc(t('business_ph'))}" maxlength="40"`); },
    save() { setMeta('business', v('b-name').trim()); return true; }
  },
  alloc: {
    title: () => t('alloc_edit'), custom: true,
    html() {
      ui.al = alloc().map(a => ({ id: a.id, key: a.key || '', name: aname(a), pct: n(a.pct) }));
      return `<p class="hint">${t('alloc_hint')}</p><div class="alloc" id="alRows"></div><button type="button" class="btn" data-act="al-add">+ ${t('alloc_add')}</button><div class="al-total" id="alTotal"></div><div class="msg" id="fmsg" role="alert"></div>` +
        `<div class="actions"><button class="btn primary" type="submit" id="alSave">${t('save')}</button><button class="btn" type="button" data-act="al-reset">${t('alloc_reset')}</button><button class="btn" type="button" data-act="close">${t('cancel')}</button></div>`;
    },
    init() { drawAl(); $('#alRows').addEventListener('input', () => { readAl(); totalAl(); }); },
    save() {
      readAl(); const sum = ui.al.reduce((a, x) => a + x.pct, 0);
      if (ui.al.some(a => !a.name.trim())) return fail(t('alloc_names'));
      if (!ui.al.length || Math.abs(sum - 100) > 0.01) return fail(t('alloc_need', qn(sum)));
      setMeta('alloc', JSON.stringify(ui.al.map(a => { const isDefault = a.key && (a.name.trim() === I18N.en['al_' + a.key] || a.name.trim() === I18N.sw['al_' + a.key]); return isDefault ? { id: a.id, key: a.key, pct: a.pct } : { id: a.id, name: a.name.trim(), pct: a.pct }; })));
      return true;
    }
  },
  sync: {
    title: () => t('sync_title'), custom: true,
    html() {
      const d = dirtyCount(), st = !L.syncUrl ? t('sync_none') : L.lastError === 'net' ? t('sync_off') : L.lastError ? t('sync_err') : t('sync_ok');
      const locked = DEFAULT_URL || (L.linked && !ui.relink), id = (L.syncUrl.match(/\/s\/([^/]+)\//) || [])[1] || L.syncUrl;
      const field = inp('y-url', t('sync_link'), L.syncUrl, 'type="url" inputmode="url" placeholder="https://script.google.com/macros/s/…/exec" autocapitalize="off" autocomplete="off" spellcheck="false"');
      return `<p class="hint">${t(DEFAULT_URL ? 'sync_fixed' : L.linked ? 'sync_linked' : 'sync_hint')}</p>` + (locked ? '' : (L.linked ? `<div class="warnbox">${t('relink_warn')}</div>` : '') + field) +
        `<div class="ledger">${locked ? `<div><span>${t('sync_link')}</span><span id="linkId">${esc(id.length > 14 ? id.slice(0, 8) + '…' + id.slice(-4) : id)}</span></div>` : ''}<div><span>${t('st_status')}</span><span>${esc(st)}</span></div><div><span>${t('st_last')}</span><span>${esc(ago(L.lastSync))}</span></div><div><span>${t('st_wait')}</span><span>${d}</span></div></div><div class="msg" id="fmsg" role="alert"></div>` +
        `<div class="actions"><button class="btn primary" type="submit" id="syncSave">${t(locked ? 'sync_now' : 'sync_save')}</button>${L.sheetUrl ? `<a class="btn" href="${esc(L.sheetUrl)}" target="_blank" rel="noopener">${t('open_sheet')}</a>` : ''}${locked && !DEFAULT_URL ? `<button class="btn" type="button" data-act="relink">${t('change_link')}</button>` : ''}<button class="btn" type="button" data-act="close">${t('cancel')}</button></div>`;
    },
    async save() {
      const url = DEFAULT_URL || ($('#y-url') ? v('y-url').trim() : L.syncUrl);
      if (!validUrl(url)) return fail(t('sync_bad_url'));
      const b = $('#syncSave'), label = b ? b.textContent : ''; if (b) { b.disabled = true; b.textContent = t('sync_busy') + '…'; }
      await idle();
      const prev = { syncUrl: L.syncUrl, cursor: L.cursor, sheetUrl: L.sheetUrl };
      setLink(url); await persistLocal();
      const ok = await sync();
      if (!ok) { const why = errText(); if (url !== prev.syncUrl) { Object.assign(L, prev); await persistLocal(); renderChrome(); } if (b) { b.disabled = false; b.textContent = label; } return fail(why); }
      toast(t('sync_done')); return true;
    }
  }
};
function drawAl() {
  $('#alRows').innerHTML = ui.al.map((a, i) => `<div class="al-row"><input class="al-name" data-i="${i}" value="${esc(a.name)}" aria-label="${t('category')} ${i + 1}" maxlength="40"><span class="pct"><input class="al-pct" data-i="${i}" type="number" inputmode="decimal" min="0" max="100" step="any" value="${a.pct}" aria-label="${t('percent')} ${i + 1}"></span><button type="button" class="icon-btn" data-act="al-del" data-i="${i}" aria-label="${t('remove')}">×</button></div>`).join('');
  totalAl();
}
function readAl() { document.querySelectorAll('#alRows .al-row').forEach((row, i) => { if (!ui.al[i]) return; ui.al[i].name = row.querySelector('.al-name').value; ui.al[i].pct = n(row.querySelector('.al-pct').value); }); }
function totalAl() { const sum = ui.al.reduce((a, x) => a + x.pct, 0), ok = Math.abs(sum - 100) <= 0.01; const el = $('#alTotal'); el.className = 'al-total' + (ok ? '' : ' bad'); el.innerHTML = `<span>${t('alloc_total')}</span><span>${qn(sum)}%</span>`; $('#fmsg').textContent = ok ? '' : t('alloc_need', qn(sum)); }

function openForm(f, id) {
  const F = FORMS[f]; if (!F) return;
  if (id && F.tb && !get(F.tb, id)) return;
  ui.form = { f, id: id || '' };
  $('#sheet').innerHTML = head(F.title(id)) + `<form id="form" novalidate>${F.html(id)}${F.custom ? '' : foot(id)}</form>`;
  $('#sheet').setAttribute('aria-labelledby', 'sheetTitle');
  $('#sheet').hidden = false; $('#scrim').hidden = false; $('#sheet').scrollTop = 0;
  if (F.init) F.init(id);
  $('#form').addEventListener('submit', async e => {
    e.preventDefault(); $('#fmsg').textContent = '';
    const ok = await F.save(ui.form.id);
    if (ok) { closeForm(); if (f !== 'sync') toast(t('saved')); renderAll(); }
  });
}
function closeForm() { ui.form = null; $('#sheet').hidden = true; $('#scrim').hidden = true; $('#sheet').innerHTML = ''; }
let toastTimer = 0;
function toast(m) { const el = $('#toast'); el.textContent = m; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 2600); }

/* ======================= backup ======================= */
function backup() {
  const blob = new Blob([JSON.stringify({ app: 'daftari', v: 1, exported: new Date().toISOString(), db: DB })], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'daftari-backup-' + today() + '.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}
async function restore(file) {
  try {
    const data = JSON.parse(await file.text()); if (!data || data.app !== 'daftari' || !data.db) throw 0;
    let c = 0; TABLES.forEach(tb => { Object.values(data.db[tb] || {}).forEach(r => { if (applyRow(tb, r)) { DB[tb][String(r.id)]._dirty = 1; c++; } }); persist(tb); });
    toast(t('restored', c)); queueSync(); renderAll();
  } catch (e) { toast(t('restore_bad')); }
}

/* ======================= tutorial ======================= */
const STEPS = [['home', '.band'], ['home', '.nav'], ['home', '#periodSeg'], ['home', '.kpis'], ['home', '#ledgerPanel'], ['home', '#allocPanel'], ['home', '#chartPanel'], ['sales', '#addBtn'], ['sales', '#list'], ['costs', '#costSeg'], ['customers', '#list'], ['more', '#menuMain'], ['more', '#menuSync'], ['home', '.band']];
const tour = {
  open: false, i: 0, el: null, nodes: null,
  start() {
    closeForm(); this.open = true;
    const c = document.createElement('div'); c.className = 'tourcatch';
    const sp = document.createElement('div'); sp.className = 'spot';
    const card = document.createElement('div'); card.className = 'tour bottom'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true'); card.setAttribute('aria-labelledby', 'tourH');
    card.innerHTML = `<div class="bar"><b id="tourBar"></b></div><span class="cnt" id="tourCnt"></span><h4 id="tourH"></h4><p id="tourP"></p><div class="actions"><button class="btn" type="button" id="tourX">${t('close')}</button><span class="actions"><button class="btn" type="button" id="tourB">${t('prev')}</button><button class="btn primary" type="button" id="tourN">${t('next')}</button></span></div>`;
    document.body.append(c, sp, card); this.nodes = [c, sp, card]; this.sp = sp; this.card = card;
    $('#tourX').onclick = () => this.close(); $('#tourB').onclick = () => this.go(this.i - 1); $('#tourN').onclick = () => this.i === STEPS.length - 1 ? this.close() : this.go(this.i + 1);
    this.onKey = e => { if (e.key === 'Escape') this.close(); else if (e.key === 'ArrowRight') $('#tourN').click(); else if (e.key === 'ArrowLeft' && this.i > 0) this.go(this.i - 1); };
    this.onMove = () => this.place();
    document.addEventListener('keydown', this.onKey); window.addEventListener('scroll', this.onMove, { passive: true }); window.addEventListener('resize', this.onMove);
    this.go(0);
  },
  go(i) {
    this.i = Math.max(0, Math.min(STEPS.length - 1, i)); const st = STEPS[this.i];
    if (ui.view !== st[0]) { ui.view = st[0]; renderAll(); }
    this.el = document.querySelector(st[1]);
    $('#tourCnt').textContent = t('tour_step', this.i + 1, STEPS.length); $('#tourH').textContent = t('t' + (this.i + 1) + 'h'); $('#tourP').textContent = t('t' + (this.i + 1) + 'p');
    $('#tourBar').style.width = ((this.i + 1) / STEPS.length * 100) + '%';
    $('#tourB').disabled = this.i === 0; $('#tourN').textContent = this.i === STEPS.length - 1 ? t('finish') : t('next');
    const fixed = st[1] === '.band' || st[1] === '.nav';
    if (this.el && !fixed) { const r = this.el.getBoundingClientRect(), bandH = $('.band').offsetHeight; window.scrollTo({ top: Math.max(0, r.top + window.scrollY - bandH - 16), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
    else if (!fixed) window.scrollTo(0, 0);
    this.card.className = 'tour ' + (st[1] === '.nav' ? 'top' : 'bottom');
    this.place(); setTimeout(() => this.place(), 350); $('#tourN').focus({ preventScroll: true });
  },
  place() {
    if (!this.open || !this.sp) return; const el = this.el;
    if (!el) { this.sp.style.cssText = 'width:0;height:0;top:50%;left:50%'; return; }
    const r = el.getBoundingClientRect(), p = 5;
    Object.assign(this.sp.style, { top: (r.top - p) + 'px', left: Math.max(2, r.left - p) + 'px', width: Math.min(window.innerWidth - 4, r.width + p * 2) + 'px', height: (r.height + p * 2) + 'px' });
  },
  close() { this.open = false; (this.nodes || []).forEach(x => x.remove()); this.nodes = null; this.sp = null; document.removeEventListener('keydown', this.onKey); window.removeEventListener('scroll', this.onMove); window.removeEventListener('resize', this.onMove); go('home'); }
};

/* ======================= events ======================= */
const ACT = {
  nav: b => go(b.dataset.v),
  period: b => { ui.period = b.dataset.p; render(); },
  costtab: b => { ui.costTab = b.dataset.v; ui.limit = 60; render(); },
  lang: b => { L.lang = b.dataset.v; persistLocal(); renderAll(); if (ui.installOpen) showInstall(); else if (!$('#gate').hidden) showGate(); },
  'open-install': () => showInstall(),
  install: async b => { if (!installEvt) return; b.disabled = true; const e = installEvt; installEvt = null; try { e.prompt(); const c = await e.userChoice; if (c && c.outcome === 'accepted') installed = true; } catch (x) {} showInstall(); },
  'skip-install': () => { if (!L.skipInstall) { L.skipInstall = true; persistLocal(); } window.__daftari.ready = proceed(); },
  new: b => openForm(b.dataset.f),
  edit: b => openForm(b.dataset.f, b.dataset.id),
  form: b => { ui.relink = false; openForm(b.dataset.f); },
  relink: () => { ui.relink = true; openForm('sync'); },
  close: () => closeForm(),
  more: () => { ui.limit += 100; render(); },
  tour: () => { if (tour.open) tour.close(); else tour.start(); },
  paid: b => { const s = get('sales', b.dataset.id); if (s) { put('sales', Object.assign({}, s, { paid: true })); toast(t('saved')); renderAll(); } },
  del: b => {
    const f = ui.form; if (!f || !f.id) return; const F = FORMS[f.f];
    const why = F.canDelete ? F.canDelete(f.id) : ''; if (why) return fail(why);
    if (!b.classList.contains('armed')) { b.classList.add('armed'); b.textContent = t('confirm_delete'); setTimeout(() => { if (b.isConnected) { b.classList.remove('armed'); b.textContent = t('delete'); } }, 4000); return; }
    remove(F.tb, f.id); closeForm(); toast(t('deleted')); renderAll();
  },
  'al-add': () => { readAl(); ui.al.push({ id: uid(), key: '', name: '', pct: 0 }); drawAl(); const r = document.querySelectorAll('#alRows .al-name'); r[r.length - 1].focus(); },
  'al-del': b => { readAl(); ui.al.splice(+b.dataset.i, 1); drawAl(); },
  'al-reset': () => { ui.al = DEFAULT_ALLOC.map(a => ({ id: a.id, key: a.key, name: t('al_' + a.key), pct: a.pct })); drawAl(); },
  backup: () => backup(),
  restore: () => { const f = $('#restoreFile'); if (f) f.click(); }
};
document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b) return; const fn = ACT[b.dataset.act]; if (fn) fn(b, e); });
document.addEventListener('input', e => { const el = e.target; if (el.id === 'q') { ui.q[el.dataset.q] = el.value; ui.limit = 60; $('#list').innerHTML = el.dataset.q === 'sales' ? listSales() : listCustomers(); } });
document.addEventListener('change', e => { if (e.target.id === 'restoreFile' && e.target.files[0]) restore(e.target.files[0]); });
$('#scrim').addEventListener('click', closeForm);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && ui.form && !tour.open) closeForm(); });

/* ======================= boot ======================= */
async function boot() {
  await store.open();
  const got = await Promise.all([store.get('local')].concat(TABLES.map(tb => store.get('t_' + tb))));
  if (got[0]) Object.assign(L, got[0]);
  TABLES.forEach((tb, i) => { if (got[i + 1]) DB[tb] = got[i + 1]; });
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if (L.linked === undefined) L.linked = !!(L.syncUrl && L.lastSync);
  if (DEFAULT_URL && L.syncUrl !== DEFAULT_URL) { const was = L.linked; setLink(DEFAULT_URL); L.linked = was; persistLocal(); }
  renderAll();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
  window.addEventListener('online', () => { syncState = ''; renderChrome(); if (ui.installOpen) return; if (!L.linked) { if (DEFAULT_URL) gateConnect(); } else sync(); });
  window.addEventListener('offline', () => renderChrome());
  let rz = 0, lastW = window.innerWidth; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (window.innerWidth !== lastW) { lastW = window.innerWidth; if (ui.view === 'home') render(); } }, 200); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && L.linked) sync(); });
  setInterval(() => { if (document.visibilityState === 'visible' && !ui.form && L.linked) sync(); }, 120000);
  if (!standalone() && !L.skipInstall) showInstall(); else await proceed();
}
window.__daftari = { get DB() { return DB; }, get L() { return L; }, sync, ready: boot() };
})();
