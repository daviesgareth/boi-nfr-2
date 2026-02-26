# NFR V3 Hardening Log

Tracking progress through security, ops, and code quality improvements.
All phases completed ✓

---

## Phase 1 — Security Hardening ✅ (commit `afe0bfd`)
- [x] Install helmet, express-rate-limit, compression
- [x] Add helmet middleware with CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- [x] Restrict CORS to production domain + localhost dev (via ALLOWED_ORIGINS env)
- [x] Add rate limiting on login (10 attempts/15 min) and general API (200/min)
- [x] Require JWT_SECRET env var in production (fail-fast via `server/env.js`)
- [x] Require ADMIN_PASSWORD env var in production (fail-fast via `server/env.js`)
- [x] Strengthen password policy (8+ chars, uppercase + lowercase + number)
- [x] Add env validation module (`server/env.js`) that runs at startup
- [x] Create reusable validation helpers (`server/middleware/validate.js`)

## Phase 2 — Ops & Stability ✅ (commit `afe0bfd`)
- [x] Add unauthenticated /health endpoint (DB ping with SELECT 1)
- [x] Add graceful shutdown (SIGTERM/SIGINT handlers, 10s forced exit)
- [x] Add HTTPS enforcement middleware (X-Forwarded-Proto check in production)
- [x] Add compression middleware (gzip responses)
- [x] Add static asset cache headers (1d public, 7d immutable for dist)

## Phase 3 — Upload Hardening ✅ (commit `afe0bfd`)
- [x] Add server-side file type validation (MIME whitelist + extension whitelist)
- [x] Add file size limit (100 MB via multer)
- [x] Sanitise uploaded filenames (strip special chars, limit to 80 chars)
- [x] Single file limit enforced
- [x] Upload mode whitelisted to 'merge' | 'replace'
- [x] Files cleaned up after processing (fs.unlinkSync)

## Phase 4 — Error Handling & Logging ✅ (commit `afe0bfd`)
- [x] Improve error handler (hide internals in production, add random hex error IDs)
- [x] Add user context to error logs (`[errorId] METHOD /path (user: username)`)
- [x] Sanitise error messages sent to client (500s hidden in production)
- [x] Handle Multer-specific errors gracefully (file size, invalid file type)

## Phase 5 — Code Quality ✅ (commit `da2ca7c`)
- [x] Install eslint@^9, @eslint/js@^9, eslint-plugin-react-hooks@^5, globals, prettier
- [x] Add `eslint.config.mjs` — flat config with separate server (CJS/Node) and frontend (ESM/React/JSX) sections
- [x] Add `.prettierrc` config (single quotes, trailing commas, 120 print width)
- [x] Add `.prettierignore` (dist, data, uploads, node_modules)
- [x] Add lint/format scripts to package.json (`lint`, `lint:fix`, `format`, `format:check`)
- [x] ESLint result: 0 errors, 180 warnings (JSX component usage false positives — safe to ignore)

## Phase 6 — Database & Input Validation ✅ (commit `afe0bfd`)
- [x] Add input validation helpers (`validatePassword`, `validateEnum`, `validateInt`)
- [x] Validate audit log category param against whitelist (`VALID_CATEGORIES`)
- [x] Add negative offset guard (min: 0 via `validateInt`)
- [x] Bounds-check limit param (min: 1, max: 200)
- [x] DB ping in /health endpoint (SELECT 1 AS ok)

---

## Files Created
| File | Purpose |
|------|---------|
| `server/env.js` | Centralised environment validation, fail-fast in production |
| `server/middleware/validate.js` | Reusable password, enum, and integer validation helpers |
| `eslint.config.mjs` | ESLint 9 flat config (server CJS + frontend ESM/JSX) |
| `.prettierrc` | Prettier formatting config |
| `.prettierignore` | Prettier ignore patterns |

## Files Modified
| File | Changes |
|------|---------|
| `server/index.js` | Helmet, CORS, rate limiting, compression, HTTPS enforcement, /health, graceful shutdown, static cache headers |
| `server/middleware/auth.js` | Uses centralised config from `env.js` |
| `server/middleware/error-handler.js` | Error IDs, production-safe messages, Multer error handling |
| `server/db.js` | Uses centralised config for dataDir and adminPassword |
| `server/routes/admin.js` | Input validation on audit log params, uses centralised config |
| `server/routes/auth.js` | Uses `validatePassword` for password changes |
| `server/routes/users.js` | Uses `validatePassword` for admin password sets |
| `server/routes/upload.js` | MIME/extension whitelist, fileFilter, size limit, filename sanitisation, mode whitelist, file cleanup |
| `src/layouts/Header.jsx` | Frontend password validation updated (8+ chars, mixed case + number) |
| `src/pages/UserManagement.jsx` | Password minLength updated to 8 |
| `src/pages/Wiki.jsx` | Password requirements text updated |
| `package.json` | New dependencies + lint/format scripts |

## Production Environment Variables Required
```
JWT_SECRET=<strong random string>
ADMIN_PASSWORD=<strong password meeting policy>
ALLOWED_ORIGINS=https://your-domain.com
NODE_ENV=production
```
