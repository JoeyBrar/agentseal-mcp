FROM node:22-slim
WORKDIR /app
COPY package.json index.js ./
RUN npm install --omit=dev
ENV AGENTSEAL_API_KEY=inspect
CMD ["node", "index.js"]
