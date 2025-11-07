FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json .npmrc* ./
RUN npm install --production=false
COPY tsconfig.json tsconfig.json
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
COPY data ./data
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/data ./data
COPY package*.json ./
COPY start.sh ./start.sh
RUN chmod +x start.sh
EXPOSE 3001
CMD ["./start.sh"]
