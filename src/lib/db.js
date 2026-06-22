import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Initialize DB in the project root
const dbPath = path.resolve(process.cwd(), 'database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

// Create tables if they don't exist
const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer'
  );
`;

const createProductsTable = `
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    brand TEXT NOT NULL,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    image TEXT NOT NULL,
    videoId TEXT,
    features TEXT,
    images TEXT,
    videos TEXT
  );
`;

db.exec(createUsersTable);
db.exec(createProductsTable);

// Migration: Add features column if it doesn't exist
const tableInfo = db.pragma("table_info(products)");
const hasFeatures = tableInfo.some(column => column.name === 'features');
if (!hasFeatures) {
  db.exec("ALTER TABLE products ADD COLUMN features TEXT");
}

// Migration: Add images and videos columns if they don't exist
const hasImages = tableInfo.some(column => column.name === 'images');
if (!hasImages) {
  db.exec("ALTER TABLE products ADD COLUMN images TEXT");
  db.exec("ALTER TABLE products ADD COLUMN videos TEXT");
  
  // Migrate existing single image/video to arrays
  const allProducts = db.prepare("SELECT id, image, videoId FROM products").all();
  const updateStmt = db.prepare("UPDATE products SET images = ?, videos = ? WHERE id = ?");
  for (const p of allProducts) {
    const imgs = p.image ? JSON.stringify([p.image]) : JSON.stringify([]);
    const vids = p.videoId ? JSON.stringify([p.videoId]) : JSON.stringify([]);
    updateStmt.run(imgs, vids, p.id);
  }
}

// Seed default admin if table is empty
const adminCheck = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
if (!adminCheck) {
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run('admin', 'admin', 'admin');
}

// Seed default demo products if table is empty
const productsCheck = db.prepare("SELECT COUNT(*) as count FROM products").get();
if (productsCheck.count === 0) {
  const insertProduct = db.prepare("INSERT INTO products (id, brand, name, sku, image, videoId, features, images, videos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  
  const defaultFeatures = "• Excelente rendimiento\n• Diseño moderno\n• Fácil de usar";
  
  const getImages = (img) => JSON.stringify([img]);
  const getVideos = (vid) => JSON.stringify([vid]);

  // Home
  insertProduct.run('h1', 'home', 'Philips Airfryer XXL', 'HD9860/90', 'https://images.philips.com/is/image/PhilipsConsumer/HD9860_90-IMS-es_ES?$jpglarge$&wid=960', '5Z1L2L_Q47U', defaultFeatures, getImages('https://images.philips.com/is/image/PhilipsConsumer/HD9860_90-IMS-es_ES?$jpglarge$&wid=960'), getVideos('5Z1L2L_Q47U'));
  insertProduct.run('h2', 'home', 'Philips Purificador de Aire', 'AC2887/10', 'https://images.philips.com/is/image/PhilipsConsumer/AC2887_10-IMS-es_ES?$jpglarge$&wid=960', 'H1R54zJvI6s', defaultFeatures, getImages('https://images.philips.com/is/image/PhilipsConsumer/AC2887_10-IMS-es_ES?$jpglarge$&wid=960'), getVideos('H1R54zJvI6s'));
  // Agua
  insertProduct.run('w1', 'agua', 'Philips Jarra Purificadora', 'AWP2936WHT/31', 'https://images.philips.com/is/image/PhilipsConsumer/AWP2936WHT_31-IMS-es_ES?$jpglarge$&wid=960', 'aR49kYkP_1M', defaultFeatures, getImages('https://images.philips.com/is/image/PhilipsConsumer/AWP2936WHT_31-IMS-es_ES?$jpglarge$&wid=960'), getVideos('aR49kYkP_1M'));
  insertProduct.run('w2', 'agua', 'Dispensador de Agua', 'ADD5910M/00', 'https://images.philips.com/is/image/PhilipsConsumer/ADD5910M_00-IMS-es_ES?$jpglarge$&wid=960', 'U_5h442r530', defaultFeatures, getImages('https://images.philips.com/is/image/PhilipsConsumer/ADD5910M_00-IMS-es_ES?$jpglarge$&wid=960'), getVideos('U_5h442r530'));
  // Audio
  insertProduct.run('a1', 'audio', 'Auriculares Inalámbricos', 'TAH8506BK/00', 'https://images.philips.com/is/image/PhilipsConsumer/TAH8506BK_00-IMS-es_ES?$jpglarge$&wid=960', 'B-s46F3GkKc', defaultFeatures, getImages('https://images.philips.com/is/image/PhilipsConsumer/TAH8506BK_00-IMS-es_ES?$jpglarge$&wid=960'), getVideos('B-s46F3GkKc'));
  insertProduct.run('a2', 'audio', 'Barra de Sonido', 'TAB8505/10', 'https://images.philips.com/is/image/PhilipsConsumer/TAB8505_10-IMS-es_ES?$jpglarge$&wid=960', 'j8K_a1tO-kY', defaultFeatures, getImages('https://images.philips.com/is/image/PhilipsConsumer/TAB8505_10-IMS-es_ES?$jpglarge$&wid=960'), getVideos('j8K_a1tO-kY'));
}

// Ensure uploads directory exists
const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export default db;
