# Docker - Modos de Desenvolvimento e Produção

Este projeto suporta dois modos de execução com Docker:

## 🔧 Modo Desenvolvimento (Recomendado para desenvolvimento local)

### Características:
- **Hot Reload**: Alterações no código são refletidas automaticamente
- **Volumes montados**: Código local sincronizado com container
- **Dev dependencies**: Todas as ferramentas de desenvolvimento disponíveis
- **Sem rebuild**: Não precisa reconstruir imagem a cada mudança

### Comandos:

```bash
# Iniciar em modo desenvolvimento
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Ver logs
docker-compose logs -f

# Parar containers
docker-compose down

# Rebuild (apenas quando mudar dependências no package.json)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml build
```

### Acesso:
- Frontend: http://localhost:3000 (Next.js com hot reload)
- Backend: http://localhost:3001 (Nodemon com hot reload)
- MongoDB: localhost:27017
- Redis: localhost:6379

---

## 🚀 Modo Produção (Para deploy)

### Características:
- **Build otimizado**: Código compilado e minificado
- **Sem dev dependencies**: Imagem menor
- **Melhor performance**: Código otimizado para produção
- **Requer rebuild**: Precisa reconstruir imagem após mudanças

### Comandos:

```bash
# Iniciar em modo produção
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar containers
docker-compose down

# Rebuild (necessário após qualquer mudança no código)
docker-compose build
docker-compose up -d
```

---

## 📝 Comparação

| Aspecto | Desenvolvimento | Produção |
|---------|----------------|----------|
| Hot Reload | ✅ Sim | ❌ Não |
| Rebuild necessário | ❌ Não | ✅ Sim |
| Tamanho da imagem | Maior | Menor |
| Performance | Normal | Otimizada |
| Dev tools | Disponíveis | Removidas |
| Use quando | Desenvolvendo | Deploy |

---

## 🔄 Migrando de Produção para Desenvolvimento

Se você estava rodando em modo produção:

```bash
# Parar containers atuais
docker-compose down

# Iniciar em modo desenvolvimento
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# Acompanhar logs
docker-compose logs -f
```

---

## 🐛 Troubleshooting

### Frontend não atualiza automaticamente
```bash
# Reiniciar apenas o frontend
docker-compose restart frontend
```

### Backend não detecta mudanças
```bash
# Verificar se nodemon está rodando
docker-compose logs backend | grep nodemon

# Reiniciar backend
docker-compose restart backend
```

### Erro de permissões nos volumes
```bash
# Em sistemas Linux, pode precisar ajustar permissões
sudo chown -R $USER:$USER ./frontend ./backend
```

### Limpar tudo e recomeçar
```bash
# Remove containers, volumes e imagens
docker-compose down -v
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```
