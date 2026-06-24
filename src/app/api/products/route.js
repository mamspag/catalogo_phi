import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    const q = searchParams.get('q');
    const id = searchParams.get('id');

    if (id) {
      const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
      if (!product) return NextResponse.json({ success: false, message: 'Producto no encontrado' }, { status: 404 });
      return NextResponse.json({ success: true, product }, { status: 200 });
    }

    if (q) {
      const query = `%${q}%`;
      const products = db.prepare("SELECT id, brand, name, sku, image FROM products WHERE name LIKE ? OR sku LIKE ? COLLATE NOCASE").all(query, query);
      return NextResponse.json({ success: true, products }, { status: 200 });
    }

    if (!brand) {
      return NextResponse.json({ success: false, message: 'Marca o búsqueda no proporcionada' }, { status: 400 });
    }

    const products = db.prepare("SELECT id, brand, name, sku, image FROM products WHERE brand = ?").all(brand);

    return NextResponse.json({ success: true, products }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: 'Error fetching products' }, { status: 500 });
  }
}
