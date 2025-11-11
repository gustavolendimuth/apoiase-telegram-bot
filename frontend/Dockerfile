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

# Build do shared primeiro (necessário para imports do frontend)
WORKDIR /app
RUN npm run build --workspace=shared

# Build da aplicação frontend
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
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/package.json

# Expor porta
EXPOSE 3000

# Comando para iniciar a aplicação
WORKDIR /app/frontend
CMD ["npm", "start"]
