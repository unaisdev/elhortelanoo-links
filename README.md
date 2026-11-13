# elhortelanoo links

Página tipo Linktree para **elhortelanoo**, con panel de administración protegido por contraseña. Hosting pensado para **Cloudflare Pages + D1** (tier gratuito).

## Qué incluye

- Página pública (`/`) con avatar, nombre, bio y links
- Admin (`/admin`) solo con sesión válida
- Login (`/admin/login`) con contraseña + cookie `httpOnly` firmada
- CRUD de links (crear, editar, ocultar, borrar, reordenar)
- Edición de perfil
- Rate limit de login tras varios fallos

## Stack

- Astro 5 + React (islas en admin)
- Cloudflare Pages (SSR)
- Cloudflare D1 (SQLite)
- Auth: `ADMIN_PASSWORD_HASH` (bcrypt) + `SESSION_SECRET`

## Desarrollo local

Requisitos: Node 22+.

```bash
cp .dev.vars.example .dev.vars
npm install
npm run db:migrate:local
npm run hash-password -- "tu-contraseña"
# pega el hash en .dev.vars como ADMIN_PASSWORD_HASH
npm run dev
```

- Pública: http://localhost:4321/
- Admin: http://localhost:4321/admin/login

El hash de ejemplo en `.dev.vars.example` corresponde a la contraseña `changeme` (solo para pruebas locales).

`SESSION_SECRET` debe tener **al menos 32 caracteres**.

## Deploy gratis en Cloudflare

### 1. Crear la base D1

```bash
npx wrangler login
npx wrangler d1 create elhortelanoo
```

Copia el `database_id` que te devuelve y sustitúyelo en `wrangler.jsonc` (campo `d1_databases[0].database_id`).

### 2. Aplicar migraciones en remoto

```bash
npm run db:migrate:remote
```

### 3. Variables de entorno (Secrets)

En el dashboard de Cloudflare Pages → Settings → Environment variables (o con wrangler):

- `ADMIN_PASSWORD_HASH` — salida de `npm run hash-password -- "tu-contraseña-segura"`
- `SESSION_SECRET` — cadena aleatoria ≥ 32 caracteres

### 4. Conectar el repo a Pages

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → conectar GitHub
2. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. Asegúrate de que el proyecto Pages use el mismo `wrangler.jsonc` / binding `DB` a la D1 `elhortelanoo`

Alternativa CLI:

```bash
npm run build
npx wrangler pages deploy dist
```

(Según tu flujo de Astro + adapter Cloudflare, el deploy recomendado es el de Pages con el worker generado por el adapter.)

### 5. Instagram

Cuando tengas la URL (`https://elhortelanoo.pages.dev` o tu dominio), ponla en la bio de Instagram.

## Rutas útiles

| Ruta | Uso |
|------|-----|
| `/` | Página pública de links |
| `/admin/login` | Login admin |
| `/admin` | Panel (requiere sesión) |

## Seguridad

- No hay registro público ni multi-usuario
- La cookie de sesión es `httpOnly`, `Secure` (en HTTPS) y `SameSite=Lax`
- Tras 5 logins fallidos, bloqueo temporal ~15 minutos
- Nunca subas `.dev.vars` ni hashes/contraseñas al repo
