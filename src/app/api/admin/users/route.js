import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const users = db.prepare("SELECT id, username, role FROM users").all();
    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Error fetching users' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { username, password, role } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Faltan datos' }, { status: 400 });
    }

    const insertUser = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
    insertUser.run(username, password, role || 'viewer');

    return NextResponse.json({ success: true, message: 'Usuario creado' }, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ success: false, message: 'El usuario ya existe' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: 'Error creando usuario' }, { status: 500 });
  }
}
