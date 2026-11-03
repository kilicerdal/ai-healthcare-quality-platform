FROM node:24-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY app ./app
COPY docker ./docker
COPY framework ./framework
USER node
EXPOSE 3000
CMD ["sh", "-c", "node app/migrate.js && node app/server.js"]
