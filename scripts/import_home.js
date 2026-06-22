const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const Database = require('better-sqlite3');
const crypto = require('crypto');

const csvFilePath = path.resolve(__dirname, '../public/philips home.csv');
const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new Database(dbPath);

const insertProduct = db.prepare("INSERT INTO products (id, brand, name, sku, image, videoId, features, images, videos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

console.log('Leyendo el archivo CSV...');
const fileContent = fs.readFileSync(csvFilePath, 'utf8');
const records = parse(fileContent, { columns: true, skip_empty_lines: true });

const productsMap = {};

for (const row of records) {
  const handle = row['Handle'];
  const title = row['Title'];
  const imageSrc = row['Image Src'];
  const bodyHtml = row['Body (HTML)'];
  const sku = row['Variant SKU'];

  // Si es la primera vez que vemos este handle
  if (!productsMap[handle]) {
    // La primera fila de un producto debe tener título en formato Shopify
    if (!title) continue; 
    
    // Limpiar HTML de las características
    let features = '';
    if (bodyHtml) {
      features = bodyHtml.replace(/<[^>]+>/g, '').trim();
    }

    productsMap[handle] = {
      name: title,
      sku: sku || 'SIN-SKU',
      features: features,
      images: []
    };
  }

  // Si la fila tiene una imagen, se la agregamos al array del producto
  if (imageSrc) {
    productsMap[handle].images.push(imageSrc);
  }
}

let count = 0;
for (const handle in productsMap) {
  const p = productsMap[handle];
  if (p.images.length > 0) {
    const id = crypto.randomBytes(4).toString('hex');
    const firstImage = p.images[0];
    const imagesJson = JSON.stringify(p.images);
    const videosJson = JSON.stringify([]);
    
    try {
      insertProduct.run(id, 'home', p.name, p.sku, firstImage, null, p.features, imagesJson, videosJson);
      count++;
    } catch (err) {
      console.error(`Error insertando ${p.name}:`, err.message);
    }
  }
}

console.log(`¡Importación completada! Se insertaron ${count} productos en 'Philips Home'.`);
