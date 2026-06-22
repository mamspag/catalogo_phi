import { NextResponse } from 'next/server';
import db from '@/lib/db';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function GET() {
  try {
    const products = db.prepare("SELECT * FROM products").all();
    return NextResponse.json({ success: true, products }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Error fetching products' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { brand, name, sku, videos, images, features } = data;

    if (!brand || !name || !sku) {
      return NextResponse.json({ success: false, message: 'Faltan datos requeridos (Marca, Nombre, SKU)' }, { status: 400 });
    }

    const finalImageUrls = [];

    if (images && Array.isArray(images)) {
      for (const img of images) {
        if (img.type === 'base64' && img.data) {
          const matches = img.data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const imageBuffer = Buffer.from(matches[2], 'base64');
            const extension = matches[1].split('/')[1]; // e.g., png, jpeg
            const fileName = `${crypto.randomBytes(16).toString('hex')}.${extension}`;
            const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
            fs.writeFileSync(filePath, imageBuffer);
            finalImageUrls.push(`/uploads/${fileName}`);
          }
        } else if (img.type === 'url' && img.url) {
          finalImageUrls.push(img.url);
        }
      }
    }

    if (finalImageUrls.length === 0) {
      return NextResponse.json({ success: false, message: 'Se requiere al menos una imagen' }, { status: 400 });
    }

    // Keep the first image/video for backward compatibility with the old 'image'/'videoId' columns
    const mainImage = finalImageUrls[0];
    const mainVideo = (videos && videos.length > 0) ? videos[0] : null;

    const id = crypto.randomBytes(4).toString('hex');

    const insertProduct = db.prepare("INSERT INTO products (id, brand, name, sku, image, videoId, features, images, videos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    insertProduct.run(
      id, 
      brand, 
      name, 
      sku, 
      mainImage, 
      mainVideo, 
      features || null, 
      JSON.stringify(finalImageUrls), 
      JSON.stringify(videos || [])
    );

    return NextResponse.json({ success: true, message: 'Producto creado exitosamente' }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Error creando producto' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const { id, brand, name, sku, videos, images, features } = data;

    if (!id || !brand || !name || !sku) {
      return NextResponse.json({ success: false, message: 'Faltan datos requeridos' }, { status: 400 });
    }

    const finalImageUrls = [];
    if (images && Array.isArray(images)) {
      for (const img of images) {
        if (img.type === 'base64' && img.data) {
          const matches = img.data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const imageBuffer = Buffer.from(matches[2], 'base64');
            const extension = matches[1].split('/')[1];
            const fileName = `${crypto.randomBytes(16).toString('hex')}.${extension}`;
            const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
            fs.writeFileSync(filePath, imageBuffer);
            finalImageUrls.push(`/uploads/${fileName}`);
          }
        } else if (img.type === 'url' && img.url) {
          finalImageUrls.push(img.url);
        }
      }
    }

    if (finalImageUrls.length === 0) {
      return NextResponse.json({ success: false, message: 'Se requiere al menos una imagen' }, { status: 400 });
    }

    const mainImage = finalImageUrls[0];
    const mainVideo = (videos && videos.length > 0) ? videos[0] : null;

    const updateProduct = db.prepare("UPDATE products SET brand=?, name=?, sku=?, image=?, videoId=?, features=?, images=?, videos=? WHERE id=?");
    
    updateProduct.run(
      brand, 
      name, 
      sku, 
      mainImage, 
      mainVideo, 
      features || null, 
      JSON.stringify(finalImageUrls), 
      JSON.stringify(videos || []),
      id
    );

    return NextResponse.json({ success: true, message: 'Producto actualizado exitosamente' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Error actualizando producto' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const data = await request.json();
    const { id } = data;
    if (!id) return NextResponse.json({ success: false, message: 'ID requerido' }, { status: 400 });
    db.prepare("DELETE FROM products WHERE id = ?").run(id);
    return NextResponse.json({ success: true, message: 'Producto eliminado' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Error eliminando producto' }, { status: 500 });
  }
}
