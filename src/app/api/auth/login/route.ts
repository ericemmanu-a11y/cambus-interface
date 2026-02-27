import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createSession } from '@/lib/session';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { correo, password } = body;

        if (!correo || !password) {
            return NextResponse.json({ success: false, error: 'Correo y contraseña requeridos' }, { status: 400 });
        }

        const client = await pool.connect();

        try {
            // Validar verificando el HASH pgcrypto dentro de PostgreSQL directamente
            const res = await client.query(`
                SELECT id_usuario, nombre_usuario, rol 
                FROM usuarios 
                WHERE correo = $1 AND password_hash = crypt($2, password_hash) AND activo = TRUE
            `, [correo, password]);

            if (res.rows.length === 0) {
                return NextResponse.json({ success: false, error: 'Credenciales inválidas o cuenta desactivada' }, { status: 401 });
            }

            const user = res.rows[0];

            // Crear sesion JWT en cookie asegurada HttpOnly
            await createSession(user.id_usuario.toString(), user.rol, user.nombre_usuario);

            // Log de seguridad en Bitacora
            await client.query(`
                INSERT INTO bitacora_acciones (id_usuario, accion, detalle) 
                VALUES ($1, 'login', 'Sesión autorizada desde el Portal V2')
            `, [user.id_usuario]);

            return NextResponse.json({
                success: true,
                message: 'Autenticado correctamente',
                user: {
                    nombre: user.nombre_usuario,
                    rol: user.rol
                }
            });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Auth Error:', error);
        return NextResponse.json({ success: false, error: 'Fallo de motor de base de datos en Auntenticación' }, { status: 500 });
    }
}
