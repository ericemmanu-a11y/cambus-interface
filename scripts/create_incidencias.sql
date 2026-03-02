CREATE TABLE IF NOT EXISTS incidencias (
    id_incidencia SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    nivel_gravedad VARCHAR(20) DEFAULT 'media' CHECK (nivel_gravedad IN ('baja', 'media', 'alta', 'critica')),
    estado VARCHAR(20) DEFAULT 'abierta' CHECK (estado IN ('abierta', 'en_progreso', 'resuelta')),
    fecha_reporte TIMESTAMPTZ DEFAULT NOW(),
    fecha_resolucion TIMESTAMPTZ
);

GRANT SELECT, INSERT, UPDATE, DELETE ON incidencias TO cambus_admin;
GRANT SELECT, INSERT, UPDATE ON incidencias TO cambus_supervisor;
GRANT USAGE ON SEQUENCE incidencias_id_incidencia_seq TO public;
