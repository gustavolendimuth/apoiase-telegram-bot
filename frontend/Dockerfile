FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package.json da raiz e dos workspaces
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/

# Instalar dependências usando workspaces
RUN npm install

# Copiar código fonte
COPY frontend ./frontend
COPY shared ./shared

# Build da aplicação
WORKDIR /app/frontend
RUN npm run build

# Imagem de produção
FROM node:18-alpine

WORKDIR /app

# Copiar package.json da raiz e dos workspaces
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/

# Instalar apenas dependências de produção
RUN npm install --omit=dev

# Copiar build do estágio anterior
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/next.config.js ./frontend/
COPY --from=builder /app/shared ./shared

# Expor porta
EXPOSE 3000

# Comando para iniciar a aplicação
WORKDIR /app/frontend
CMD ["npm", "start"]
