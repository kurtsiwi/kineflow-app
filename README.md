# KineFlow

El kinesiólogo crea ejercicios, los agrupa en rutinas semanales, le envía a
cada paciente un enlace único, y hace seguimiento de quién lo abrió y qué
ejercicios marcó como realizados.

Next.js 16 (App Router, Cache Components) + Supabase.

## Rutas

| Ruta                       | Acceso     | Qué hace                                             |
| -------------------------- | ---------- | ---------------------------------------------------- |
| `/`                        | Público    | Catálogo de ejercicios publicados, con filtros       |
| `/login`                   | Público    | Entrada al panel                                     |
| `/admin`                   | Con sesión | Dashboard de seguimiento                             |
| `/admin/pacientes`         | Con sesión | Crear y listar pacientes                             |
| `/admin/ejercicios`        | Con sesión | Catálogo: crear, editar, publicar                    |
| `/admin/rutinas/nueva`     | Con sesión | Armar una rutina y generar su enlace                 |
| `/admin/rutinas/[id]`      | Con sesión | Enlace del paciente, estado y registros              |
| `/rutina/[token]`          | Token      | Lo que ve el paciente, con "lo hice" y dolor/esfuerzo |

## Flujo

1. **Crear paciente** en `/admin/pacientes`. Se guarda nombre, email y un
   alias (`PAC-0001`, generado solo si no lo escribes).
2. **Armar la rutina** en `/admin/rutinas/nueva`: eliges paciente por alias,
   agregas ejercicios y ajustas series/reps/segundos por rutina.
3. **Enviar el enlace.** La ficha de la rutina trae el enlace con botón de
   copiar y un *Abrir email con el enlace* que abre tu cliente de correo con
   todo escrito. El envío automático no está conectado todavía (ver abajo).
4. **Seguimiento** en `/admin`: rutinas activas, cuáles no se han abierto,
   cuántos registros hubo en los últimos 7 días, y el detalle por ejercicio
   con dolor y esfuerzo.

## Datos personales

El dato identificante está separado a propósito:

- `patients` → solo el alias. Es la tabla que usan el dashboard, las rutinas y
  todo el seguimiento.
- `patient_contacts` → nombre y email. Se lee en un solo lugar del código
  (`getPatientContact`), en la ficha de la rutina, que es donde hay que enviar
  el enlace.

Así el seguimiento completo funciona sin tocar datos identificantes. Dicho
esto: guardar nombre y email **es** tratar datos personales, y en contexto de
rehabilitación hospitalaria la asignación de ejercicios es dato de salud. El
alias reduce la exposición, no la obligación legal.

La función que sirve la rutina al paciente (`routine_by_token`) devuelve el
alias y nunca nombre ni email.

## Seguridad del enlace

El paciente no se loguea: **el token de la URL es la credencial.** Por eso:

- El token son 32 bytes aleatorios en hex (`generateAccessToken`), no el
  alias, que sería enumerable.
- `anon` no tiene ninguna política de RLS sobre `patients`,
  `patient_contacts`, `routines`, `routine_items` ni `routine_item_logs`.
  Verificado: una lectura directa con la clave pública devuelve `[]`.
- Todo el acceso del paciente pasa por tres funciones `security definer` con
  `search_path = ''`, y son lo único que `anon` puede ejecutar:
  `routine_by_token`, `register_routine_open` y `log_routine_item`.
- `log_routine_item` revalida que el ejercicio pertenezca a la rutina de ese
  token, así que un enlace válido no puede registrar avance en la rutina de
  otro paciente.
- Cerrar la rutina invalida el enlace: la página pasa a "ya finalizó" y no se
  filtra ningún contenido.
- `/rutina/[token]` va con `robots: noindex, nofollow, nocache`.

## Base de datos

`supabase/migrations/`, en orden y todas idempotentes:

| Archivo                       | Contenido                                        |
| ----------------------------- | ------------------------------------------------ |
| `0001_exercises.sql`          | Tabla `exercises`, trigger de `updated_at`, RLS  |
| `0002_patients_routines.sql`  | Pacientes, rutinas, items, registros y RLS       |
| `0003_patient_access.sql`     | Funciones `security definer` del acceso por token |
| `0004_routine_tracking.sql`   | Vista `routine_tracking` del dashboard           |

`supabase/seed.sql` tiene ocho ejercicios de ejemplo.

Para aplicarlas: SQL Editor de Supabase, o contra
`KINEFLOW_STORAGE_POSTGRES_URL_NON_POOLING`.

## Crear un usuario admin

No hay registro público. Las cuentas se crean en el dashboard de Supabase:
**Authentication → Users → Add user**, con *Auto Confirm User* marcado.

Conviene también desactivar *Allow new users to sign up* en **Authentication →
Sign In / Providers → Email**: la app no tiene pantalla de registro, pero el
endpoint de Supabase sigue abierto.

## Variables de entorno

Las inyecta la integración de Supabase de Vercel. La app usa dos:

```
KINEFLOW_STORAGE_SUPABASE_URL
KINEFLOW_STORAGE_SUPABASE_PUBLISHABLE_KEY
```

La service-role key no se usa en ninguna parte del código: todo pasa por RLS
o por las funciones `security definer`.

## Notas de Cache Components

Tres cosas que no son obvias y que están así por una razón:

- **`io()` antes de construir el cliente de Supabase** (`lib/supabase/server.ts`,
  `getRoutineByToken`). `@supabase/auth-js` valida la expiración del token
  contra `Date.now()`, y sin esto el prerender se topa con un valor inestable
  y marca la ruta como bloqueante. Se usa `io()` y no `connection()` porque es
  no-op dentro de scopes cacheados y no bloquea los prefetch.
- **`registerRoutineOpen` no lleva `io()`.** Corre dentro de `after()`, o sea
  con el render ya terminado; ahí `io()` queda suspendido para siempre y el
  callback se descarta sin registrar nada.
- **El `now()` del seguimiento vive en Postgres** (vista `routine_tracking`),
  no en JS, justamente para no repartir `Date.now()` por los componentes.

Todo lo que lee la sesión o el token va detrás de un `<Suspense>`, así que las
rutas del panel son prerenders parciales y no páginas bloqueantes.

## Pendiente

- **Envío automático de email.** Hoy el panel genera el enlace y lo copias.
  Para automatizarlo hace falta un proveedor (Resend, SMTP del hospital) y
  conectarlo en la ficha de la rutina, donde ya está el botón de *marcar como
  enviada*.

## Desarrollo

```bash
npm run dev
npm run build
npm run lint
```
