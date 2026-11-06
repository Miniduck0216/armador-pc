# Guion del video: Administración MVC de ArmadorPC

**Duración sugerida:** 8 a 10 minutos · **Plataforma:** Loom o YouTube (no listado o público, según indique el docente)
**Quién habla:** Andrés Méndez · **Materia:** [Código y nombre de la materia] · **NRC:** [ ]

## 1. Presentación (0:00 – 0:45)

- Nombre, carrera y proyecto: ArmadorPC, configurador de PC y comparador de precios de tiendas de Ecuador.
- Enlace al repositorio de GitHub y a la aplicación publicada.
- Qué se va a mostrar: el panel de administración sobre el core aprobado.

## 2. El core que alimenta la administración (0:45 – 2:00)

- El core es el configurador de armado: compatibilidad, rendimiento, precios por tienda y lista de compra.
- Qué datos administra el administrador para que el core funcione:
  - **Catálogo:** componentes por categoría (`categorias`, `componentes`).
  - **Precios:** ofertas de cada componente en cada tienda (`ofertas`, `tiendas`).
  - **Usuarios:** cuentas, roles y rol de administrador (`usuarios`).
  - **Reglas:** compatibilidad entre piezas (`reglas_compatibilidad`).
- Mostrar el diagrama entidad-relación (`docs/diagramas/er-global.png`) y señalar las relaciones que usa el panel.

## 3. Recorrido por el panel (2:00 – 3:30)

- Iniciar sesión con la cuenta de administrador. Mostrar que un usuario común no puede entrar a `/admin.html`.
- Tablero: cifras del sistema y estado de la actualización de precios.
- Tiendas y precios: activar o desactivar una tienda y disparar la actualización.
- Procesadores: crear o editar uno. Mostrar que los puntajes se recalculan al guardar.
- Usuarios: cambiar un rol y crear una cuenta nueva.
- Reportes: resolver un reporte de un dato incorrecto.

## 4. Relación entre tablas con menú desplegable dependiente (3:30 – 5:30)

**Caso:** cargar el precio de un componente en una tienda.

1. Abrir **Tiendas y precios → Cargar precio manual**.
2. Mostrar que el campo **Componente** está deshabilitado mientras no hay categoría.
3. Elegir **Categoría = Tarjeta gráfica**: el menú de componentes se llena solo con las tarjetas gráficas.
4. Elegir **Categoría = Procesador**: el menú cambia y ya no aparece ninguna tarjeta gráfica.
5. Elegir la tienda desde su desplegable (la tienda no se escribe a mano).
6. Explicar en voz alta: el formulario nunca pide el número de la llave foránea. El usuario elige un nombre, y el sistema usa el identificador por detrás.
7. Mostrar en el código la llamada `GET /api/admin/componentes?categoria=...` (`frontend/src/paginas/admin.js`, función `formularioOferta`).

## 5. Validación en el backend de datos sensibles (5:30 – 7:30)

Datos sensibles del sistema: **correo, contraseña y rol** de las cuentas, y **enlace y precio** de las ofertas.

1. Mostrar en el navegador una contraseña sin números (`solotexto`) y el mensaje de error.
2. **Demostración clave:** escribir un enlace `javascript:alert(1)` y mostrar que el navegador lo deja pasar. El servidor lo rechaza con `400`.
3. Ejecutar la misma petición sin el navegador, con `curl`, y mostrar que la respuesta sigue siendo `400`:
   ```bash
   curl -b cookies.txt -H "Content-Type: application/json" \
     -d '{"componenteId":75,"tiendaId":1,"precio":150,"enStock":true,"url":"javascript:alert(1)"}' \
     http://localhost:3000/api/admin/ofertas
   ```
4. Mostrar el código de `backend/src/admin/dto/usuario-admin.dto.ts` y `oferta-admin.dto.ts`: decoradores `@IsEmail`, `@Matches`, `@IsIn`, `@IsUrl`.
5. Mostrar que la contraseña se cifra con bcrypt (`usuarios.service.ts`) y nunca se guarda en texto plano.

## 6. Git y despliegue (7:30 – 8:45)

- Mostrar el historial del repositorio (`git log --oneline`) y el archivo `.gitignore`: la base de datos, `.env` y `node_modules` no se suben.
- Mostrar el `README.md`: instalación, roles, validaciones, despliegue.
- Mostrar `render.yaml`: el servicio, el disco persistente y la variable `JWT_SECRETO` generada.
- Abrir la aplicación publicada y el endpoint `/api/inicio`.

## 7. Cierre (8:45 – 9:30)

- Resumen: qué administra el panel, cómo se valida en el servidor y cómo se relacionan las tablas.
- Qué mejoraría: auditoría de cambios de precios y confirmación por correo al crear cuentas.

## Lista de comprobación antes de grabar

- [ ] Servidor en modo demostración (`npm run demo`) o publicado, sin errores en consola.
- [ ] Cuenta de administrador lista y contraseña de prueba cambiada en la versión publicada.
- [ ] Ventana de terminal con `curl` preparada con la cookie de sesión.
- [ ] Editor abierto en los archivos de `backend/src/admin/dto/` y `frontend/src/paginas/admin.js`.
- [ ] Micrófono probado y pantalla en 1920 × 1080 o 1280 × 720.
