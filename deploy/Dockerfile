FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY apps ./apps
COPY packages ./packages
RUN npm run build -- --webpack && npm prune --omit=dev

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends fonts-dejavu-core ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PLANTCARE_MODE=production PLANTCARE_DEPLOYMENT_TARGET=backend PLANTCARE_DATA_DIR=/data PLANTCARE_PDF_FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf
COPY --from=build --chown=node:node /app /app
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3000
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD ["node","-e","fetch('http://127.0.0.1:3000/api/v1/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["node","node_modules/next/dist/bin/next","start","apps/web","--hostname","0.0.0.0","--port","3000"]
