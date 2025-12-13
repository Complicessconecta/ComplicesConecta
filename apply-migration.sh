#!/bin/bash

# Script para aplicar migracion de banner_config a Supabase local
# Uso: bash apply-migration.sh

echo "Iniciando aplicacion de migracion banner_config..."
echo ""

# Solicitar token de Supabase
read -p "Ingresa tu token de Supabase (opcional, presiona Enter para omitir): " SUPABASE_TOKEN

if [ -n "$SUPABASE_TOKEN" ]; then
    export SUPABASE_ACCESS_TOKEN="$SUPABASE_TOKEN"
    echo "Token configurado exitosamente"
else
    echo "Continuando sin token (modo local)"
fi

echo ""

# Esperar a que Supabase este listo
echo "Esperando a que Supabase este listo..."
max_attempts=30
attempt=0
ready=false

while [ $attempt -lt $max_attempts ] && [ "$ready" = false ]; do
    if supabase status 2>&1 | grep -q "not ready"; then
        attempt=$((attempt + 1))
        echo "Intento $attempt/$max_attempts - Esperando..."
        sleep 2
    else
        ready=true
        echo "Supabase esta listo"
    fi
done

if [ "$ready" = false ]; then
    echo "Error: Supabase no esta listo despues de esperar"
    echo "Intenta:"
    echo "  1. Verifica que Docker Desktop este corriendo"
    echo "  2. Ejecuta: supabase start"
    echo "  3. Espera 30-60 segundos"
    exit 1
fi

# Aplicar migracion
echo "Aplicando migracion..."
supabase migration up

if [ $? -eq 0 ]; then
    echo "Migracion aplicada exitosamente"
else
    echo "Error al aplicar migracion"
    exit 1
fi

# Regenerar tipos TypeScript
echo "Regenerando tipos TypeScript..."
supabase gen types typescript --local > src/integrations/supabase/types.ts

if [ $? -eq 0 ]; then
    echo "Tipos TypeScript regenerados"
else
    echo "Error al regenerar tipos"
    exit 1
fi

echo "Migracion completada exitosamente!"
echo ""
echo "Proximos pasos:"
echo "1. Verifica que no hay errores de TypeScript en BannerManagementService.ts"
echo "2. Integra AdminBannerPanel en tu admin dashboard"
echo "3. Prueba el sistema de gestion de banners"
