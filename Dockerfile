FROM node:24-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY app ./app
COPY framework ./framework
USER node
EXPOSE 3000
CMD ["node", "app/server.js"]
