const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const Database = require('better-sqlite3');
const crypto = require('crypto');

const csvFilePath = path.resolve(__dirname, '../public/philips-agua.csv');
const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new Database(dbPath);

const insertProduct = db.prepare("INSERT INTO products (id, brand, name, sku, image, videoId) VALUES (?, ?, ?, ?, ?, ?)");

const processedHandles = new Set();
let count = 0;

fs.createReadStream(csvFilePath)
  .pipe(parse({ columns: true, skip_empty_lines: true }))
  .on('data', (row) => {
    const handle = row['Handle'];
    
    // Solo tomamos la primera fila de cada producto (para evitar duplicados de variantes)
    if (!processedHandles.has(handle)) {
      processedHandles.add(handle);
      
      const title = row['Title'];
      const sku = row['Variant SKU'];
      const imageSrc = row['Image Src'];
      
      if (title && imageSrc) {
        const id = crypto.randomBytes(4).toString('hex');
        try {
          insertProduct.run(id, 'agua', title, sku || 'SIN-SKU', imageSrc, null);
          count++;
        } catch (err) {
          console.error(`Error insertando ${title}:`, err.message);
        }
      }
    }
  })
  .on('end', () => {
    console.log(`¡Importación completada! Se insertaron ${count} productos de la marca 'agua'.`);
  })
  .on('error', (err) => {
    console.error('Error procesando CSV:', err);
  });
