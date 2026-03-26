# Healthcare Backend (NestJS)

This folder contains the Phase 2.1 backend foundation for migration from Next.js API routes.

## Included in Phase 2.1
- NestJS app bootstrap
- Config module with environment validation
- Basic logger wiring
- Health endpoint

## Commands
- Install: npm install
- Run dev: npm run start:dev
- Build: npm run build
- Run prod: npm run start:prod

## Health Check
- URL: http://localhost:3333/api/health

## Validation Probe
- URL: http://localhost:3333/api/health/validate
- Method: POST
- Purpose: verifies global ValidationPipe and DTO validation are active
