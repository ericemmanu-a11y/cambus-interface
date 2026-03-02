-- =========================================================================
-- CAMBUS V2.0 - SCRIPT DE INYECCIÓN DE DATOS MASIVOS (SIMULACIÓN DE CARGA)
-- Objetivo: Generar ~500 registros históricos realistas en los últimos 7 días.
-- Ejecución: psql -U cambus_admin -d cambus_db -f generar_datos_prueba.sql
-- =========================================================================

DO $$
DECLARE
    v_fecha_inicio TIMESTAMPTZ := NOW() - INTERVAL '7 days';
    v_fecha_fin TIMESTAMPTZ := NOW();
    v_fecha_actual TIMESTAMPTZ := v_fecha_inicio;
    v_placa VARCHAR(15);
    v_id_anden INTEGER;
    v_id_camara INTEGER;
    v_minutos_estancia INTEGER;
    v_confianza NUMERIC;
    v_letras_placa TEXT[] := ARRAY['ABC', 'XYZ', 'DEF', 'GHI', 'JKL', 'MNO', 'PQR', 'STU', 'VWX', 'YZA'];
    v_digitos_placa TEXT[] := ARRAY['123', '456', '789', '012', '345', '678', '901', '234', '567', '890'];
    v_sufijo_placa TEXT[] := ARRAY['A', 'B', 'C', 'X', 'Y', 'Z', 'M', 'N', 'P', 'R'];
    v_contador INTEGER := 0;
BEGIN
    RAISE NOTICE 'Iniciando generación de datos históricos...';
    
    WHILE v_fecha_actual < v_fecha_fin LOOP
        -- Generar entre 2 y 5 vehículos por hora
        FOR i IN 1 .. (floor(random() * 4) + 2) LOOP
            
            -- Crear placa aleatoria
            v_placa := v_letras_placa[floor(random() * 10) + 1] || '-' || 
                       v_digitos_placa[floor(random() * 10) + 1] || '-' || 
                       v_sufijo_placa[floor(random() * 10) + 1];
            
            -- Asignar andén aleatorio (1 a 5, según datos semilla originales)
            v_id_anden := floor(random() * 5) + 1;
            v_id_camara := v_id_anden; -- En este diseño, la cámara coincide con el andén por simplicidad de prueba
            
            -- Confianza del OCR entre 80.00 y 99.99
            v_confianza := round((random() * 20 + 80)::numeric, 2);
            
            -- Estancia: entre 15 minutos y 4 horas (en segundos)
            v_minutos_estancia := floor(random() * 225) + 15;
            
            -- Hora de entrada se distribuye aleatoriamente dentro de la hora actual
            v_fecha_actual := v_fecha_actual + (floor(random() * 60) * INTERVAL '1 minute');

            -- Solo insertar si la fecha actualizada aún es menor a la fecha fin
            IF v_fecha_actual < v_fecha_fin THEN

                -- EVENTO 1: ENTRADA
                INSERT INTO registros_vehiculos (
                    placa, id_anden, id_camara, fecha_hora_entrada, confianza_placa,
                    ruta_imagen, hash_imagen, evento
                ) VALUES (
                    v_placa, v_id_anden, v_id_camara, v_fecha_actual, v_confianza,
                    '/imagenes/historico/' || TO_CHAR(v_fecha_actual, 'YYYY/MM/DD_HH24MI') || '_' || v_placa || '_in.jpg',
                    encode(digest('hist_entrada_' || v_placa || v_fecha_actual::text, 'sha256'), 'hex'),
                    'entrada'
                );

                -- La salida será la fecha de entrada + tiempo de estancia
                -- EVENTO 2: ACTUALIZAR ENTRADA CON FECHA SALIDA Y CREAR LOG DE SALIDA (si no es futuro)
                IF (v_fecha_actual + (v_minutos_estancia * INTERVAL '1 minute')) < v_fecha_fin THEN
                    
                    UPDATE registros_vehiculos
                    SET fecha_hora_salida = v_fecha_actual + (v_minutos_estancia * INTERVAL '1 minute')
                    WHERE placa = v_placa AND id_anden = v_id_anden AND evento = 'entrada' AND fecha_hora_salida IS NULL;

                    INSERT INTO registros_vehiculos (
                        placa, id_anden, id_camara, fecha_hora_entrada, confianza_placa,
                        ruta_imagen, hash_imagen, evento
                    ) VALUES (
                        v_placa, v_id_anden, v_id_camara, v_fecha_actual + (v_minutos_estancia * INTERVAL '1 minute'), v_confianza,
                        '/imagenes/historico/' || TO_CHAR(v_fecha_actual + (v_minutos_estancia * INTERVAL '1 minute'), 'YYYY/MM/DD_HH24MI') || '_' || v_placa || '_out.jpg',
                        encode(digest('hist_salida_' || v_placa || v_fecha_actual::text, 'sha256'), 'hex'),
                        'salida'
                    );
                END IF;

                v_contador := v_contador + 1;
            END IF;
        END LOOP;
        
        -- Avanzar la simulación 1 hora aprox
        v_fecha_actual := v_fecha_actual + INTERVAL '1 hour';
    END LOOP;

    RAISE NOTICE 'Generación completada. Se generaron % ciclos (aprox. el doble de registros entre entradas y salidas).', v_contador;
END $$;
