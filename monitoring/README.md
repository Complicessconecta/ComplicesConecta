# 📊 Supabase Monitoring Setup - ComplicesConecta v3.9.2

## 🎯 Overview

Configuración completa del Vendor-agnostic Metrics API de Supabase para monitoreo de producción. Incluye Prometheus, Grafana, Alertmanager y reglas de alertas preconfiguradas.

**Proyecto**: ComplicesConecta  
**Project Ref**: `axtvqnozatbmllvwzuim`  
**Región**: us-east-2

---

## 🏗️ Arquitectura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Supabase      │────▶│   Prometheus    │────▶│    Grafana      │
│   Metrics API   │     │   (Collector)   │     │ (Visualization)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  Alertmanager   │
                       │  (Alerting)     │
                       └─────────────────┘
```

---

## 🚀 Requisitos Previos

- Docker Desktop instalado y corriendo
- Docker Compose v2.x
- Service Role Key de Supabase (obtener de Project Settings → API)

---

## 📦 Instalación

### 1. Clonar o navegar al proyecto

```bash
cd c:\Users\conej\Documents\conecta-social-comunidad-main\monitoring
```

### 2. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env y agregar credenciales
notepad .env
```

**Variables requeridas**:
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your-secure-password
```

**Obtener Service Role Key**:
1. Ir a https://app.supabase.com/project/axtvqnozatbmllvwzuim/settings/api
2. Copiar la clave `service_role` (secret)
3. Pegar en `.env`

### 3. Iniciar el stack de monitoreo

```bash
docker-compose up -d
```

**Servicios iniciados**:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
- Alertmanager: http://localhost:9093
- Node Exporter: http://localhost:9100

---

## 📊 Dashboards de Grafana

### Acceder a Grafana

1. Abrir http://localhost:3000
2. Login con:
   - Usuario: `admin` (o el configurado en `.env`)
   - Password: `admin` (o el configurado en `.env`)

### Importar Dashboard de Supabase

1. Ir a Dashboards → Import
2. Usar ID: `14574` (Supabase Official Dashboard)
3. O importar desde archivo JSON en `grafana/dashboards/`

### Dashboards Disponibles

- **Supabase Database Overview**: Métricas generales de la base de datos
- **Supabase Performance**: Rendimiento de queries y cache
- **Supabase Replication**: Estado de replicación (si aplica)
- **Supabase Alerts**: Estado de alertas activas

---

## 🚨 Alertas Configuradas

### Nivel Warning (⚠️)

- CPU > 80% por 5 minutos
- Memory > 80% por 5 minutos
- Connections > 80% por 5 minutos
- Storage > 80% por 10 minutos
- WAL size > 10GB por 10 minutos
- Replication lag > 30s por 5 minutos
- Slow queries > 1s promedio por 10 minutos
- Cache hit ratio < 90% por 15 minutos

### Nivel Critical (🔴)

- CPU > 95% por 2 minutos
- Connections > 95% por 2 minutos
- Replication lag > 5 minutos por 2 minutos
- Very slow queries > 5s promedio por 5 minutos
- Metrics scrape failed por 2 minutos

---

## 🔧 Configuración Avanzada

### Modificar Intervalos de Scrape

Editar `prometheus/prometheus.yml`:
```yaml
scrape_configs:
  - job_name: 'supabase-complicesconecta'
    scrape_interval: 30s  # Cambiar de 60s a 30s
```

### Agregar Proyectos Adicionales

Agregar nuevo scrape job en `prometheus/prometheus.yml`:
```yaml
- job_name: 'supabase-project2'
  scrape_interval: 60s
  metrics_path: '/customer/v1/privileged/metrics'
  scheme: https
  basic_auth:
    username: 'service_role'
    password: '${SUPABASE_PROJECT2_SERVICE_ROLE_KEY}'
  static_configs:
    - targets:
        - 'project2-ref.supabase.co:443'
      labels:
        project: 'project2'
```

### Configurar Notificaciones de Alertas

Editar `alertmanager/alertmanager.yml`:
```yaml
receivers:
  - name: 'slack-notifications'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#alerts'
        title: 'Supabase Alert: {{ .GroupLabels.alertname }}'
```

---

## 📈 Métricas Disponibles

### Database Metrics

- `supabase_cpu_usage_percent` - Uso de CPU
- `supabase_memory_usage_percent` - Uso de memoria
- `supabase_database_connections_used` - Conexiones activas
- `supabase_database_connections_max` - Conexiones máximas
- `supabase_storage_usage_percent` - Uso de almacenamiento
- `supabase_wal_size_bytes` - Tamaño de WAL

### Performance Metrics

- `supabase_query_duration_seconds_sum` - Duración total de queries
- `supabase_query_duration_seconds_count` - Conteo de queries
- `supabase_cache_hit_ratio` - Ratio de cache hits
- `supabase_replication_lag_seconds` - Lag de replicación

### API Metrics

- `supabase_api_errors_total` - Errores de API
- `up` - Estado del scrape (1 = éxito, 0 = fallo)

---

## 🔐 Seguridad

### Mejores Prácticas

1. **Rotar Service Role Key**:
   - Cada 90 días
   - Project Settings → API → service_role → Rotate

2. **Usar Secret Manager**:
   - AWS Secrets Manager
   - GCP Secret Manager
   - HashiCorp Vault

3. **Limitar Acceso**:
   - Firewall rules para IPs específicas
   - VPN para acceso remoto

4. **Auditoría**:
   - Logs de acceso a Grafana
   - Logs de cambios de configuración

---

## 🧪 Verificación

### Verificar Scrape de Métricas

1. Abrir Prometheus: http://localhost:9090
2. Ir a Targets
3. Verificar que `supabase-complicesconecta` esté UP

### Verificar Alertas

1. Abrir Prometheus: http://localhost:9090
2. Ir a Alerts
3. Verificar que las reglas estén cargadas

### Verificar Dashboards

1. Abrir Grafana: http://localhost:3000
2. Navegar a Dashboards
3. Verificar que los datos se estén mostrando

---

## 🛠️ Comandos Útiles

### Iniciar stack
```bash
docker-compose up -d
```

### Ver logs
```bash
# Todos los servicios
docker-compose logs -f

# Prometheus específico
docker-compose logs -f prometheus

# Grafana específico
docker-compose logs -f grafana
```

### Detener stack
```bash
docker-compose down
```

### Reiniciar servicio específico
```bash
docker-compose restart prometheus
```

### Actualizar configuración
```bash
# Recargar Prometheus sin reiniciar
curl -X POST http://localhost:9090/-/reload
```

---

## 📚 Documentación Adicional

- [Supabase Metrics API](https://supabase.com/docs/guides/platform/metrics-api)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)

---

## 🆘 Troubleshooting

### Error: "Cannot scrape metrics"

**Causa**: Service Role Key incorrecta o expirada  
**Solución**: 
1. Verificar clave en `.env`
2. Obtener nueva clave de Supabase
3. Reiniciar Prometheus: `docker-compose restart prometheus`

### Error: "No data in Grafana"

**Causa**: Datasource no configurado correctamente  
**Solución**:
1. Ir a Configuration → Data Sources
2. Verificar URL de Prometheus: `http://prometheus:9090`
3. Probar conexión

### Error: "Alerts not firing"

**Causa**: Reglas de alertas no cargadas  
**Solución**:
1. Verificar archivos en `prometheus/alerts/`
2. Reiniciar Prometheus: `docker-compose restart prometheus`
3. Verificar logs de Prometheus

---

## 📞 Soporte

Para problemas con Supabase:
- [Supabase Support](https://supabase.com/support)

Para problemas con Prometheus/Grafana:
- [Prometheus Community](https://prometheus.io/community/)
- [Grafana Community](https://community.grafana.com/)

---

**Estado**: ✅ Configuración completa - Listo para despliegue  
**Versión**: v3.9.2  
**Fecha**: 17 de Enero, 2026
