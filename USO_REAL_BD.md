# AUDITORÍA DE USO REAL DE BASE DE DATOS - ComplicesConecta v3.6.3

**Fecha**: 13 de Diciembre, 2025
**Estado**: Análisis Completado

## 📊 RESUMEN EJECUTIVO

- **Tablas Vivas Identificadas**: 28 tablas
- **Funciones RPC Vivas Identificadas**: 7 funciones
- **Archivos Analizados**: 116+ archivos en src/ y supabase/functions/

## ✅ TABLAS VIVAS (En Uso Real)

### Core - Autenticación y Perfiles
1. **profiles** - Perfil de usuario (28 referencias)
2. **couple_profiles** - Perfiles de parejas (11 referencias)

### Tokens y Economía
3. **user_token_balances** - Balance de tokens (22 referencias)
4. **token_transactions** - Historial de transacciones (16 referencias)
5. **token_analytics** - Analytics de tokens (8 referencias)
6. **staking_records** - Registros de staking (9 referencias)
7. **referral_rewards** - Recompensas de referidos (3 referencias)

### Matching y Relaciones
8. **matches** - Matches entre usuarios (7 referencias)
9. **invitations** - Invitaciones entre usuarios (10 referencias)

### Moderación y Reportes
10. **reports** - Reportes de usuarios (16 referencias)
11. **moderators** - Tabla de moderadores (6 referencias)
12. **moderator_sessions** - Sesiones de moderación (5 referencias)
13. **moderator_payments** - Pagos a moderadores (5 referencias)

### Disputas y Acuerdos
14. **couple_disputes** - Disputas de parejas (9 referencias)
15. **couple_agreements** - Acuerdos de parejas (2 referencias)

### Inversiones y Pagos
16. **investments** - Inversiones de usuarios (9 referencias)
17. **investment_tiers** - Tiers de inversión (2 referencias)

### Shop y Compras
18. **cmpx_shop_packages** - Paquetes de CMPX (3 referencias)
19. **cmpx_purchases** - Compras de CMPX (3 referencias)

### Wallets y Blockchain
20. **user_wallets** - Wallets de usuarios (2 referencias)

### Chat y Mensajes
21. **chat_messages** - Mensajes de chat (7 referencias)
22. **chat_rooms** - Salas de chat (3 referencias)

### Contenido y Publicaciones
23. **posts** - Publicaciones (10 referencias)
24. **stories** - Stories (7 referencias)

### Eventos y Clubes
25. **virtual_events** - Eventos virtuales (6 referencias)
26. **clubs** - Clubes (2 referencias)

### Seguridad y Auditoría
27. **security_audit_logs** - Logs de auditoría (9 referencias)
28. **user_identifiers** - Identificadores únicos (2 referencias - comentado)

## 🔧 FUNCIONES RPC VIVAS (En Uso Real)

1. **process_referral_reward** - Procesar recompensa de referido
2. **generate_referral_code** - Generar código de referido único
3. **claim_world_id_reward** - Reclamar recompensa de World ID
4. **create_assets_snapshot** - Crear snapshot de activos de pareja
5. **get_expired_disputes** - Obtener disputas expiradas
6. **get_dispute_time_remaining** - Obtener tiempo restante en disputa
7. **search_unified** - Búsqueda unificada

## ⚠️ TABLAS POTENCIALMENTE FANTASMA

- audit_logs
- notifications
- user_preferences
- banned_users
- verification_requests
- transactions (genérica, se usa token_transactions)
- images
- user_tokens (se usa user_token_balances)

## 🎯 PRÓXIMOS PASOS

1. Verificar SQL Maestro: Comparar tablas en BD vs tablas vivas
2. Identificar Tablas Sobrantes: Marcar como _deprecated_ si no se usan
3. Limpiar Migraciones: Eliminar migraciones que crean tablas no usadas
4. Actualizar Documentación: Mantener este reporte actualizado

---
Generado por: Protocolo de Auditoría de BD - ComplicesConecta v3.6.3
