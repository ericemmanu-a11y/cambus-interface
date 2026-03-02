import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { anden_id } = body;

        if (!anden_id) {
            return NextResponse.json({ success: false, error: 'anden_id is required' }, { status: 400 });
        }

        const client = await pool.connect();

        try {
            // Generate Industrial Mock Data
            const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const rndLetras = Array(3).fill(0).map(() => letras[Math.floor(Math.random() * letras.length)]).join('');
            const rndNumeros = Math.floor(100 + Math.random() * 900); // 100-999
            const rndSub = letras[Math.floor(Math.random() * letras.length)];
            const placaMock = `${rndLetras}-${rndNumeros}-${rndSub}`; // Format: XYZ-123-A

            const confianza_placa = (85 + Math.random() * 14).toFixed(1); // Realism: 85.0 to 98.9%

            // Simulate Security Evidence Hash (SHA-256 string for the DB constraint)
            const seed = `simulated_evidence_${Date.now()}_${placaMock}`;
            const hash_imagen = crypto.createHash('sha256').update(seed).digest('hex');

            const ruta_imagen = `/imagenes/simulador/${new Date().getFullYear()}/${new Date().getMonth() + 1}/sim_${Date.now()}.jpg`;

            // Verify mapping to the physical ID system created by cambus_v2.sql
            // User requested 'anden_id' matching 1-5
            const andenRes = await client.query('SELECT id_anden, id_camara FROM andenes WHERE numero_anden = $1', [anden_id]);

            if (andenRes.rows.length === 0) {
                return NextResponse.json({ success: false, error: `Anden ${anden_id} no encontrado en Base de Datos.` }, { status: 404 });
            }

            const internal_anden_id = andenRes.rows[0].id_anden;
            const internal_camara_id = andenRes.rows[0].id_camara;

            // Execute the Insert Command
            // This will automatically trigger the DB's pgAudit triggers and partitioned table splits
            await client.query(`
                INSERT INTO registros_vehiculos
                    (placa, id_anden, id_camara, fecha_hora_entrada, confianza_placa, ruta_imagen, hash_imagen, evento)
                VALUES
                    ($1, $2, $3, NOW(), $4, $5, $6, 'entrada')
            `, [
                placaMock, internal_anden_id, internal_camara_id, confianza_placa, ruta_imagen, hash_imagen
            ]);

            return NextResponse.json({
                success: true,
                message: 'Inserción Exitosa (Gemelo Digital)',
                data: {
                    placa: placaMock,
                    anden_id,
                    hash_imagen
                }
            });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Simulator Backend Error:', error);
        return NextResponse.json(
            { success: false, error: 'Hubo un error insertando al Radar IoT PostgreSQL', detail: error.message || error.toString() },
            { status: 500 }
        );
    }
}
