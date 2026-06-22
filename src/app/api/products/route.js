import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');

    if (!brand) {
      return NextResponse.json({ success: false, message: 'Marca no proporcionada' }, { status: 400 });
    }

    const products = db.prepare("SELECT * FROM products WHERE brand = ?").all(brand);

    return NextResponse.json({ success: true, products }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: 'Error fetching products' }, { status: 500 });
  }
}
