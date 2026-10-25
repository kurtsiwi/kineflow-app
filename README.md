# KineFlow

Catálogo de ejercicios de kinesiología con panel de administración, sobre
Next.js 16 (App Router, Cache Components) y Supabase.

## Rutas

| Ruta                        | Acceso    | Qué hace                                               |
| --------------------------- | --------- | ------------------------------------------------------ |
| `/`                         | Público   | Catálogo de ejercicios publicados, con filtros         |
| `/login`                    | Público   | Entrada al panel (email + contraseña)                  |
| `/admin`                    | Con sesión| Lista de ejercicios, publicar/despublicar, eliminar    |
| `/admin/ejercicios/nuevo`   | Con sesión| Crear ejercicio                                        |
| `/admin/ejercicios/[id]`    | Con sesión| Editar ejercicio                                       |

## Base de datos

El esquema vive en `supabase/`:

- `schema.sql` — tabla `exercises`, índices, trigger de `updated_at` y RLS.
- `seed.sql` — ocho ejercicios de ejemplo.

Ambos son idempotentes. Para aplicarlos, pégalos en el SQL Editor de Supabase
(o córrelos contra `KINEFLOW_STORAGE_POSTGRES_URL_NON_POOLING`).

Las políticas de RLS son la autorización real:

- `anon` → solo `select` de ejercicios con `published = true`.
- `authenticated` → lectura y escritura completas.

## Crear un usuario admin

No hay registro público a propósito. Las cuentas se crean a mano en el
dashboard de Supabase: **Authentication → Users → Add user**, marcando
*Auto Confirm User*.

Conviene además apagar el registro abierto en **Authentication → Sign In /
Providers → Email**, desactivando *Allow new users to sign up*. Si no, alguien
podría crearse una cuenta llamando directo al endpoint de Supabase, aunque la
app no tenga pantalla de registro.

## Variables de entorno

Las inyecta la integración de Supabase de Vercel con el prefijo
`KINEFLOW_STORAGE_`. La app solo usa dos:

```
KINEFLOW_STORAGE_SUPABASE_URL
KINEFLOW_STORAGE_SUPABASE_PUBLISHABLE_KEY
```

La service-role key no se usa en ninguna parte del código: todo pasa por RLS.

## Cómo está armado

- `lib/exercise-model.ts` — tipos y helpers puros, compartidos cliente/servidor.
- `lib/exercises.ts` — consultas. El catálogo público va en `"use cache"` con
  tag `exercises`, así que se prerenderiza; las mutaciones lo invalidan con
  `updateTag`.
- `lib/supabase/public.ts` — cliente sin cookies, el único que puede vivir
  dentro de un scope cacheado.
- `lib/supabase/server.ts` — cliente ligado a las cookies del request.
- `lib/auth.ts` — `getSessionUser` (sin cache, para autorizar en actions),
  `getCurrentUser` (`"use cache: private"`, para renderizar UI) y `requireUser`.
- `proxy.ts` — refresca el token de Supabase y hace el chequeo optimista de
  sesión en `/admin`.

Con Cache Components activado, todo lo que lee la sesión va detrás de un
`<Suspense>`; por eso `/admin` es un prerender parcial y no una página
bloqueante.

## Desarrollo

```bash
npm run dev
npm run build
npm run lint
```
