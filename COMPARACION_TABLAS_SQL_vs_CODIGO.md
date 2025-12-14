# COMPARACIÓN: TABLAS EN SQL vs TABLAS VIVAS EN CÓDIGO

## 📊 ANÁLISIS COMPARATIVO

### Tablas en SQL Maestro (20251209_SCHEMA_MAESTRO_CONSOLIDADO.sql)

Total de tablas creadas: 58 tablas

1. profiles ✅ VIVA
2. couple_profiles ✅ VIVA
3. matches ✅ VIVA
4. reports ✅ VIVA
5. user_wallets ✅ VIVA
6. chat_rooms ✅ VIVA
7. messages ❌ FANTASMA (no encontrada en código como chat_messages)
8. notifications ❌ FANTASMA
9. invitations ✅ VIVA
10. invitation_templates ❌ FANTASMA
11. stories ✅ VIVA
12. story_comments ❌ FANTASMA
13. story_likes ❌ FANTASMA
14. story_shares ❌ FANTASMA
15. gallery_permissions ❌ FANTASMA
16. gallery_commissions ❌ FANTASMA
17. user_referral_balances ❌ FANTASMA (se usa user_token_balances)
18. referral_statistics ❌ FANTASMA
19. referral_transactions ❌ FANTASMA
20. referral_rewards ✅ VIVA
21. security_events ❌ FANTASMA
22. digital_fingerprints ❌ FANTASMA
23. permanent_bans ❌ FANTASMA
24. error_alerts ❌ FANTASMA
25. monitoring_sessions ❌ FANTASMA
26. performance_metrics ❌ FANTASMA
27. web_vitals_history ❌ FANTASMA
28. report_ai_classification ❌ FANTASMA
29. analytics_events ❌ FANTASMA
30. chat_summaries ❌ FANTASMA (se usa como chat_summaries en código)
31. user_interests ❌ FANTASMA
32. couple_events ❌ FANTASMA
33. moderator_sessions ✅ VIVA
34. blockchain_transactions ❌ FANTASMA
35. user_nfts ❌ FANTASMA
36. couple_nft_requests ❌ FANTASMA
37. nft_staking ❌ FANTASMA
38. token_staking ❌ FANTASMA
39. testnet_token_claims ❌ FANTASMA
40. daily_token_claims ❌ FANTASMA
41. couple_agreements ✅ VIVA
42. couple_disputes ✅ VIVA
43. frozen_assets ❌ FANTASMA
44. user_consents ❌ FANTASMA
45. worldid_verifications ❌ FANTASMA
46. user_token_balances ✅ VIVA
47. token_transactions ✅ VIVA
48. staking_records ✅ VIVA
49. app_logs ❌ FANTASMA

### Tablas Faltantes en SQL pero Usadas en Código

1. **investment_tiers** - Tiers de inversión (2 referencias)
2. **investments** - Inversiones de usuarios (9 referencias)
3. **cmpx_shop_packages** - Paquetes de CMPX (3 referencias)
4. **cmpx_purchases** - Compras de CMPX (3 referencias)
5. **token_analytics** - Analytics de tokens (8 referencias)
6. **moderator_payments** - Pagos a moderadores (5 referencias)
7. **moderators** - Tabla de moderadores (6 referencias)
8. **security_audit_logs** - Logs de auditoría (9 referencias)
9. **posts** - Publicaciones (10 referencias)
10. **virtual_events** - Eventos virtuales (6 referencias)
11. **clubs** - Clubes (2 referencias)

---

## ⚠️ TABLAS FANTASMA (Existen en SQL pero NO se usan en código)

**Total: 30 tablas no utilizadas**

### Críticas (Pueden ser eliminadas sin riesgo)
- notifications
- invitation_templates
- story_comments
- story_likes
- story_shares
- gallery_permissions
- gallery_commissions
- user_referral_balances
- referral_statistics
- referral_transactions
- security_events
- digital_fingerprints
- permanent_bans
- error_alerts
- monitoring_sessions
- performance_metrics
- web_vitals_history
- report_ai_classification
- analytics_events
- user_interests
- couple_events
- blockchain_transactions
- user_nfts
- couple_nft_requests
- nft_staking
- token_staking
- testnet_token_claims
- daily_token_claims
- frozen_assets
- user_consents
- worldid_verifications
- app_logs

### Potencialmente Útiles (Revisar antes de eliminar)
- chat_summaries (existe en código)
- messages (existe como chat_messages en código)

---

## 🔴 TABLAS CRÍTICAS FALTANTES EN SQL

Las siguientes tablas se usan en el código pero NO están en el SQL maestro:

1. **investment_tiers** - CRÍTICA (inversiones)
2. **investments** - CRÍTICA (inversiones)
3. **cmpx_shop_packages** - CRÍTICA (shop)
4. **cmpx_purchases** - CRÍTICA (shop)
5. **token_analytics** - IMPORTANTE (analytics)
6. **moderator_payments** - IMPORTANTE (pagos)
7. **moderators** - IMPORTANTE (moderación)
8. **security_audit_logs** - IMPORTANTE (auditoría)
9. **posts** - IMPORTANTE (contenido)
10. **virtual_events** - IMPORTANTE (eventos)
11. **clubs** - IMPORTANTE (clubes)

---

## 🎯 RECOMENDACIONES

### INMEDIATAS (Hacer ahora)
1. ✅ Agregar las 11 tablas faltantes al SQL maestro
2. ✅ Crear migraciones para estas tablas
3. ✅ Ejecutar migraciones en Supabase

### CORTO PLAZO (Esta semana)
1. Marcar las 30 tablas fantasma como _deprecated_
2. Crear script de limpieza para eliminar tablas no usadas
3. Actualizar documentación de BD

### LARGO PLAZO (Próximas semanas)
1. Eliminar tablas fantasma después de verificación
2. Consolidar migraciones (actualmente 35, podrían ser 5-10)
3. Crear índices adicionales para optimización

---

## 📋 ESTADO ACTUAL

- **Tablas Vivas**: 28
- **Tablas Fantasma**: 30
- **Tablas Faltantes**: 11
- **Total en SQL**: 58
- **Total en Código**: 39

**Inconsistencia**: 19 tablas de diferencia (30 fantasma - 11 faltante)

---

Generado por: Protocolo de Auditoría de BD - ComplicesConecta v3.6.3
Fecha: 13 de Diciembre, 2025
