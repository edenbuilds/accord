FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY . .
ENV PORT=8787
EXPOSE 8787
USER node
CMD ["node", "server.mjs"]
