# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app

# Pastikan OpenSSL ada saat generate
RUN apk add --no-cache openssl

# 1) Install deps (devDeps diperlukan untuk tsc & prisma)
# Bawa lockfile kalau ada biar deterministic
COPY package.json package-lock.json* ./
# cache npm agar build berikutnya cepat
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# 2) Prisma + TS
COPY tsconfig.json ./tsconfig.json
COPY prisma ./prisma

# Generate di dalam container Alpine supaya engine = linux-musl
RUN npx prisma generate

# 3) Source & build
COPY src ./src
RUN npm run build

# 4) Bersihkan devDeps agar kecil saat runtime
# Hati-hati: @prisma/client harus tetap ada di dependencies
RUN npm prune --omit=dev


# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Prisma engine butuh OpenSSL di runtime juga
RUN apk add --no-cache openssl

# Prisma CLI diperlukan untuk migrate deploy saat start.
# Versi sebaiknya disamakan dengan @prisma/client kamu.
# Kalau kamu tidak tahu versinya, jalankan `npm ls @prisma/client` di lokal dan samakan di sini.
RUN npm i -g prisma@5

# hanya bawa hasil bersih dari stage build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./

# Sesuaikan port aplikasi kamu (sebelumnya compose kamu expose 4000)
EXPOSE 4000

# Check versi OpenSSL => migrate deploy => start server
CMD ["sh", "-c", "node -p process.versions.openssl && prisma migrate deploy && node dist/server.js"]
