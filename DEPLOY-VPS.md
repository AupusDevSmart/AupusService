# 🚀 Deploy AupusService na VPS - Guia Completo

## 📋 Pré-requisitos

- ✅ VPS com Ubuntu 20.04+ (ou outra distro Linux)
- ✅ Node.js 18+ instalado
- ✅ Nginx instalado
- ✅ Domínio configurado (ex: app.aupusenergia.com.br)
- ✅ SSL/HTTPS configurado (Let's Encrypt)

---

## 🎯 Opção 1: Deploy Manual (Build Local + Upload)

### Passo 1: Build Local

```bash
# No seu PC Windows, entre na pasta do projeto
cd C:\Users\Public\aupus-service\AupusService\AupusService

# Instalar dependências (se ainda não fez)
npm install

# Build para produção (usa .env.production automaticamente)
npm run build

# Isso cria a pasta "dist" com os arquivos otimizados
```

### Passo 2: Upload para VPS

```bash
# Usando SCP (substitua os valores)
scp -r dist/* root@SEU_IP_VPS:/var/www/aupus-service

# OU usando SFTP/FileZilla/WinSCP
# Copie toda a pasta "dist" para "/var/www/aupus-service" na VPS
```

### Passo 3: Configurar Nginx na VPS

Conecte na VPS via SSH e crie o arquivo de configuração:

```bash
sudo nano /etc/nginx/sites-available/aupus-service
```

Cole a configuração:

```nginx
server {
    listen 80;
    server_name app.aupusenergia.com.br;

    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.aupusenergia.com.br;

    # SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/app.aupusenergia.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.aupusenergia.com.br/privkey.pem;

    # Pasta do build
    root /var/www/aupus-service;
    index index.html;

    # Configuração para SPA (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache de assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logs
    access_log /var/log/nginx/aupus-service-access.log;
    error_log /var/log/nginx/aupus-service-error.log;
}
```

### Passo 4: Ativar e Testar

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/aupus-service /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx

# Verificar status
sudo systemctl status nginx
```

---

## 🎯 Opção 2: Deploy Automatizado (CI/CD com GitHub Actions)

### Passo 1: Criar Script de Deploy na VPS

```bash
# Conectar na VPS
ssh root@SEU_IP_VPS

# Criar pasta do projeto
mkdir -p /var/www/aupus-service

# Criar script de deploy
nano /root/deploy-frontend.sh
```

Cole o script:

```bash
#!/bin/bash

echo "🚀 Iniciando deploy do AupusService..."

# Ir para a pasta
cd /var/www/aupus-service

# Limpar build anterior
rm -rf *

# Aqui você pode adicionar git pull se clonar o repo
# ou simplesmente esperar os arquivos serem enviados via SCP

echo "✅ Deploy concluído!"
```

Tornar executável:

```bash
chmod +x /root/deploy-frontend.sh
```

### Passo 2: Criar GitHub Action (opcional)

Crie `.github/workflows/deploy.yml` no seu repositório:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to VPS
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          source: "dist/*"
          target: "/var/www/aupus-service"
          strip_components: 1
```

Configure os secrets no GitHub: Settings → Secrets → Actions:
- `VPS_HOST`: IP da VPS
- `VPS_USER`: usuário (root)
- `VPS_SSH_KEY`: chave SSH privada

---

## 🎯 Opção 3: Docker (Mais Moderno)

### Criar Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar build
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Criar nginx.conf

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Build e Run

```bash
# Build da imagem
docker build -t aupus-service .

# Rodar container
docker run -d -p 3001:80 --name aupus-service aupus-service

# Com docker-compose
docker-compose up -d
```

---

## ✅ Verificação

Após o deploy:

1. Acesse: `https://app.aupusenergia.com.br`
2. Abra DevTools (F12) → Network
3. Faça login
4. Verifique se as requisições vão para: `https://aupus-service-api.aupusenergia.com.br`

---

## 🆚 Comparação: VPS vs Vercel

| Característica | VPS | Vercel |
|----------------|-----|--------|
| **Custo** | Fixo (R$ 30-100/mês) | Grátis (hobby) |
| **Controle** | ✅ Total | ⚠️ Limitado |
| **Deploy** | Manual ou CI/CD | Automático |
| **SSL** | Você configura | Automático |
| **Performance** | Depende da VPS | ⚡ CDN Global |
| **Manutenção** | Você gerencia | Zero |
| **Domínio Custom** | ✅ Sim | ✅ Sim |

### Recomendação:

- **Use VPS se:** Quer controle total, já tem VPS, custos fixos
- **Use Vercel se:** Quer simplicidade, deploy automático, CDN global

---

## 🐛 Troubleshooting

### Erro 404 nas rotas

→ Problema no `try_files` do Nginx. Verifique a configuração acima.

### Erro de permissão

```bash
sudo chown -R www-data:www-data /var/www/aupus-service
sudo chmod -R 755 /var/www/aupus-service
```

### Nginx não reinicia

```bash
# Ver logs
sudo tail -f /var/log/nginx/error.log

# Testar config
sudo nginx -t
```

### SSL não funciona

```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d app.aupusenergia.com.br

# Renovação automática
sudo certbot renew --dry-run
```

---

## 📝 Manutenção

### Atualizar frontend

```bash
# Local: Build novo
npm run build

# Upload para VPS
scp -r dist/* root@SEU_IP_VPS:/var/www/aupus-service

# VPS: Limpar cache do Nginx (opcional)
sudo rm -rf /var/cache/nginx/*
sudo systemctl reload nginx
```

---

## 🎉 Pronto!

Seu frontend está na VPS e acessando a API pública! 🚀
