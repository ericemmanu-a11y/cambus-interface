import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM camaras ORDER BY id_camara ASC');
        client.release();
        return NextResponse.json({ success: true, data: result.rows });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Database error', detail: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const payload = await decrypt(session);
    if (!payload || payload.rol !== 'admin') {
        return NextResponse.json({ success: false, error: 'Forbidden. Admin role required.' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { nombre_camara, ip_local, ubicacion, modelo = 'DH-IPC-B1E40', estado = 'activa' } = body;

        if (!nombre_camara || !ip_local || !ubicacion) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const client = await pool.connect();
        const result = await client.query(
            `INSERT INTO camaras (nombre_camara, ip_local, modelo, ubicacion, estado) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [nombre_camara, ip_local, modelo, ubicacion, estado]
        );
        client.release();

        return NextResponse.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Database error', detail: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const payload = await decrypt(session);
    if (!payload || payload.rol !== 'admin') {
        return NextResponse.json({ success: false, error: 'Forbidden. Admin role required.' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id_camara, nombre_camara, ip_local, ubicacion, modelo, estado } = body;

        if (!id_camara) {
            return NextResponse.json({ success: false, error: 'Missing id_camara' }, { status: 400 });
        }

        const client = await pool.connect();
        const result = await client.query(
            `UPDATE camaras 
             SET nombre_camara = COALESCE($1, nombre_camara),
                 ip_local = COALESCE($2, ip_local),
                 ubicacion = COALESCE($3, ubicacion),
                 modelo = COALESCE($4, modelo),
                 estado = COALESCE($5, estado)
             WHERE id_camara = $6 RETURNING *`,
            [nombre_camara, ip_local, ubicacion, modelo, estado, id_camara]
        );
        client.release();

        if (result.rowCount === 0) {
            return NextResponse.json({ success: false, error: 'Camera not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Database error', detail: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const payload = await decrypt(session);
    if (!payload || payload.rol !== 'admin') {
        return NextResponse.json({ success: false, error: 'Forbidden. Admin role required.' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id_camara = searchParams.get('id');

        if (!id_camara) {
            return NextResponse.json({ success: false, error: 'Missing id param' }, { status: 400 });
        }

        const client = await pool.connect();
        // Option: we shouldn't delete if there are andenes depending on it, or we could set it to NULL.
        // For this demo, let's assume it's a soft delete or direct delete if no dependents.

        // Let's set the andenes id_camara to null first manually or let restrict throw exception.
        // We'll update andenes to free the camera constraint:
        await client.query(`UPDATE andenes SET id_camara = NULL WHERE id_camara = $1`, [id_camara]);
        await client.query(`UPDATE registros_vehiculos SET id_camara = NULL WHERE id_camara = $1`, [id_camara]);

        const result = await client.query(`DELETE FROM camaras WHERE id_camara = $1 RETURNING *`, [id_camara]);
        client.release();

        if (result.rowCount === 0) {
            return NextResponse.json({ success: false, error: 'Camera not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Database error', detail: error.message }, { status: 500 });
    }
}
