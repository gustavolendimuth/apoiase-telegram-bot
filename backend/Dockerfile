FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package.json da raiz e dos workspaces
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/

# Instalar dependências usando workspaces
RUN npm install

# Copiar código fonte
COPY backend ./backend
COPY shared ./shared

# Build da aplicação
WORKDIR /app/backend
RUN npm run build

# Imagem de produção
FROM node:18-alpine

WORKDIR /app

# Copiar package.json da raiz e dos workspaces
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY backend/tsconfig.json ./backend/
COPY shared/package*.json ./shared/

# Instalar apenas dependências de produção
RUN npm install --omit=dev

# Copiar build do estágio anterior
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/shared ./shared

# Criar diretório de logs
RUN mkdir -p backend/logs

# Expor porta
EXPOSE 3001

# Comando para iniciar a aplicação
WORKDIR /app/backend
CMD ["npm", "start"]
