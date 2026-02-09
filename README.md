# BLEVE Hot Water Effects Calculator

Client-side React/Vite app to estimate BLEVE effects for hot water and export results to Excel.

## Local Development

Prerequisites:
- Node.js 22+

Run:
1. `npm install`
2. Optional: create `.env.local` (see `.env.example`)
3. `npm run dev`

Quality checks:
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Environment Variables

- `VITE_THERMO_PROVIDER=mock|api`
  - `mock` (default): built-in simplified steam table.
  - `api`: use the Thermo API backend (IAPWS-97 saturation properties).
- `VITE_THERMO_API_BASE_URL=/api`
  - Recommended in production when Nginx proxies `/api` to `thermo-api`.
  - For local no-proxy mode, you can still use `http://localhost:8000`.

## Thermo API (Precise Backend)

Backend location:
- `backend/thermo_api`

Local run (without Docker):
1. `python -m venv .venv`
2. `.\\.venv\\Scripts\\activate`
3. `pip install -r backend/thermo_api/requirements.txt`
4. `uvicorn backend.thermo_api.app.main:app --host 0.0.0.0 --port 8000`

Available endpoints:
- `GET /healthz`
- `GET /thermo/properties?pressurePa=<absolute_pressure_in_pa>`

## Docker (local or VPS)

Build and run:
1. `docker compose up --build -d`
2. Open app: `http://localhost:8080`
3. Optional direct API check: `http://localhost:8000/healthz`

Stop:
- `docker compose down`

## Notes

- `mock` mode remains useful for offline/local quick checks.
- `docker-compose.yml` builds the frontend directly in `api` mode and points it to `http://thermo-api:8000`.

## GitHub -> VPS Deployment

This repository includes CI/CD workflow:
- `.github/workflows/deploy-vps.yml`

What it does on push to `main`:
1. Builds and pushes 2 images to GHCR:
   - `ghcr.io/<owner>/<repo>-app:<sha>`
   - `ghcr.io/<owner>/<repo>-thermo-api:<sha>`
2. Copies `docker-compose.prod.yml` to your VPS.
3. SSH deploys with `docker compose pull && docker compose up -d`.

Required GitHub Secrets:
- `VPS_HOST`: VPS public IP or DNS
- `VPS_USER`: SSH user
- `VPS_SSH_KEY`: private key (PEM/OpenSSH) matching VPS authorized key
- `VPS_APP_DIR`: deploy folder on VPS (example: `/opt/bleve-app`)
- `GHCR_USERNAME`: GitHub username that can pull GHCR packages
- `GHCR_TOKEN`: GitHub token (classic with `read:packages`) or PAT with package read access

First-time VPS setup (manual):
1. Install Docker Engine + Docker Compose plugin.
2. Ensure SSH user can run `docker` commands.
3. Open firewall ports you need (typically `8080`, optional `8000`).

## Dockploy Deployment

If your VPS is managed by Dockploy, prefer Dockploy native Git deployment.

Use this compose file in Dockploy:
- `docker-compose.dockploy.yml`

Recommended Dockploy setup:
1. Create a new Compose application from your GitHub repository.
2. Branch: `main`
3. Compose path: `docker-compose.dockploy.yml`
4. Enable auto-deploy on push (webhook/GitHub integration).
5. Expose port `8080` (or attach your reverse proxy/domain in Dockploy).

Notes:
- In Dockploy mode, you do not need `.github/workflows/deploy-vps.yml` (SSH deploy workflow).
- You can keep the workflow for non-Dockploy servers, or disable it if Dockploy is your only deployment path.
