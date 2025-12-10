# 🚀 Deploy AupusService - Quick Start

## ✅ Arquivos Criados no Diretório Correto

```
AupusService/AupusService/
├── .env                    # Seu arquivo original ✅
├── .env.development        # DEV: localhost:3000 ✅
├── .env.production         # PROD: API pública ✅
├── .env.example           # Template ✅
├── DEPLOY-VPS.md          # Guia completo VPS ✅
└── README-DEPLOY.md       # Este arquivo ✅
```

---

## 🎯 Como Funciona

### Desenvolvimento (Local)
```bash
npm run dev
```
→ Usa `.env.development` → API: `http://localhost:3000/api/v1`

### Build para Produção
```bash
npm run build
```
→ Usa `.env.production` → API: `https://aupus-service-api.aupusenergia.com.br/api/v1`

---

## 🆚 VPS vs Vercel - Qual Escolher?

### ✅ Use VPS se:
- Você quer **controle total**
- Já tem uma VPS disponível
- Prefere **custos fixos** previsíveis
- Quer hospedar tudo no mesmo lugar (backend + frontend)

### ✅ Use Vercel se:
- Você quer **zero configuração**
- Deploy automático com Git push
- **CDN global** para performance
- Plano gratuito é suficiente

---

## 🚀 Deploy Rápido - VPS

### 1. Build Local
```bash
cd C:\Users\Public\aupus-service\AupusService\AupusService
npm install
npm run build
```

### 2. Upload para VPS
```bash
# Via SCP (substitua SEU_IP_VPS)
scp -r dist/* root@SEU_IP_VPS:/var/www/aupus-service
```

### 3. Configurar Nginx
Veja o guia completo: **[DEPLOY-VPS.md](./DEPLOY-VPS.md)**

---

## 🚀 Deploy Rápido - Vercel

### 1. Configurar Variáveis na Vercel

Acesse: https://vercel.com/dashboard → Seu Projeto → **Settings** → **Environment Variables**

Adicione para **Production**:

```env
VITE_API_URL=https://aupus-service-api.aupusenergia.com.br/api/v1
VITE_APP_NAME=AupusService
VITE_WEB_VITALS=true
VITE_STANDALONE=false
VITE_DEFAULT_DOMAIN=https://aupus-service.vercel.app
VITE_S3_URL=https://aupusdev.s3.amazonaws.com

# PUSHER (copie do .env local)
VITE_PUSHER_APP_ID=1687561
VITE_PUSHER_APP_KEY=96911d5008cfeabb4016
VITE_PUSHER_APP_SECRET=be5cb67410530e8b5ca3
VITE_PUSHER_HOST=be5cb67410530e8b5ca3
VITE_PUSHER_PORT=be5cb67410530e8b5ca3
VITE_PUSHER_SCHEME=be5cb67410530e8b5ca3
VITE_PUSHER_APP_CLUSTER=us2
```

### 2. Redeploy

**Deployments** → **Redeploy** no último deploy

---

## ✅ Verificação

Após deploy:
1. Acesse sua URL (VPS ou Vercel)
2. Abra DevTools (F12) → Network
3. Faça login
4. Verifique se as requests vão para: `https://aupus-service-api.aupusenergia.com.br` ✅

---

## 📚 Documentação Completa

- **VPS**: [DEPLOY-VPS.md](./DEPLOY-VPS.md) - Nginx, Docker, CI/CD
- **Vercel**: Configuração de variáveis de ambiente

---

## 💡 Dica

Se você já tem a VPS rodando o backend, **recomendo usar a VPS** para o frontend também:
- Tudo no mesmo lugar
- Sem limites de build (Vercel tem limites no free tier)
- Controle total sobre configurações
- Pode usar Docker para facilitar

Se preferir simplicidade e não se importa com Vercel, use Vercel mesmo! 😊
