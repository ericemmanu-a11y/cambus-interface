import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { anden_id, placa } = body;

        if (!anden_id || !placa) {
            return NextResponse.json({ success: false, error: 'anden_id and placa are required' }, { status: 400 });
        }

        const client = await pool.connect();

        try {
            const andenRes = await client.query('SELECT id_anden, id_camara FROM andenes WHERE numero_anden = $1', [anden_id]);

            if (andenRes.rows.length === 0) {
                return NextResponse.json({ success: false, error: `Anden ${anden_id} no encontrado en Base de Datos.` }, { status: 404 });
            }

            const internal_anden_id = andenRes.rows[0].id_anden;
            const internal_camara_id = andenRes.rows[0].id_camara;

            // 1. Update checkout time on original entrada record so that v_resumen_diario can calculate stay time properly
            await client.query(`
                UPDATE registros_vehiculos 
                SET fecha_hora_salida = NOW() 
                WHERE placa = $1 AND id_anden = $2 AND evento = 'entrada' AND fecha_hora_salida IS NULL
            `, [placa, internal_anden_id]);

            // 2. Insert salida log to fire database Triggers (fn_actualizar_estado_anden -> 'libre')
            // This event is also visible on Dashboard's 'Actividad Reciente'
            await client.query(`
                INSERT INTO registros_vehiculos
                    (placa, id_anden, id_camara, fecha_hora_entrada, evento)
                VALUES
                    ($1, $2, $3, NOW(), 'salida')
            `, [placa, internal_anden_id, internal_camara_id]);

            return NextResponse.json({
                success: true,
                message: 'Salida Registrada en Base de Datos'
            });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Simulator Backend Error:', error);
        return NextResponse.json(
            { success: false, error: 'Hubo un error insertando salida al Radar IoT', detail: error.message || error.toString() },
            { status: 500 }
        );
    }
}
