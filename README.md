# ArmadorPC – Configurador de PC y comparador de precios (MVC con NestJS)

Aplicación web para armar una computadora pieza por pieza: revisa que las piezas sean compatibles, calcula el rendimiento y muestra el precio más bajo de cada pieza en tiendas de Ecuador. Tiene un panel de administración que mantiene los datos que usa el configurador (precios por tienda, procesadores, tiendas y usuarios). Está hecha con el patrón **Modelo – Vista – Controlador**.

- **Deploy:** https://armadorpc.onrender.com
- **Video:** https://youtu.be/EWQa9NILkZE

## Tecnologías

- Node.js 22 o superior + NestJS 10 (API REST)
- TypeORM + SQLite (better-sqlite3); los datos de prueba se cargan solos al iniciar
- HTML, Sass (con metodología BEM) y JavaScript con Vite para las vistas
- class-validator para validar los datos en el servidor
- bcrypt y JWT en cookie HttpOnly para las sesiones
- Render para el despliegue

## Estructura MVC

```
armador-pc/
├── backend/                         # API (puerto 3000)
│   └── src/
│       ├── main.ts                  # arranca NestJS y sirve el frontend compilado
│       ├── componentes/             # MODELO: entidad Componente y su servicio
│       ├── categorias/              # MODELO: entidad Categoria
│       ├── precios/                 # MODELO: Tienda, Oferta, historial y sincronización de precios
│       ├── usuarios/                # MODELO: Usuario, Rol y Permiso; catálogo de permisos
│       ├── configurador/            # core: compatibilidad, rendimiento y armado automático
│       ├── admin/                   # CONTROLADOR del panel de administración
│       │   ├── admin.controller.ts  # rutas /api/admin, cada una protegida por un permiso
│       │   └── dto/                 # validación en el servidor de los datos sensibles
│       ├── auth/                    # ingreso, sesiones y PermisosGuard
│       └── semilla/                 # datos de prueba (componentes, tiendas, cuentas)
├── frontend/                        # VISTA (puerto 5173 en desarrollo)
│   ├── *.html                       # una página por pantalla
│   └── src/
│       ├── paginas/                 # JS de cada página (admin.js = panel)
│       └── sass/                    # estilos: abstractos, base, componentes y páginas
├── docs/                            # especificación funcional, diagramas y guion del video
├── package.json                     # scripts para correr backend y frontend a la vez
└── render.yaml                      # configuración del despliegue
```

| Capa | Qué hace aquí |
|------|---------------|
| Modelo | Entidades de TypeORM (`*.entity.ts`) y servicios (`*.service.ts`): tablas, compatibilidad, puntajes y precios. |
| Vista | Páginas HTML que piden datos a la API y los muestran. No guardan nada por su cuenta. |
| Controlador | Recibe la petición, valida los datos con DTOs, llama al servicio y responde JSON. |

## Panel de administración

Ruta: `/admin.html`. Cada rol ve solo las secciones que tiene permitidas, y el servidor vuelve a comprobar el permiso en cada petición aunque alguien conozca las rutas.

| Sección | Qué permite |
|---------|-------------|
| Tablero | Cifras del sistema y estado de los precios |
| Tiendas y precios | Activar o desactivar tiendas, actualizar precios y **cargar un precio manual** |
| Procesadores | Crear, editar y eliminar procesadores (los puntajes se recalculan) |
| Usuarios | Cambiar rol o estado de una cuenta y **crear usuarios** |
| Roles y permisos | Matriz de casillas rol × permiso y creación de roles nuevos |
| Reportes | Resolver reportes de datos incorrectos enviados por usuarios |
| Reglas | Ver las reglas de compatibilidad que usa el configurador |

### Roles y permisos

Los roles y permisos son tablas: `roles`, `permisos` y la tabla intermedia `roles_permisos` (muchos a muchos). Cada usuario tiene una llave foránea `rolId` hacia `roles`.

| Rol | Permisos iniciales |
|-----|--------------------|
| Administrador | Todos (no se pueden quitar, para no perder el acceso al sistema) |
| Técnico | Panel, componentes, reglas, precios, revisar armados y reportes |
| Usuario | Ninguno del panel: arma su PC, guarda armados y escribe reseñas |

- **Backend:** cada ruta declara el permiso que necesita con `@Permisos('precios.gestionar')`. `PermisosGuard` compara contra los permisos del rol, leídos de la base en cada petición, así que un cambio se aplica al instante. Si falta el permiso, responde `403`.
- **Frontend:** `/api/auth/yo` devuelve los permisos del usuario. El panel muestra solo las secciones permitidas y, si se abre una sección prohibida por la dirección, salta a la primera permitida.
- **Gestión:** desde *Roles y permisos* se marcan casillas o se crean roles nuevos (por ejemplo, Vendedor solo con precios). Los roles del sistema no se pueden eliminar, ni tampoco un rol que tenga usuarios.

### Validación en el backend de datos sensibles

El navegador revisa los formularios, pero eso no basta: cada dato sensible se valida otra vez en el servidor antes de grabarse. Si no cumple, la API responde `400` con el mensaje y no guarda nada.

| Dato | Archivo | Regla |
|------|---------|-------|
| Contraseña | `backend/src/admin/dto/usuario-admin.dto.ts` | 8 a 72 caracteres, con letras y números. Se cifra con bcrypt |
| Correo | `usuario-admin.dto.ts` | Formato válido, máximo 120 caracteres, no repetido |
| Rol | `usuario-admin.dto.ts` | Número de un rol que exista en la tabla `roles` |
| Enlace de la oferta | `backend/src/admin/dto/oferta-admin.dto.ts` | Solo `http` o `https`; bloquea enlaces `javascript:` |
| Precio de la oferta | `oferta-admin.dto.ts` | Entre 0,01 y 100 000 |

### Desplegables dependientes

Una oferta (precio) tiene dos llaves foráneas: el componente y la tienda. Y cada componente pertenece a una categoría. En el formulario **Cargar precio manual** no se escribe ningún ID:

1. **Categoría:** desplegable con la tabla `categorias`.
2. **Componente:** se carga solo con los componentes de la categoría elegida (`GET /api/admin/componentes?categoria=CPU`). Está deshabilitado hasta elegir categoría.
3. **Tienda:** desplegable con la tabla `tiendas`.

Antes de guardar, el servidor comprueba que el componente y la tienda existan. Si ya hay un precio para ese par, lo actualiza en vez de duplicarlo.

Lo mismo al crear un usuario o cambiar su rol: el rol se elige en un desplegable que se carga desde la tabla `roles`, y el servidor comprueba que exista.

## Reglas de compatibilidad (core)

| Regla | Qué revisa |
|-------|-----------|
| Zócalo del procesador y la placa | Que el socket coincida (AM5, LGA1700…) |
| Tipo de memoria de la placa | DDR4 o DDR5 según la placa |
| Memoria soportada por el procesador | Que el procesador admita ese tipo de RAM |
| Tamaño de la placa y la caja | ATX, Micro-ATX o Mini-ITX |
| Largo de la tarjeta gráfica | Que entre en la caja |
| Zócalo y capacidad de la refrigeración | Que sirva para el procesador y disipe su calor |
| Potencia de la fuente | Que cubra el consumo total con margen |

Las reglas están en la tabla `reglas_compatibilidad`.

## Rutas

| Ruta | Descripción |
|------|-------------|
| `GET /` | Página de inicio |
| `GET /configurador.html` | Configurador pieza por pieza (core) |
| `GET /pedido.html` | Lista de compra por tienda |
| `GET /admin.html` | Panel de administración |
| `GET /api/docs` | Documentación de la API (Swagger) |
| `POST /api/configurador/resumen` | Total, compatibilidad y rendimiento de un armado |
| `GET /api/pedido?ids=1,2,3` | Lista de compra con la mejor tienda por pieza |
| `GET /api/admin/tiendas` | Tiendas para el desplegable |
| `GET /api/admin/componentes?categoria=` | Componentes de una categoría (desplegable dependiente) |
| `POST /api/admin/ofertas` | Guarda un precio manual (validado en el servidor) |
| `POST /api/admin/usuarios` | Crea una cuenta (validada en el servidor) |
| `GET /api/admin/tablero` | Cifras del panel |
| `GET /api/admin/roles` | Roles con sus permisos y catálogo de permisos |
| `POST /api/admin/roles` | Crea un rol (código y permisos validados en el servidor) |
| `PUT /api/admin/roles/:id/permisos` | Cambia los permisos de un rol |
| `DELETE /api/admin/roles/:id` | Elimina un rol sin usuarios |

## Ejecutar en local

```bash
npm run instalar                       # instala raíz, backend y frontend
cp backend/.env.example backend/.env   # en PowerShell: copy backend\.env.example backend\.env
npm run dev                            # API en :3000 y web en :5173
```

Abrir http://localhost:5173

- `npm run demo`: igual, pero con tiendas y precios simulados (no necesita internet).
- `npm run prueba`: pruebas del emparejador de productos.
- En PowerShell, si sale "la ejecución de scripts está deshabilitada", usar `npm.cmd` en lugar de `npm`.

**Cuentas de prueba**

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Administrador | admin@armadorpc.com | Admin12345 |
| Técnico | tecnico@armadorpc.com | Tecnico12345 |
| Usuario | demo@armadorpc.com | Demo12345 |

## Casos de prueba

| Formulario | Dato enviado | Resultado |
|------------|--------------|-----------|
| Cargar precio | Enlace `javascript:alert(1)` | `400` El enlace debe empezar con https:// |
| Cargar precio | Precio `-5` | `400` El precio debe ser mayor a 0 |
| Cargar precio | Tienda que no existe (`tiendaId: 999`) | `404` Esa tienda no existe |
| Cargar precio | Datos correctos | Precio guardado; si se repite, se actualiza |
| Nuevo usuario | Contraseña `solotexto` | `400` La contraseña debe tener letras y números |
| Nuevo usuario | Rol que no existe (`rolId: 99`) | `404` Ese rol no existe |
| Nuevo usuario | Correo ya registrado | `409` Ya existe una cuenta con ese correo |
| Cualquier ruta `/api/admin` | Sin sesión | `401` |
| `/api/admin/usuarios` | Sesión de Técnico | `403` Tu rol no tiene permiso para esta acción |
| Nuevo rol | Código `X Y` | `400` El código debe tener de 3 a 30 letras minúsculas o guiones bajos |
| Permisos de un rol | Permiso `hackear.todo` | `400` Hay permisos que no existen |
| Permisos del Administrador | Lista vacía | `400` Los permisos del Administrador no se pueden cambiar |
| Eliminar rol | Técnico (rol del sistema) | `400` Los roles del sistema no se pueden eliminar |

## Despliegue en Render

1. Subir el proyecto a GitHub.
2. En Render: **New → Blueprint** y elegir el repositorio. Render lee el `render.yaml`.
3. Build command: `npm install --include=dev && npm install --include=dev --prefix backend && npm install --include=dev --prefix frontend && npm run build` (el `--include=dev` hace falta porque Render usa `NODE_ENV=production` y sin él no instala las herramientas de compilación)
4. Start command: `npm start`
5. Plan Free → **Deploy**.

El backend sirve también el frontend compilado, así que todo queda en una sola dirección. En el plan Free la base de datos vuelve a los datos de prueba cada vez que el servicio se reinicia, y el servicio se duerme tras unos minutos sin uso (la primera visita tarda más). Render genera `JWT_SECRETO` automáticamente; en producción la API no arranca sin esa variable.

Comprobación: `https://TU-SERVICIO.onrender.com/api/inicio` debe responder JSON.

## Variables de entorno (`backend/.env`)

| Variable | Por defecto | Para qué |
|----------|-------------|----------|
| `PORT` | 3000 | Puerto de la API |
| `JWT_SECRETO` | — | Firma de las sesiones (obligatoria en producción) |
| `BASE_DATOS` | armadorpc.db | Archivo SQLite |
| `PRECIOS_MODO` | real | `real` consulta tiendas de Ecuador; `demo` usa precios simulados |
| `PRECIOS_AL_INICIAR` | si | `no` evita consultar tiendas al arrancar |
| `NODE_ENV` | — | `production` en el servidor publicado |

`node_modules`, `dist`, la base de datos y `.env` no se suben al repositorio (ver `.gitignore`).
