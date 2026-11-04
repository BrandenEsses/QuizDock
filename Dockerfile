FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY server.js game-content.js ./
COPY public ./public
COPY downloads ./downloads
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["node","server.js"]
