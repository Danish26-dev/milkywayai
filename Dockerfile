# syntax=docker/dockerfile:1

# =============================================================================
# MilkyWay — Production Dockerfile for Google Cloud Run
#
# Multi-stage build:
#   1) builder  — installs ALL deps and builds the Vite frontend + the bundled
#                 Express server (dist/server.cjs).
#   2) runtime  — slim Node image with PRODUCTION deps only + built artifacts.
#
# Auth: no API keys / no service-account JSON are baked in. The container uses
# Application Default Credentials (the attached Cloud Run runtime service account)
# for Vertex AI, Firebase Admin, BigQuery, and Secret Manager.
# =============================================================================

# ---- Stage 1: build ---------------------------------------------------------
FROM node:20-slim AS builder
WORKDIR /app

# Install dependencies with a clean, reproducible install.
COPY package.json package-lock.json ./
RUN npm ci

# Copy sources and build both the frontend (dist/) and the server bundle (dist/server.cjs).
COPY . .
RUN npm run build

# ---- Stage 2: runtime -------------------------------------------------------
FROM node:20-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
# Cloud Run overrides PORT at runtime; 8080 is the conventional default.
ENV PORT=8080

# Production dependencies only (the server bundle uses --packages=external).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Built artifacts + the public (non-secret) Firebase web config read at startup.
COPY --from=builder /app/dist ./dist
COPY firebase-applet-config.json ./firebase-applet-config.json

# Run as the non-root user provided by the base image.
USER node

EXPOSE 8080

# Start the production server (binds 0.0.0.0:$PORT, serves dist/ + API).
CMD ["node", "dist/server.cjs"]
