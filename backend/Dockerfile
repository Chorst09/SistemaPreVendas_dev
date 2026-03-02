FROM node:20-alpine

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependências
RUN npm install --legacy-peer-deps

# Copiar código
COPY . .

# Copiar shared (se existir)
COPY ../shared ./src/shared 2>/dev/null || true

# Build
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
