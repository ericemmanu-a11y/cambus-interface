const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    user: 'cambus_admin',
    host: '127.0.0.1',
    database: 'cambus_db',
    password: 'cambus_admin_123',
    port: 5432,
});

async function generarHash(texto) {
    return crypto.createHash('sha256').update(texto).digest('hex');
}

function generarPlacaAleatoria() {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    let l = ''; let n = ''; let end = '';
    for (let i = 0; i < 3; i++) l += letras.charAt(Math.floor(Math.random() * letras.length));
    for (let i = 0; i < 3; i++) n += nums.charAt(Math.floor(Math.random() * nums.length));
    end = letras.charAt(Math.floor(Math.random() * letras.length));
    return `${l}-${n}-${end}`;
}

async function runDaemon() {
    console.log('[DAEMON] Iniciando Simulador de Fondo CamBus...');

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS estado_simulador (
                id INTEGER PRIMARY KEY,
                ultimo_latido TIMESTAMPTZ NOT NULL
            );
        `);
    } catch (e) {
        console.log('[DAEMON] Error al crear tabla de estado:', e.message);
    }

    setInterval(async () => {
        let client;
        try {
            client = await pool.connect();
            const res = await client.query(`SELECT EXTRACT(EPOCH FROM (NOW() - ultimo_latido)) as diff FROM estado_simulador WHERE id = 1`);

            let isBackground = true;
            if (res.rows.length > 0 && res.rows[0].diff !== null) {
                if (res.rows[0].diff < 5) {
                    isBackground = false;
                }
            }

            if (!isBackground) {
                console.log('[DAEMON] Frontend activo detectado. Pausando inyección automática.');
            } else {
                console.log('[DAEMON] Trabajando en segundo plano... Inyectando tráfico logístico.');

                const resSalidas = await client.query(`
                    SELECT r.id_registro, r.placa, r.id_anden 
                    FROM registros_vehiculos r
                    JOIN andenes a ON r.id_anden = a.id_anden
                    WHERE r.evento = 'entrada' AND r.fecha_hora_salida IS NULL
                    AND EXTRACT(EPOCH FROM (NOW() - r.fecha_hora_entrada)) / 60 > 15
                `);

                for (const row of resSalidas.rows) {
                    if (Math.random() > 0.7) {
                        const hash = await generarHash('salida_bg_' + Date.now());

                        await client.query(`
                            UPDATE registros_vehiculos SET evento = 'salida', fecha_hora_salida = NOW()
                            WHERE id_registro = $1
                        `, [row.id_registro]);

                        await client.query(`
                            INSERT INTO registros_vehiculos (placa, id_anden, id_camara, evento, confianza_placa, hash_imagen)
                            VALUES ($1, $2, (SELECT id_camara FROM andenes WHERE id_anden = $2 LIMIT 1), 'salida', 99.8, $3)
                        `, [row.placa, row.id_anden, hash]);

                        console.log(`[DAEMON] Salida: Vehículo ${row.placa} liberó el andén ${row.id_anden}.`);
                    }
                }

                const andenesLibres = await client.query(`SELECT id_anden FROM andenes WHERE estado_actual = 'libre'`);

                if (andenesLibres.rows.length > 0 && Math.random() > 0.3) {
                    const idx = Math.floor(Math.random() * andenesLibres.rows.length);
                    const andenElegido = andenesLibres.rows[idx].id_anden;
                    const placa = generarPlacaAleatoria();
                    const hash = await generarHash('entrada_bg_' + Date.now());

                    await client.query(`
                        INSERT INTO registros_vehiculos (placa, id_anden, id_camara, evento, confianza_placa, hash_imagen)
                        VALUES ($1, $2, (SELECT id_camara FROM andenes WHERE id_anden = $2 LIMIT 1), 'entrada', $3, $4)
                    `, [placa, andenElegido, (90 + Math.random() * 9).toFixed(2), hash]);

                    console.log(`[DAEMON] Entrada: Vehículo ${placa} ocupó el andén ${andenElegido}.`);
                }
            }
        } catch (error) {
            console.error('[DAEMON] Error:', error.message);
        } finally {
            if (client) client.release();
        }
    }, 5000);
}

runDaemon();
