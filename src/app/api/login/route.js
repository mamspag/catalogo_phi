import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);

    if (user) {
      return NextResponse.json({ 
        success: true, 
        token: 'mock-jwt-token-123',
        role: user.role 
      }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, message: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
