import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_USER_ID = '00000000-0000-4000-8000-000000000001';

const categories = [
  'Clothes', 'Phones', 'Electronics', 'Furniture',
  'Books', 'Accessories', 'Collectibles', 'Other',
];

const conditions = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'] as const;

const indianCities = [
  { city: 'Mumbai, Maharashtra', lat: 19.0760, lng: 72.8777 },
  { city: 'Delhi, Delhi', lat: 28.7041, lng: 77.1025 },
  { city: 'Bangalore, Karnataka', lat: 12.9716, lng: 77.5946 },
  { city: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { city: 'Hyderabad, Telangana', lat: 17.3850, lng: 78.4867 },
  { city: 'Kolkata, West Bengal', lat: 22.5726, lng: 88.3639 },
  { city: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567 },
  { city: 'Ahmedabad, Gujarat', lat: 23.0225, lng: 72.5714 },
];

const productsData = [
  {
    title: 'Classic White Cotton Shirt',
    description: 'Premium quality cotton shirt in pristine white. Perfect for both casual and formal occasions. Features a modern slim fit design with button-down collar. Machine washable and wrinkle-resistant.',
    price: 1499,
    category: 'Clothes',
    condition: 'NEW',
    tags: ['shirt', 'cotton', 'formal', 'white', 'men'],
    location: 'Mumbai, Maharashtra',
    latitude: 19.0760, longitude: 72.8777,
  },
  {
    title: 'iPhone 15 Pro Max - 256GB',
    description: 'Excellent condition iPhone 15 Pro Max in Natural Titanium. Includes original box, charger, and case. Battery health at 92%. Unlocked for all carriers. No scratches on screen or body.',
    price: 89999,
    category: 'Phones',
    condition: 'LIKE_NEW',
    tags: ['iphone', 'apple', 'smartphone', '15-pro-max', 'premium'],
    location: 'Bangalore, Karnataka',
    latitude: 12.9716, longitude: 77.5946,
  },
  {
    title: 'Sony WH-1000XM5 Wireless Headphones',
    description: 'Industry-leading noise canceling headphones. 30-hour battery life, crystal clear calls, and exceptional comfort. Multipoint connection for seamless switching between devices.',
    price: 24999,
    category: 'Electronics',
    condition: 'NEW',
    tags: ['sony', 'headphones', 'wireless', 'noise-cancelling', 'audio'],
    location: 'Delhi, Delhi',
    latitude: 28.7041, longitude: 77.1025,
  },
  {
    title: 'Vintage Wooden Bookshelf - 6ft',
    description: 'Handcrafted solid teak wood bookshelf with 6 spacious shelves. Antique finish with intricate carvings. Perfect for living room or home library. Dimensions: 6ft x 3ft x 1.5ft.',
    price: 12999,
    category: 'Furniture',
    condition: 'GOOD',
    tags: ['bookshelf', 'wooden', 'vintage', 'teak', 'storage'],
    location: 'Pune, Maharashtra',
    latitude: 18.5204, longitude: 73.8567,
  },
  {
    title: 'The Great Gatsby - F. Scott Fitzgerald (First Edition)',
    description: 'First edition hardcover of this timeless classic. In remarkably good condition for its age. All pages intact with original dust jacket. A must-have for any book collector.',
    price: 2499,
    category: 'Books',
    condition: 'GOOD',
    tags: ['book', 'classic', 'fiction', 'vintage', 'collection'],
    location: 'Kolkata, West Bengal',
    latitude: 22.5726, longitude: 88.3639,
  },
  {
    title: 'Silver Chain Necklace - Handcrafted',
    description: '925 sterling silver chain necklace with elegant pendant. Handcrafted by skilled artisans. Hypoallergenic and tarnish-resistant. Comes with a beautiful gift box. Length: 20 inches.',
    price: 3499,
    category: 'Accessories',
    condition: 'NEW',
    tags: ['silver', 'necklace', 'handcrafted', 'jewelry', 'gift'],
    location: 'Jaipur, Rajasthan',
    latitude: 26.9124, longitude: 75.7873,
  },
  {
    title: 'Vintage Polaroid Camera - Works Perfectly',
    description: 'Rare vintage Polaroid Land Camera from the 1970s. Fully functional with all original accessories. Produces authentic instant photos with that classic vintage look. Great collector item.',
    price: 8999,
    category: 'Collectibles',
    condition: 'FAIR',
    tags: ['polaroid', 'vintage', 'camera', 'photography', 'retro'],
    location: 'Chennai, Tamil Nadu',
    latitude: 13.0827, longitude: 80.2707,
  },
  {
    title: 'Samsung 65" QLED 4K Smart TV',
    description: 'Stunning 65-inch QLED display with 4K resolution. Quantum HDR for vibrant colors. Smart TV with built-in streaming apps. Includes wall mount and all cables. Remote included.',
    price: 54999,
    category: 'Electronics',
    condition: 'LIKE_NEW',
    tags: ['samsung', 'tv', '4k', 'qled', 'smart-tv'],
    location: 'Hyderabad, Telangana',
    latitude: 17.3850, longitude: 78.4867,
  },
  {
    title: 'Leather Messenger Bag - Brown',
    description: 'Genuine full-grain leather messenger bag in rich brown. Spacious main compartment fits 15-inch laptop. Multiple pockets for organization. Brass hardware and adjustable shoulder strap.',
    price: 4999,
    category: 'Accessories',
    condition: 'NEW',
    tags: ['leather', 'bag', 'messenger', 'brown', 'laptop-bag'],
    location: 'Mumbai, Maharashtra',
    latitude: 19.0760, longitude: 72.8777,
  },
  {
    title: 'OnePlus 12 - 512GB (Flowy Emerald)',
    description: 'Flagship OnePlus 12 in stunning Flowy Emerald color. 512GB storage, 16GB RAM. Hasselblad camera system. 100W fast charging. Used for 2 months, immaculate condition with tempered glass and case.',
    price: 59999,
    category: 'Phones',
    condition: 'LIKE_NEW',
    tags: ['oneplus', 'smartphone', '5g', 'flagship', 'android'],
    location: 'Delhi, Delhi',
    latitude: 28.7041, longitude: 77.1025,
  },
  {
    title: 'Modern Desk Lamp - Minimal Design',
    description: 'Sleek adjustable LED desk lamp with 3 color temperatures and 5 brightness levels. Touch control with memory function. USB charging port built in. Perfect for home office or study.',
    price: 1999,
    category: 'Electronics',
    condition: 'NEW',
    tags: ['lamp', 'led', 'desk', 'office', 'minimal'],
    location: 'Bangalore, Karnataka',
    latitude: 12.9716, longitude: 77.5946,
  },
  {
    title: 'Cotton bedsheet set - King Size',
    description: 'Premium 100% organic cotton bedsheet set. 300 thread count for ultimate softness. Includes 1 fitted sheet, 1 flat sheet, and 2 pillow covers. Available in elegant stripe pattern. Machine washable.',
    price: 1299,
    category: 'Clothes',
    condition: 'NEW',
    tags: ['bedsheet', 'cotton', 'home', 'bedroom', 'king-size'],
    location: 'Ahmedabad, Gujarat',
    latitude: 23.0225, longitude: 72.5714,
  },
  {
    title: 'MacBook Pro 14" M3 Pro - 18GB RAM',
    description: 'Space Gray MacBook Pro with M3 Pro chip. 18GB unified memory, 512GB SSD. Stunning Liquid Retina XDR display. 18-hour battery life. Original charger included. Lightly used for video editing.',
    price: 149999,
    category: 'Electronics',
    condition: 'GOOD',
    tags: ['macbook', 'apple', 'laptop', 'm3-pro', 'premium'],
    location: 'Mumbai, Maharashtra',
    latitude: 19.0760, longitude: 72.8777,
  },
  {
    title: 'Handmade Clay Pottery Set - 6 Pieces',
    description: 'Beautiful handmade clay pottery set featuring 6 unique pieces. Each piece is individually crafted and glazed. Perfect for home decor or gifting. Earthy tones with modern aesthetic.',
    price: 2499,
    category: 'Collectibles',
    condition: 'NEW',
    tags: ['pottery', 'handmade', 'clay', 'decor', 'gift'],
    location: 'Jaipur, Rajasthan',
    latitude: 26.9124, longitude: 75.7873,
  },
  {
    title: 'Ergonomic Office Chair - High Back',
    description: 'Premium ergonomic office chair with lumbar support. Adjustable armrests, seat height, and recline tension. Breathable mesh back. 150kg weight capacity. Perfect for long work hours.',
    price: 15999,
    category: 'Furniture',
    condition: 'NEW',
    tags: ['chair', 'office', 'ergonomic', 'mesh', 'comfort'],
    location: 'Pune, Maharashtra',
    latitude: 18.5204, longitude: 73.8567,
  },
  {
    title: 'Harry Potter Box Set - 7 Books (Paperback)',
    description: 'Complete Harry Potter series box set. All 7 books in paperback. Excellent reading condition with minimal wear. Includes original box. Perfect for fans or as a gift.',
    price: 3499,
    category: 'Books',
    condition: 'GOOD',
    tags: ['harry-potter', 'books', 'box-set', 'fantasy', 'collection'],
    location: 'Kolkata, West Bengal',
    latitude: 22.5726, longitude: 88.3639,
  },
  {
    title: 'Nike Air Max 270 - White/Black',
    description: 'Authentic Nike Air Max 270 sneakers in classic white and black. Size UK 9 / US 10. Worn only twice. Minimal sole wear. Comes with original box. Super comfortable for daily wear.',
    price: 8999,
    category: 'Clothes',
    condition: 'LIKE_NEW',
    tags: ['nike', 'sneakers', 'shoes', 'air-max', 'sports'],
    location: 'Chennai, Tamil Nadu',
    latitude: 13.0827, longitude: 80.2707,
  },
  {
    title: 'Wireless Bluetooth Speaker - JBL Flip 6',
    description: 'JBL Flip 6 portable Bluetooth speaker. Rich deep bass with remarkable clarity. IP67 waterproof and dustproof. 12-hour playtime. Connects multiple speakers for stereo sound. Like new condition.',
    price: 7999,
    category: 'Electronics',
    condition: 'LIKE_NEW',
    tags: ['jbl', 'speaker', 'bluetooth', 'portable', 'audio'],
    location: 'Hyderabad, Telangana',
    latitude: 17.3850, longitude: 78.4867,
  },
  {
    title: 'Antique Brass Statue - Ganesha',
    description: 'Beautiful antique brass statue of Lord Ganesha. Intricate detailing with traditional craftsmanship. Approximately 50 years old. Height: 12 inches. Perfect for home temple or decor collection.',
    price: 5999,
    category: 'Collectibles',
    condition: 'FAIR',
    tags: ['antique', 'brass', 'statue', 'ganesha', 'traditional'],
    location: 'Chennai, Tamil Nadu',
    latitude: 13.0827, longitude: 80.2707,
  },
  {
    title: 'IKEA KALLAX Shelf Unit - White',
    description: 'IKEA KALLAX shelf unit in white. 4x4 cube configuration. Versatile storage for books, decor, or room dividers. Some minor scuffs on edges. All hardware included for easy assembly.',
    price: 4999,
    category: 'Furniture',
    condition: 'GOOD',
    tags: ['ikea', 'kallax', 'shelf', 'storage', 'white'],
    location: 'Delhi, Delhi',
    latitude: 28.7041, longitude: 77.1025,
  },
  {
    title: 'Gold Plated Earrings - Traditional Design',
    description: 'Elegant gold-plated earrings with traditional Kundan work. Lightweight and comfortable for all-day wear. Perfect for weddings and festive occasions. Comes with matching jewelry box.',
    price: 2499,
    category: 'Accessories',
    condition: 'NEW',
    tags: ['gold', 'earrings', 'traditional', 'kundan', 'wedding'],
    location: 'Jaipur, Rajasthan',
    latitude: 26.9124, longitude: 75.7873,
  },
  {
    title: 'Samsung Galaxy Tab S9 FE - 128GB',
    description: 'Samsung Galaxy Tab S9 FE with S Pen included. 10.9-inch display, 128GB storage. Perfect for note-taking, drawing, and media consumption. Used for 3 months. Includes original box and charger.',
    price: 27999,
    category: 'Electronics',
    condition: 'LIKE_NEW',
    tags: ['samsung', 'tablet', 'galaxy-tab', 's-pen', 'android'],
    location: 'Bangalore, Karnataka',
    latitude: 12.9716, longitude: 77.5946,
  },
  {
    title: 'Denim Jacket - Vintage Washed',
    description: 'Classic vintage-washed denim jacket in medium blue. Timeless style that goes with everything. Button-down front with chest pockets. Slightly worn look adds character. Size M, fits like L.',
    price: 2999,
    category: 'Clothes',
    condition: 'GOOD',
    tags: ['denim', 'jacket', 'vintage', 'casual', 'men'],
    location: 'Pune, Maharashtra',
    latitude: 18.5204, longitude: 73.8567,
  },
  {
    title: 'Atomic Habits - James Clear (Hardcover)',
    description: 'Bestselling self-improvement book in hardcover. An Easy and Proven Way to Build Good Habits and Break Bad Ones. Like new condition with no markings or highlights.',
    price: 899,
    category: 'Books',
    condition: 'LIKE_NEW',
    tags: ['self-help', 'habits', 'productivity', 'bestseller', 'psychology'],
    location: 'Mumbai, Maharashtra',
    latitude: 19.0760, longitude: 72.8777,
  },
  {
    title: 'PS5 Console - Disc Edition',
    description: 'PlayStation 5 Disc Edition in excellent condition. Includes 2 controllers, charging dock, and 3 games. 825GB SSD. Used sparingly. Original box included. No issues whatsoever.',
    price: 44999,
    category: 'Electronics',
    condition: 'GOOD',
    tags: ['ps5', 'playstation', 'gaming', 'console', 'sony'],
    location: 'Hyderabad, Telangana',
    latitude: 17.3850, longitude: 78.4867,
  },
  {
    title: 'Bamboo Plant in Ceramic Pot',
    description: 'Healthy indoor bamboo plant in a modern ceramic pot. Easy to maintain, purifies air. Pot has drainage hole. Plant height: 3 feet including pot. Perfect for home or office desk.',
    price: 799,
    category: 'Other',
    condition: 'NEW',
    tags: ['plant', 'bamboo', 'indoor', 'decor', 'green'],
    location: 'Bangalore, Karnataka',
    latitude: 12.9716, longitude: 77.5946,
  },
  {
    title: 'Google Pixel 8a - 128GB (Aloe)',
    description: 'Google Pixel 8a in Aloe green. 128GB storage, 8GB RAM. Amazing camera with Magic Eraser. 7 years of OS updates. Brand new, sealed box. Unlocked for all carriers.',
    price: 39999,
    category: 'Phones',
    condition: 'NEW',
    tags: ['google', 'pixel', 'smartphone', 'camera', 'android'],
    location: 'Delhi, Delhi',
    latitude: 28.7041, longitude: 77.1025,
  },
  {
    title: 'Saffron Jamie - Handmade Woolen Scarf',
    description: 'Handwoven pure wool scarf in beautiful saffron color. Soft, warm, and comfortable. Made by local artisans using traditional techniques. Perfect for winters. Size: 70 x 200 cm.',
    price: 1499,
    category: 'Clothes',
    condition: 'NEW',
    tags: ['scarf', 'woolen', 'handmade', 'winter', 'saffron'],
    location: 'Kashmir, Jammu & Kashmir',
    latitude: 34.0837, longitude: 74.7973,
  },
  {
    title: 'Canon EOS R50 Mirrorless Camera',
    description: 'Canon EOS R50 with 18-45mm kit lens. 24.2MP APS-C sensor. 4K video recording. Lightweight and perfect for beginners. Includes bag, extra battery, and 64GB memory card. Shutter count: 1500.',
    price: 54999,
    category: 'Electronics',
    condition: 'LIKE_NEW',
    tags: ['canon', 'camera', 'mirrorless', 'photography', 'dslr'],
    location: 'Chennai, Tamil Nadu',
    latitude: 13.0827, longitude: 80.2707,
  },
  {
    title: 'Mid-Century Coffee Table - Rosewood',
    description: 'Beautiful mid-century modern coffee table in solid rosewood. Clean lines with tapered legs. Perfect centerpiece for any living room. Minor scratches on top surface add character. Dimensions: 120x60x45cm.',
    price: 8499,
    category: 'Furniture',
    condition: 'GOOD',
    tags: ['coffee-table', 'mid-century', 'rosewood', 'vintage', 'wooden'],
    location: 'Kolkata, West Bengal',
    latitude: 22.5726, longitude: 88.3639,
  },
  {
    title: 'Minimalist Wall Clock - Large 16"',
    description: 'Modern minimalist wall clock with 16-inch diameter. Silent quartz movement - no ticking noise. Clean white face with black hands and subtle hour markers. Runs on 1 AA battery (included).',
    price: 1999,
    category: 'Accessories',
    condition: 'NEW',
    tags: ['clock', 'wall-clock', 'minimalist', 'home-decor', 'modern'],
    location: 'Ahmedabad, Gujarat',
    latitude: 23.0225, longitude: 72.5714,
  },
  {
    title: 'Vintage Vinyl Record Collection - 12 Albums',
    description: 'Curated collection of 12 vintage vinyl records from the 60s and 70s. Includes classic rock, jazz, and blues albums. All playable with minor surface noise. Sleeves show age-appropriate wear.',
    price: 5999,
    category: 'Collectibles',
    condition: 'FAIR',
    tags: ['vinyl', 'records', 'vintage', 'music', 'collection'],
    location: 'Mumbai, Maharashtra',
    latitude: 19.0760, longitude: 72.8777,
  },
  {
    title: 'Yoga Mat - Premium Extra Thick',
    description: 'Premium extra thick yoga mat (8mm) with alignment lines. Non-slip surface on both sides. Eco-friendly TPE material. Includes carrying strap. Perfect for yoga, pilates, and stretching.',
    price: 1499,
    category: 'Other',
    condition: 'NEW',
    tags: ['yoga', 'mat', 'fitness', 'exercise', 'wellness'],
    location: 'Pune, Maharashtra',
    latitude: 18.5204, longitude: 73.8567,
  },
  {
    title: 'Leather Wallet - RFID Blocking',
    description: 'Slim bifold wallet in genuine Italian leather. RFID blocking technology protects your cards. 6 card slots, 2 hidden pockets, and bill compartment. Ages beautifully with use. Dark brown color.',
    price: 2499,
    category: 'Accessories',
    condition: 'NEW',
    tags: ['wallet', 'leather', 'rfid', 'slim', 'brown'],
    location: 'Delhi, Delhi',
    latitude: 28.7041, longitude: 77.1025,
  },
  {
    title: 'Samsung Galaxy Watch 6 Classic - 47mm',
    description: 'Samsung Galaxy Watch 6 Classic with rotating bezel. 47mm size in black. LTE + Bluetooth. Health tracking, ECG, sleep monitoring. Includes original charger and extra band. 1 month old.',
    price: 24999,
    category: 'Electronics',
    condition: 'LIKE_NEW',
    tags: ['samsung', 'watch', 'smartwatch', 'fitness', 'wearable'],
    location: 'Bangalore, Karnataka',
    latitude: 12.9716, longitude: 77.5946,
  },
  {
    title: 'Hand-painted Silk Saree - Kanchipuram',
    description: 'Beautiful genuine Kanchipuram silk saree with hand-painted floral motifs. Rich golden zari border. Perfect for weddings and special occasions. Comes with matching blouse piece. Dry clean only.',
    price: 15999,
    category: 'Clothes',
    condition: 'NEW',
    tags: ['saree', 'silk', 'kanchipuram', 'handpainted', 'traditional'],
    location: 'Chennai, Tamil Nadu',
    latitude: 13.0827, longitude: 80.2707,
  },
  {
    title: 'Standing Desk - Electric Height Adjustable',
    description: 'Electric standing desk with memory presets. 60x30 inch bamboo top. Smooth quiet motor. Height range: 28-48 inches. USB charging ports built in. Used for 6 months, works perfectly.',
    price: 24999,
    category: 'Furniture',
    condition: 'GOOD',
    tags: ['desk', 'standing', 'electric', 'adjustable', 'office'],
    location: 'Hyderabad, Telangana',
    latitude: 17.3850, longitude: 78.4867,
  },
  {
    title: 'Think and Grow Rich - Napoleon Hill (Collector Edition)',
    description: 'Special collector edition of this timeless classic. Leather-bound with gold foil embossing. Ribbon bookmark and deckle-edged pages. A beautiful addition to any personal library.',
    price: 1999,
    category: 'Books',
    condition: 'NEW',
    tags: ['book', 'self-help', 'collector', 'leather-bound', 'classic'],
    location: 'Mumbai, Maharashtra',
    latitude: 19.0760, longitude: 72.8777,
  },
  {
    title: 'Gaming Mechanical Keyboard - RGB',
    description: 'Custom mechanical keyboard with hot-swappable switches. Per-key RGB lighting. Gateron Red switches included. Aluminum frame with USB-C. Programmable via QMK/VIA. Great for gaming and typing.',
    price: 6999,
    category: 'Electronics',
    condition: 'NEW',
    tags: ['keyboard', 'mechanical', 'gaming', 'rgb', 'custom'],
    location: 'Pune, Maharashtra',
    latitude: 18.5204, longitude: 73.8567,
  },
  {
    title: 'Ancient Roman Coin Replica Set - 5 Coins',
    description: 'Set of 5 museum-quality replica Roman coins. Each coin is crafted from brass with authentic patina finish. Displayed in velvet-lined wooden case. Educational and decorative. Includes certificate.',
    price: 3499,
    category: 'Collectibles',
    condition: 'NEW',
    tags: ['coins', 'roman', 'replica', 'historical', 'collection'],
    location: 'Delhi, Delhi',
    latitude: 28.7041, longitude: 77.1025,
  },
  {
    title: 'Mountain Bike - 27.5 inch Wheels',
    description: 'Durable mountain bike with 27.5-inch wheels and front suspension. 21-speed Shimano gears. Disc brakes for reliable stopping. Lightweight aluminum frame. Ideal for trails and city commuting.',
    price: 18999,
    category: 'Other',
    condition: 'GOOD',
    tags: ['bike', 'cycle', 'mountain', 'fitness', 'outdoor'],
    location: 'Bangalore, Karnataka',
    latitude: 12.9716, longitude: 77.5946,
    listingType: 'AUCTION',
    startingBid: 12000,
    minBidIncrement: 500,
    auctionEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Vintage Rolex Submariner - 1969',
    description: 'Authentic vintage Rolex Submariner from 1969. All original parts including crown and bracelet. Recently serviced and running perfectly. Comes with authentication papers. A true collector piece.',
    price: 450000,
    category: 'Accessories',
    condition: 'FAIR',
    tags: ['rolex', 'watch', 'vintage', 'luxury', 'collector'],
    location: 'Mumbai, Maharashtra',
    latitude: 19.0760, longitude: 72.8777,
    listingType: 'AUCTION',
    startingBid: 350000,
    minBidIncrement: 10000,
    auctionEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Handcrafted Acoustic Guitar - Cedar Top',
    description: 'Beautiful handcrafted acoustic guitar with solid cedar top and mahogany back/sides. Warm, resonant tone. Perfect for fingerstyle and strumming. Includes hard case and extra strings.',
    price: 21999,
    category: 'Other',
    condition: 'NEW',
    tags: ['guitar', 'acoustic', 'musical', 'instrument', 'handcrafted'],
    location: 'Kolkata, West Bengal',
    latitude: 22.5726, longitude: 88.3639,
  },
  {
    title: 'DJI Mini 4 Pro Drone - Fly More Combo',
    description: 'DJI Mini 4 Pro with Fly More Combo. Includes 3 batteries, charging hub, RC 2 controller, and carrying bag. 4K/100fps video, obstacle sensing. Used twice. Like new in box.',
    price: 84999,
    category: 'Electronics',
    condition: 'LIKE_NEW',
    tags: ['dji', 'drone', 'camera', 'aerial', 'photography'],
    location: 'Bangalore, Karnataka',
    latitude: 12.9716, longitude: 77.5946,
    listingType: 'BEST_OFFER',
  },
  {
    title: 'Persian Handwoven Carpet - 8x10 ft',
    description: 'Authentic Persian handwoven carpet with traditional geometric patterns. Rich deep red and navy blue colors. 100% wool with cotton foundation. Professionally cleaned. Minor fringe wear at edges.',
    price: 34999,
    category: 'Furniture',
    condition: 'GOOD',
    tags: ['carpet', 'persian', 'handwoven', 'wool', 'traditional'],
    location: 'Ahmedabad, Gujarat',
    latitude: 23.0225, longitude: 72.5714,
    listingType: 'BEST_OFFER',
  },
];

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.productImage.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('Cleaned existing data.');

  // Create dummy user
  const user = await prisma.user.create({
    data: {
      id: SEED_USER_ID,
      email: 'seller@tradly.com',
      passwordHash: '$2a$12$dummyhash',
      name: 'Priya Sharma',
      username: 'priyasharma',
      bio: 'Passionate seller. Quality products at fair prices. Fast shipping guaranteed!',
      location: 'Mumbai, Maharashtra',
      latitude: 19.0760,
      longitude: 72.8777,
      role: 'USER',
      isVerified: true,
      emailVerified: true,
      trustScore: 94,
      isTrustedSeller: true,
      avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Priya',
    },
  });

  // Create a second user for variety
  const user2 = await prisma.user.create({
    data: {
      id: '00000000-0000-4000-8000-000000000002',
      email: 'buyer@tradly.com',
      passwordHash: '$2a$12$dummyhash',
      name: 'Arun Kumar',
      username: 'arunkumar',
      bio: 'Collector and enthusiast. Always looking for unique items.',
      location: 'Bangalore, Karnataka',
      latitude: 12.9716,
      longitude: 77.5946,
      role: 'USER',
      isVerified: false,
      emailVerified: true,
      trustScore: 72,
      avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Arun',
    },
  });

  console.log('Created users.');

  // Create products
  for (let i = 0; i < productsData.length; i++) {
    const p = productsData[i];
    const product = await prisma.product.create({
      data: {
        title: p.title,
        description: p.description,
        price: p.listingType !== 'AUCTION' ? p.price : undefined,
        category: p.category,
        condition: p.condition as any,
        listingType: (p as any).listingType || 'FIXED_PRICE',
        startingBid: (p as any).startingBid || undefined,
        minBidIncrement: (p as any).minBidIncrement || undefined,
        auctionEnd: (p as any).auctionEnd || undefined,
        location: p.location,
        latitude: p.latitude,
        longitude: p.longitude,
        tags: p.tags,
        status: 'ACTIVE',
        viewCount: Math.floor(Math.random() * 500) + 10,
        userId: i % 3 === 0 ? user2.id : user.id,
        images: {
          create: [
            {
              url: `https://picsum.photos/seed/product${i + 1}/600/400`,
              thumbnail: `https://picsum.photos/seed/product${i + 1}/150/100`,
              alt: p.title,
              order: 0,
            },
            {
              url: `https://picsum.photos/seed/product${i + 1}a/600/400`,
              thumbnail: `https://picsum.photos/seed/product${i + 1}a/150/100`,
              alt: `${p.title} - angle 2`,
              order: 1,
            },
            {
              url: `https://picsum.photos/seed/product${i + 1}b/600/400`,
              thumbnail: `https://picsum.photos/seed/product${i + 1}b/150/100`,
              alt: `${p.title} - angle 3`,
              order: 2,
            },
          ],
        },
      },
    });

    // Add some bids to auction products
    if ((p as any).listingType === 'AUCTION') {
      const bidAmount = (p as any).startingBid + (p as any).minBidIncrement * 2;
      await prisma.bid.create({
        data: {
          amount: bidAmount,
          userId: user2.id,
          productId: product.id,
          createdAt: new Date(Date.now() - 3600000),
        },
      });
    }

    console.log(`  Created product: ${p.title}`);
  }

  const productCount = await prisma.product.count();
  const imageCount = await prisma.productImage.count();
  
  console.log('');
  console.log('Seeding complete!');
  console.log(`  Users: 2`);
  console.log(`  Products: ${productCount}`);
  console.log(`  Product Images: ${imageCount}`);
  console.log(`  Bids: ${await prisma.bid.count()}`);
  console.log('');
  console.log('Demo account: seller@tradly.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
