import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const client = await pool.connect();

        // Upsert into estado_simulador
        await client.query(`
            CREATE TABLE IF NOT EXISTS estado_simulador (
                id INTEGER PRIMARY KEY,
                ultimo_latido TIMESTAMPTZ NOT NULL
            );
        `);

        await client.query(`
            INSERT INTO estado_simulador (id, ultimo_latido) 
            VALUES (1, NOW()) 
            ON CONFLICT (id) DO UPDATE SET ultimo_latido = NOW();
        `);

        client.release();
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Database error', detail: error.message }, { status: 500 });
    }
}
