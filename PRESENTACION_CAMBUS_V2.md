# 🚛 Presentación Técnica: CamBus V2.0 - Radar Logístico IoT

> **Contexto para la Audiencia**: Este documento explica de manera estructurada cómo funciona el ecosistema completo del proyecto "CamBus V2.0". Está diseñado para explicar tecnologías complejas en términos sencillos.

---

## 1. El Problema que Resolvemos
En los patios logísticos e industriales (como los de Mabe), el seguimiento manual de camiones, andenes ocupados y tiempos de descarga es ineficiente y propenso a errores. 

**Nuestra solución (CamBus V2.0)** es un "Ecosistema Digital" inteligente que automatiza todo este control. Combina una arquitectura de Base de Datos ultrarrápida y segura con una Interfaz Web Visual en Tiempo Real.

---

## 2. La Arquitectura (Cómo se conectan las piezas)

El proyecto se divide en dos grandes "cerebros":

1. **El Back-End y Almacenamiento (PostgreSQL 16):** Donde guardamos la información y aplicamos la inteligencia de negocio (reglas estrictas).
2. **El Front-End y Simulador (Next.js 15):** Lo que el usuario ve, la pantalla del Centro de Control y el Radar Digital.

---

## 3. Explicando las Tecnologías a los Compañeros

### 🐘 PostgreSQL (La Base de Datos)
Es el motor principal. Aquí no solo guardamos tablas vacías; **la base de datos toma decisiones por sí sola**.
* **Triggers Automatizados:** Escribimos "disparadores". Si un camión entra a la base de datos, un trigger cambia automáticamente la luz del andén a Rojo (Ocupado). El programador web no tiene que hacerlo, la base de datos se vigila a sí misma.
* **Particionamiento Automático (Declarativo):** En un patio logístico real hay miles de camiones al mes. Si metemos todo en una tabla, el sistema se vuelve lento. Resolvimos esto "cortando" la tabla por años (`reg_vehiculos_2025`, `2026`, etc.). El sistema sabe soltar y leer datos rápidos sin buscar en toda la historia.
* **Vistas Optimizadas:** Usamos "Views" como `v_dashboard_andenes` que son como "fotografías pre-procesadas" en tiempo real de los camiones para que el Dashboard no se trabe al cargar.

### 🔐 Criptografía (Evidencia SHA-256)
En la logística industrial, las pruebas fotográficas (matrículas) pueden ser alteradas.
* Para proteger la Cadena de Custodia, incluimos **pgcrypto** y **Hashes SHA-256**.
* *¿Cómo explicarlo?* "Un Hash SHA-256 es una 'huella digital' única de un texto o imagen. Si alguien abre la foto del camión en Photoshop y le cambia un píxel, la huella digital cambia totalmente. Nuestra base de datos rechaza cualquier inserción si esta huella digital electrónica falla".

### ⚛️ Next.js 15 y React (El Centro de Control Web)
Es la tecnología de punta detrás de páginas como Netflix o TikTok. Nos permite crear una interfaz veloz que no requiere recargar la página web con el clásico botón F5.
* **TypeScript:** Obliga a nuestro código a tener disciplina. Evita que un programador pueda guardar "hola" en el campo donde debería ir un "número de camión".
* **TailwindCSS:** En lugar de escribir miles de archivos de estilos CSS, usamos palabras clave directamente en los componentes para darle ese "Dark Mode" moderno y efecto cristal.

---

## 4. El "As bajo la manga": El Radar Gemelo Digital (Simulador)

Como no podemos llevar cámaras IoT físicas a la exposición para grabar camiones entrando, creamos un **Gemelo Digital (Simulador 2D)**.

**¿Cómo funciona nuestro radar?** 
1. **La Pantalla de Radar (`/simulador`):** Creada puramente dibujando sobre la pantalla con React. Cada camión amarillo que baja es matemática pura en el navegador animándose cada 100 milisegundos.
2. **La Conexión Pura API (`/api/simulador/ingreso`):** Cuando el bloque en la pantalla toca la ranura verde (Andén), el sistema "despierta" a nuestro servidor y le manda un pulso HTTP (POST).
3. **Falsificación Inteligente:** El servidor atrapa este pulso e **inventa datos hiperrealistas** en milisegundos:
   * "Crea una placa falsa (`ABC-123-X`)."
   * "Crea un Hash Criptográfico falso para engañar al nivel de seguridad de la base de datos de manera limpia."
   * "Manda el comando `INSERT` hacia PostgreSQL."
4. **La Sincronización:** Una vez que PostgreSQL responde "Okay, lo guardé", es cuando la luz del andén en nuestro simulador brilla en verde neón de Éxito.

**Salida (Desconexión):** 
8 segundos después, el camión desaparece de la pantalla del radar. Justo en ese momento, mandamos otra ráfaga a la base de datos diciendo *"Actualiza la hora de Salida de esta Placa y cambia el andén de nuevo a Libre"*. 

---

## 5. El Flujo de Demostración Sugerido (Paso a Paso)

Este es el orden ideal para que la profesora quede impresionada:

**A. Muestra la Base de Datos V2.0:** Abre `cambus_v2.sql` rapidísimo, enséñale la zona donde la tabla se "particiona" y menciónale que implementaste Hashes Criptográficos para evitar hackeos a los registros.

**B. Abre el Dashboard en vivo (Ventana 1):**
Pon tu explorador a la DERECHA en `http://localhost:3000`. Explica que **NO son datos estáticos**, los andenes que dice "LIBRE" es porque la base de datos lo está indicando.
*"Profa, fíjese como están en ceros (o libres) y la Actividad Reciente está lista."*

**C. Abre el Gemelo Digital Radar (Ventana 2):**
Pon el explorador a la IZQUIERDA en `http://localhost:3000/simulador`. 
Explica: *"Como no pude montar una cámara real aquí, hicimos este Radar IoT. Se mueve un camión."*

**D. El Momento Clímax (El Enlace de Ambas Pantallas):**
Cuando un cuadrito del simulador toque el andén y se estacione (ponga la placa y diga HASH OK):
*"Vea cómo la placa XYZ aterrizó aquí. Ahora, si vemos mi Dashboard Principal al otro lado de la pantalla... ¡El Andén cobró vida inmediatamente y el registro ya está documentado como Entrada!"*

Cuando pasen 8 segundos y el camión libere la ranura en el radar:
*"Y de forma autónoma, el camión se va, avisa al backend que se fue, y mi Actividad Reciente actualiza y pone el andén Libre de nuevo".*
