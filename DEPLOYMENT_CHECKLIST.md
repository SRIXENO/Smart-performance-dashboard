# Deployment Checklist

## Pre-Deploy
- [ ] `npm run build` passes at project root
- [ ] `server/.env` and frontend env values are validated
- [ ] No hardcoded secrets in repo
- [ ] Latest commit pushed to `main`

## Atlas
- [ ] Cluster available
- [ ] DB user valid
- [ ] Network allowlist configured
- [ ] `MONGODB_URI` tested

## Render (Backend)
- [ ] Root directory set to `PROJECT 1/server`
- [ ] Build/start commands are correct
- [ ] Required env vars configured
- [ ] `/api/health` returns success

## Vercel (Frontend)
- [ ] Root directory set to `PROJECT 1`
- [ ] `NEXT_PUBLIC_API_URL` configured
- [ ] Build succeeded

## Integration
- [ ] Backend `FRONTEND_URL` points to Vercel domain
- [ ] Backend redeployed after URL/env change
- [ ] No CORS errors

## Functional Smoke Test
- [ ] Login/logout
- [ ] Students page load + filters
- [ ] Faculty page load
- [ ] Approvals page works (admin)
- [ ] Student block/unblock works

## Post-Deploy
- [ ] Monitor backend logs for errors
- [ ] Confirm production URL in README

## Document Metadata
- Last Updated: February 25, 2026
- Status: Active
