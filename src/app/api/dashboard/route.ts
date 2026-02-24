import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const client = await pool.connect();

        // 1. Get recent vehicle activity directly from the partitioned table
        const vehiclesResult = await client.query(`
      SELECT rv.id_registro, rv.placa, a.numero_anden, rv.evento, rv.fecha_hora_entrada
      FROM registros_vehiculos rv
      JOIN andenes a ON rv.id_anden = a.id_anden
      ORDER BY rv.fecha_hora_entrada DESC
      LIMIT 10
    `);

        // 2. Get active cameras
        const camerasResult = await client.query(`
      SELECT id_camara, nombre_camara, ubicacion, estado
      FROM camaras
    `);

        // 3. Get current andenes status using the v2.0 optimized dashboard view
        const andenesResult = await client.query(`
      SELECT numero_anden, zona, estado_actual, placa_actual as placa, fecha_hora_entrada, minutos_en_anden 
      FROM v_dashboard_andenes
      ORDER BY numero_anden ASC
    `);

        client.release();

        return NextResponse.json({
            success: true,
            data: {
                recentActivity: vehiclesResult.rows,
                cameras: camerasResult.rows,
                andenes: andenesResult.rows.map(row => ({
                    id_anden: row.numero_anden, // Re-map ID to match UI expectation
                    numero_anden: row.numero_anden,
                    estado_actual: row.estado_actual,
                    zona: row.zona
                }))
            }
        });
    } catch (error: any) {
        console.error('Database Error Detailed:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch live dashboard data', detail: error.message || error.toString() },
            { status: 500 }
        );
    }
}
