# CamBus V2.0 - Sistema Inteligente de Gestión en Patio
**Aplicación Web Full-stack para Control de Acceso y Vehículos**

Este proyecto es una aplicación web integral diseñada para la gestión operativa en patios logísticos. Permite el monitoreo, control de acceso vehicular (tecnología LPR - *License Plate Recognition* simulada), administración de cámaras IoT, creación de reportes de incidencias en tiempo real y perfiles de seguridad jerárquicos.

## 🔥 Características y Requisitos Cumplidos

1. **Modelo de Base de Datos Estructurado (PostgreSQL)**:
   * Tablas creadas: `usuarios`, `camaras`, `andenes`, `registros_vehiculos`, `bitacora_acciones`, `incidencias` y `estado_simulador`.
   * Manejo robusto de Relaciones (Foreing Keys), Restricciones (Check, Not Null) y Particionamiento de datos histórico.
2. **Sistema de Roles y Accesos (Seguridad):**
   * **Admin**, **Supervisor** y **Operador**. Dependiendo de quién inicie sesión, cambian las opciones del menú, los permisos en base de datos y los botones visibles en pantalla.
   * Contraseñas encriptadas mediante la extensión `pgcrypto` nativa de PostgreSQL y seguridad frontend por JWT (JSON Web Tokens).
3. **Interfaz de Usuario (UX/UI):**
   * Diseño Dark Mode responsivo con TailwindCSS 4.0, iconos Lucide y animaciones (Next.js 15, React 19).
   * Elementos modernos empresariales como tarjetas `glassmorphism`, grillas, modales flotantes y paneles interactivos.
4. **Operaciones del Sistema (CRUD Completo):**
   * Permite añadir, actualizar, visualizar y borrar registros operativos tanto de manera automática mediante el emulador de cámaras subyacente, como manualmente por medio de la interfaz. Funcional para *Cámaras*, *Vehículos* e *Incidencias*.

---

## 🛠️ Instrucciones de Instalación y Ejecución

Sigue estos sencillos pasos para probar el proyecto localmente sin complicaciones. 

### Prequisitos
* Tener **Node.js** (versión 20 o superior) instalado.
* Tener **PostgreSQL** (versión 16) instalado y estar ejecutándose localmente en el puerto `5432` con el usuario maestro por defecto (`postgres`).

### 1. Inicialización de la Base de Datos

Hemos encapsulado toda la estructura, usuarios y datos semilla en un único archivo. Abre **PgAdmin** (o la herramienta psql de terminal), conéctate a tu base de datos y ejecuta el siguiente script EN SU TOTALIDAD (puedes crear una base de datos temporal si gustas o correrla sobre la por defecto):

1. Descarga/Copia el código local: Abre el archivo **`cambus_v2.sql`** ubicado en la raíz de este proyecto.
2. Cópialo y ejecútalo mediante la consola Query o PgAdmin.
   * *El script es autosuficiente: automáticamente creará la arquitectura, los 3 roles limitados de acceso, los triggers, las vistas y añadirá vehículos y andenes de prueba.*

### 2. Instalación del Entorno Frontend

Abre la terminal de comandos (cmd o powershell) en la carpeta del código fuente de este proyecto:

```bash
# 1. Instalar las dependencias de React/Next.js
npm install

# 2. Iniciar el servidor web local
npm run dev
```

### 3. Uso de la Aplicación

1.  Abre tu navegador de preferencia y entra a **`http://localhost:3000`**.
2.  Deberás iniciar sesión. Existen 3 usuarios precargados en el script inicial. Usa el que gustes dependiendo de la experiencia a evaluar:

| Rol | Correo electrónico | Contraseña Obligatoria |
| --- | --- | --- |
| **Administrador** | `admin@cambus.local` | `CamBus2026!` |
| **Supervisor** | `supervisor1@cambus.local` | `Sup3rv1sor!` |
| **Operador** | (Crear uno nuevo manualmente) | `cambus_oper_123` |

### 4. Extra: Ejecutar el Simulador Inteligente en Segundo Plano

Para evaluar el sistema en **"Tiempo Real"** como si estuviera en la vida real, el proyecto incluye un Robot (*Daemon*) que genera tráfico logístico (vehículos entrando y saliendo) en el fondo. 
Para activarlo, abre **otra pestaña de terminal** (distinta a la que está corriendo `npm run dev`), sitúate en la carpeta de este proyecto y ejecuta:

```bash
npm run daemon
```
*Si tienes este comando corriendo, podrás navegar por el sistema web en el navegador y verás cómo los números del tablero central cambian por sí solos.*

---
**Desarrollado para Entrega Final Universitaria.**
