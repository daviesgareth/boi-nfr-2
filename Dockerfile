FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --omit=dev
COPY server ./server
COPY public ./public
COPY Procfile ./
COPY --from=build /app/dist ./dist
RUN mkdir -p /data
ENV DATA_DIR=/data
EXPOSE 3001
CMD ["node", "server/index.js"]
