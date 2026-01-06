# 🚀 Inicio Rápido: Configurar Túnel

## ⚠️ IMPORTANTE: Obtener Authtoken de ngrok

**El authtoken de ngrok es DIFERENTE a otros tokens (como xAI, OpenAI, etc.)**

### Paso 1: Obtener Authtoken

1. **Ir a:** https://dashboard.ngrok.com/get-started/your-authtoken
2. **Iniciar sesión o crear cuenta** (gratis, toma 30 segundos)
3. **Copiar tu authtoken** (se ve como: `2abc123def456ghi789jkl012mno345pqr678stu901vwx234yz_5ABCD6EFGH7IJKL8MNOP`)

### Paso 2: Configurar Authtoken

**Opción A: Comando directo**

```powershell
ngrok config add-authtoken TU_AUTHTOKEN_AQUI
```

**Opción B: Script automático**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/configure-ngrok.ps1 -AuthToken TU_AUTHTOKEN_AQUI
```

### Paso 3: Verificar Configuración

```powershell
powershell -ExecutionPolicy Bypass -File scripts/test-tunnel.ps1
```

### Paso 4: Iniciar Túnel

**Opción A: Solo túnel (en terminal separada)**

```powershell
npm run tunnel:ngrok
```

**Opción B: Dev + túnel simultáneamente**

```powershell
npm run dev:tunnel
```

## 🎯 Alternativas (Sin Authtoken)

Si no quieres configurar ngrok, puedes usar:

### Cloudflare Tunnel (Gratis, Sin Límites)

```powershell
# Instalar
winget install --id Cloudflare.cloudflared

# Iniciar túnel
npm run tunnel:cloudflare
```

### localtunnel (Simple)

```powershell
# Instalar
npm install -g localtunnel

# Iniciar túnel
npm run tunnel:lt
```

## 🆘 Troubleshooting

### Error: "authentication failed"

- Asegúrate de haber configurado el authtoken correctamente
- Verifica que el authtoken sea de ngrok, no de otro servicio
- Ejecuta: `ngrok config check`

### Error: "port already in use"

- Verifica que el puerto 8080 no esté en uso
- Ejecuta: `netstat -ano | findstr :8080`

### Error: "ngrok: command not found"

- Instala ngrok: `npm install -g ngrok`
- O descarga desde: https://ngrok.com/download

## 📖 Documentación Completa

Ver `TUNNEL_SETUP.md` para más detalles.
