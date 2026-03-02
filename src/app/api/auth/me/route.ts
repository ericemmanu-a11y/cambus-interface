import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';

export async function GET() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return NextResponse.json({ user: null });

    const payload = await decrypt(session);
    if (!payload) return NextResponse.json({ user: null });

    return NextResponse.json({
        user: {
            id: payload.userId,
            rol: payload.rol,
            nombre: payload.nombre
        }
    });
}
