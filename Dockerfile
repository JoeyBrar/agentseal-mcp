FROM node:22-slim
WORKDIR /app
COPY package.json index.js ./
RUN npm install --omit=dev
CMD ["node", "index.js"]
