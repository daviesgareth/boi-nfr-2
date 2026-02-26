# NFR V3 Hardening Log

Tracking progress through security, ops, and code quality improvements.

## Phase 1 — Security Hardening
- [ ] Install helmet, express-rate-limit
- [ ] Add helmet middleware with CSP, HSTS, X-Frame-Options etc
- [ ] Restrict CORS to production domain + localhost dev
- [ ] Add rate limiting on login (5 attempts/15 min) and general API (100/min)
- [ ] Require JWT_SECRET env var in production (fail-fast)
- [ ] Require ADMIN_PASSWORD env var in production (fail-fast)
- [ ] Strengthen password policy (8+ chars, mixed case + number)
- [ ] Add env validation module that runs at startup

## Phase 2 — Ops & Stability
- [ ] Add unauthenticated /health endpoint (DB ping)
- [ ] Add graceful shutdown (SIGTERM/SIGINT handlers)
- [ ] Add HTTPS enforcement middleware (X-Forwarded-Proto check)
- [ ] Add compression middleware (gzip responses)
- [ ] Add static asset cache headers

## Phase 3 — Upload Hardening
- [ ] Add server-side file type validation (MIME + extension whitelist)
- [ ] Add file size limit (100MB)
- [ ] Sanitise uploaded filenames
- [ ] Upgrade xlsx or add note about vulnerability

## Phase 4 — Error Handling & Logging
- [ ] Improve error handler (hide stack traces in production, add error IDs)
- [ ] Add request ID middleware for tracing
- [ ] Sanitise error messages sent to client

## Phase 5 — Code Quality
- [ ] Install eslint + prettier
- [ ] Add .eslintrc.json config
- [ ] Add .prettierrc config
- [ ] Add lint script to package.json
- [ ] Fix eslint-disable comments in useNFRData

## Phase 6 — Database & Input Validation
- [ ] Add input validation helpers
- [ ] Validate audit log category param against whitelist
- [ ] Add negative offset guard
- [ ] Add DB integrity check to health endpoint

---

## Progress Log

### Starting: Phase 1 — Security Hardening
