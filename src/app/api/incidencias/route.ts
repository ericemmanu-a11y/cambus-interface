import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const client = await pool.connect();
        const result = await client.query(`
            SELECT i.*, u.nombre_usuario 
            FROM incidencias i 
            LEFT JOIN usuarios u ON i.id_usuario = u.id_usuario
            ORDER BY i.fecha_reporte DESC
        `);
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
    if (!payload) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    try {
        const body = await req.json();
        const { titulo, descripcion, nivel_gravedad = 'media' } = body;

        if (!titulo || !descripcion) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const client = await pool.connect();
        const result = await client.query(
            `INSERT INTO incidencias (id_usuario, titulo, descripcion, nivel_gravedad) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [payload.userId, titulo, descripcion, nivel_gravedad]
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
    if (!payload || !['admin', 'supervisor'].includes(payload.rol as string)) {
        return NextResponse.json({ success: false, error: 'Forbidden. Admin/Supervisor required.' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id_incidencia, estado, nivel_gravedad } = body;

        const client = await pool.connect();

        let updateQuery = `UPDATE incidencias SET estado = COALESCE($1, estado), nivel_gravedad = COALESCE($2, nivel_gravedad)`;
        if (estado === 'resuelta') {
            updateQuery += `, fecha_resolucion = NOW()`;
        }
        updateQuery += ` WHERE id_incidencia = $3 RETURNING *`;

        const result = await client.query(updateQuery, [estado, nivel_gravedad, id_incidencia]);
        client.release();

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
        return NextResponse.json({ success: false, error: 'Forbidden. Admin required.' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id_incidencia = searchParams.get('id');

        const client = await pool.connect();
        await client.query(`DELETE FROM incidencias WHERE id_incidencia = $1`, [id_incidencia]);
        client.release();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Database error', detail: error.message }, { status: 500 });
    }
}
