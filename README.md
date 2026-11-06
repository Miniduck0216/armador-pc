# ArmadorPC

Configurador de PC y comparador de precios de tiendas de Ecuador.
Proyecto de Ingeniería Web (UDLA) con **NestJS + SQLite** en el backend y **HTML, CSS y JavaScript con Vite** en el frontend.

```
armador-pc/
├── backend/    API REST (NestJS, TypeORM, SQLite)  → puerto 3000
├── frontend/   Páginas web (Vite, sin framework)     → puerto 5173 en desarrollo
├── package.json  Scripts para correr los dos a la vez
└── README.md
```

## Cómo se reparte el MVC

| Capa | Dónde está | Qué hace |
|---|---|---|
| **Modelo** | `backend/src/**/**.entity.ts` y los `*.service.ts` | Tablas (componentes, ofertas, usuarios, armados…) y reglas de negocio: compatibilidad, puntajes, precios. |
| **Controlador** | `backend/src/**/**.controller.ts` | Rutas `/api/...`: reciben la petición, validan (DTOs con class-validator), llaman al servicio y devuelven JSON. |
| **Vista** | `frontend/` | Páginas HTML + CSS + JS que piden datos a la API con `fetch` y los dibujan. |

Front y back están separados: el backend no genera HTML, solo responde JSON. Así cada parte se puede desarrollar, probar y publicar por separado.

## Requisitos

- Node.js 20 o superior
- npm

## Primer uso

```bash
npm run instalar      # instala la raíz, backend y frontend
copy backend\.env.example backend\.env    # (Windows)  — en Mac/Linux: cp backend/.env.example backend/.env
npm run dev           # levanta API (3000) y web (5173) a la vez
```

Abre **http://localhost:5173**. La documentación interactiva de la API está en **http://localhost:3000/api/docs** (Swagger).

- `npm run demo` → igual, pero con tiendas ficticias y precios simulados (no necesita internet; útil para presentar).
- `npm run prueba` → pruebas del emparejador de productos y del adaptador WooCommerce.
- `npm run build` y luego `npm start` → modo producción: el backend sirve también el frontend compilado en http://localhost:3000.

La base de datos `backend/armadorpc.db` se crea sola la primera vez con todo el catálogo. Si cambias los datos de la semilla, bórrala y vuelve a arrancar.

**Cuentas de prueba**

| Rol | Correo | Contraseña |
|---|---|---|
| Usuario | demo@armadorpc.com | Demo12345 |
| Administrador | admin@armadorpc.com | Admin12345 |

## Páginas

| Página | Para qué sirve |
|---|---|
| `/` | Inicio: ¿qué quieres hacer hoy?, configuraciones, categorías, bajadas de precio, ranking de procesadores, guías |
| `/componentes.html` | Biblioteca con filtros (marca, gama, precio, stock) y orden |
| `/producto.html?id=` | Precios por tienda, historial de 90 días, alerta de precio, especificaciones, análisis (procesadores), reseñas |
| `/comparar.html` | Hasta 3 modelos de la misma categoría lado a lado (gana el verde) |
| `/configurador.html` | Pieza por pieza con compatibilidad en vivo; `?modo=guiado` abre el asistente por presupuesto |
| `/configuraciones.html` | Equipos recomendados (gaming, creación, trabajo) recalculados con los precios de hoy |
| `/herramientas.html` | Comprobador de compatibilidad, calculadora de fuente y de refrigeración |
| `/guias.html` | Guías de compra |
| `/cuenta.html` | Armados guardados, alertas, favoritos, comparaciones y reseñas (requiere sesión) |
| `/admin.html` | Tablero, tiendas y precios, procesadores, usuarios, reportes y reglas (solo administrador) |

## API (resumen)

Todas las rutas empiezan con `/api`. Las marcadas con 🔒 requieren sesión (cookie `sesion`, HttpOnly, la deja `POST /api/auth/ingresar`).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/inicio` | Datos de la portada |
| GET | `/categorias` | Categorías con conteos y precio desde |
| GET | `/componentes?categoria&buscar&marca&gama&precioMin&precioMax&enStock&orden&pagina` | Listado con facetas |
| GET | `/componentes/:id` · `/ofertas` · `/historial` | Ficha, precios por tienda e historial |
| GET | `/comparar-componentes?ids=1,2,3` | Comparación de 2 o 3 piezas |
| GET | `/comparar?a&b` | Comparación detallada de 2 procesadores |
| GET | `/procesadores/:id/analisis` | Puntaje, a favor y en contra |
| GET | `/buscar?q=` · `/bajadas` · `/tiendas` | Búsqueda rápida, ofertas y tiendas |
| POST | `/configurador/resumen` | Total, consumo, compatibilidad y rendimiento de un armado |
| GET | `/configurador/opciones?categoria&piezas` | Opciones de una categoría marcando las incompatibles |
| GET | `/configurador/sugerir?presupuesto&uso&sinGrafica` | Arma un equipo automáticamente |
| GET | `/configuraciones?uso=` · `/configuraciones/:slug` | Configuraciones recomendadas |
| POST | `/herramientas/fuente` · `/herramientas/refrigeracion` | Calculadoras |
| GET | `/guias` · `/guias/:slug` | Guías |
| POST | `/auth/registro` · `/auth/ingresar` · `/auth/salir` · GET `/auth/yo` | Sesión |
| 🔒 | `/cuenta`, `/armados`, `/alertas`, `/favoritos/:id`, `/componentes/:id/resenas`, `/comparaciones` | Datos del usuario |
| 🔒 admin | `/admin/...` | Panel de administración |

### Seguridad

- Contraseñas con bcrypt; sesión con JWT en cookie HttpOnly + SameSite.
- Bloqueo temporal tras varios intentos fallidos de ingreso.
- Guardias de NestJS: `AutenticadoGuard` (sesión) y `RolesGuard` (`@Roles('admin')`); el frontend esconde lo que no corresponde, pero quien decide es el servidor.
- Validación de todos los datos de entrada con DTOs; errores en JSON uniforme (`{ estado, mensaje }`).
- El enlace `?volver=` del ingreso solo acepta rutas del mismo sitio.

## De dónde salen los precios

`PRECIOS_MODO` en `backend/.env`:

- **real** (por defecto): cada 6 horas el backend consulta tiendas reales y guarda el precio más bajo con stock de cada componente.
- **demo**: 5 tiendas ficticias con precios simulados (cada hora).

| Fuente | Cómo se consulta | Estado |
|---|---|---|
| Computron, Tecnosmart, MTEC, Neutron PC Gamer (Ecuador) | API pública de WooCommerce (`/wp-json/wc/store/v1/products?search=`) | Funciona sin claves |
| Mercado Libre Ecuador | API oficial (`/sites/MEC/search`) | Opcional: requiere `MERCADOLIBRE_CLIENT_ID` y `SECRET` |
| AliExpress | API de afiliados (`aliexpress.affiliate.product.query`, envío a EC) | Opcional: requiere App Key, Secret y Tracking ID |
| Amazon | — | No se integró: la Product Advertising API 5 se apaga el 30 de abril de 2026 y su reemplazo (Creators API) exige una cuenta de afiliado aprobada |

Detalles importantes:

- **Emparejador** (`backend/src/precios/fuentes/emparejador.ts`): decide si un producto de la tienda es el mismo modelo del catálogo. Revisa números de modelo, sufijos (Ti, XT, Super, X3D…), palabras excluidas (laptop, PC armado…), la marca y que el precio sea razonable. Así "RX 9070" no se confunde con "RX 9070 XT".
- **IVA**: si la tienda publica precios "+ IVA" se suma el 15 % para comparar lo mismo.
- Si una tienda no responde, se registra el error en el panel de administración y el sitio sigue funcionando con los precios anteriores o el de referencia.
- Las consultas se hacen de una en una por tienda, con pausa (`PRECIOS_ESPERA_MS`), para no sobrecargarlas.

## Imágenes

No se usan emojis: cada componente tiene una **foto real**.

1. Si alguna tienda publica la foto del producto, se usa esa (aparece el crédito de la tienda).
2. Si no, se muestra una **foto de referencia** de Wikimedia Commons de un modelo parecido, con su autor y licencia (CC BY / CC BY-SA) en la ficha. Las tarjetas lo indican con la etiqueta "Foto de referencia".
3. Si una foto no carga, se muestra un dibujo genérico (`frontend/public/sin-imagen.svg`).

El logo (`frontend/public/logo-icono.svg`) es original del proyecto.

## Variables de entorno (`backend/.env`)

| Variable | Valor por defecto | Para qué |
|---|---|---|
| `PORT` | 3000 | Puerto de la API |
| `JWT_SECRETO` | — | Firma de las sesiones. **Obligatoria en producción**: si `NODE_ENV=production` y no existe, la API no arranca |
| `BASE_DATOS` | armadorpc.db | Archivo SQLite |
| `PRECIOS_MODO` | real | `real` o `demo` |
| `PRECIOS_AUTOMATICOS` | si | `no` desactiva la actualización programada |
| `PRECIOS_AL_INICIAR` | si | `no` evita consultar tiendas al arrancar |
| `PRECIOS_ESPERA_MS` | 400 | Pausa entre consultas a una misma tienda |
| `ALIEXPRESS_*`, `MERCADOLIBRE_*` | vacío | Claves opcionales |
| `FRONTEND_ORIGEN` | vacío | Solo si el frontend se publica en otro dominio (activa CORS) |
| `NODE_ENV` | — | `production` en el servidor publicado |

## Administración (panel de `/admin.html`)

Solo entran cuentas con rol **Administrador**. El panel alimenta el core del sistema (catálogo, precios, usuarios y reglas) y tiene estas secciones:

| Sección | Qué permite |
|---|---|
| Tablero | Cifras generales del sistema y estado de los precios |
| Tiendas y precios | Activar o desactivar tiendas, actualizar precios ahora y **cargar un precio manual** |
| Procesadores | Crear, editar y eliminar procesadores (los puntajes se recalculan) |
| Usuarios | Ver cuentas, cambiar su rol o activarlas, y **crear nuevos usuarios** |
| Reportes | Revisar reportes de datos incorrectos enviados por los usuarios |
| Reglas de compatibilidad | Consultar las reglas que usa el configurador |

### Validación en el servidor (datos sensibles)

El navegador valida los formularios para dar una respuesta rápida, pero **esa validación no basta**: cada dato sensible se vuelve a validar en el backend con DTOs (`class-validator`) antes de guardarse en la base de datos. Si la validación falla, la API responde `400` con los mensajes en español y no se graba nada.

| Dato sensible | Dónde se valida | Regla |
|---|---|---|
| Correo de la cuenta nueva | `backend/src/admin/dto/usuario-admin.dto.ts` | Formato de correo válido, máximo 120 caracteres; se guarda en minúsculas y sin espacios |
| Contraseña de la cuenta nueva | `usuario-admin.dto.ts` | 8 a 72 caracteres con letras y números; se cifra con bcrypt antes de guardarla |
| Rol de la cuenta | `usuario-admin.dto.ts` | Solo `admin` o `usuario`; cualquier otro valor se rechaza |
| Enlace de una oferta | `backend/src/admin/dto/oferta-admin.dto.ts` | Solo `http` o `https` con dominio válido. Evita enlaces `javascript:` o de otros protocolos |
| Precio de una oferta | `oferta-admin.dto.ts` | Número entre 0,01 y 100 000 |

Ejemplo: en el navegador se escribe `javascript:alert(1)` como enlace. El formulario lo envía igual, y el servidor responde `400 El enlace debe empezar con https://…` sin tocar la base de datos. Se puede comprobar con la documentación de Swagger en `/api/docs`.

### Menús desplegables dependientes (relaciones entre tablas)

Al cargar un **precio manual** la base de datos tiene relaciones: una oferta pertenece a un componente y a una tienda, y un componente pertenece a una categoría. Por eso el formulario no pide escribir ningún identificador a mano:

1. **Categoría** (desplegable con las categorías de la tabla `categorias`).
2. **Componente** (desplegable que se carga *solo* con los componentes de esa categoría. Mientras no se elija categoría, aparece deshabilitado).
3. **Tienda** (desplegable con las tiendas de la tabla `tiendas`).

Los datos salen de `GET /api/admin/componentes?categoria=CPU` y `GET /api/admin/tiendas`. El servidor también comprueba que el componente y la tienda existan antes de guardar (`404` si no existen). Si ya existe un precio para ese componente y esa tienda, se **actualiza** en lugar de duplicarse.

Para crear un usuario, el formulario usa solo campos de texto y un desplegable de rol, porque el rol es un valor fijo y no una relación con otra tabla.

## Despliegue

El proyecto se publica como **un solo servicio**: el backend compila y sirve también el frontend (`frontend/dist`). El archivo `render.yaml` describe el servicio para Render.

1. Sube el repositorio a GitHub.
2. En [render.com](https://render.com): **New → Blueprint** y elige el repositorio. Render lee `render.yaml`.
3. La primera publicación instala, compila y arranca el servidor. La base de datos se crea sola en el disco persistente `/var/data`.
4. Entra al panel con la cuenta de administrador de prueba y **cambia la contraseña** (o crea otra cuenta de administrador y desactiva la de prueba).

Notas:
- SQLite necesita disco persistente. Sin el disco, los datos se borran en cada reinicio.
- El secreto `JWT_SECRETO` lo genera Render. Si lo cambias, todas las sesiones se cierran.
- Con `PRECIOS_MODO=demo` no se consulta ninguna tienda real. Cambia a `real` cuando quieras precios de Ecuador.
- Comprobación rápida después del despliegue: `https://TU-SERVICIO.onrender.com/api/inicio` debe responder JSON.

## Control de versiones

El historial está en Git. `node_modules`, `dist`, la base de datos SQLite y el archivo `.env` quedan fuera del repositorio (ver `.gitignore`). Para empezar desde cero: `npm run instalar`, copiar `backend/.env.example` a `backend/.env` y ejecutar `npm run dev`.
