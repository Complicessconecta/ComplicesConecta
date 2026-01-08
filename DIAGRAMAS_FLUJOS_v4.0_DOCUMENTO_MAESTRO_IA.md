# DIAGRAMAS_FLUJOS_v4.0_DOCUMENTO_MAESTRO_IA.md

## 1. Propósito

Este documento constituye el **Documento Maestro IA** del proyecto. Su función es servir como
fuente de verdad operacional para agentes de IA y desarrolladores humanos.

NO redefine lógica.
NO elimina flujos existentes.
SOLO consolida, aclara y normativiza.

---

## 2. Base normativa

- La versión **v3.0** es la base fundacional obligatoria.
- La versión **v3.5.0** es una extensión acumulativa.
- Ambas deben ejecutarse como un sistema único e incremental.

---

## 3. Reglas ejecutables para IA

1. Nunca eliminar ni ignorar flujos existentes.
2. Todo nuevo flujo debe:
   - Declarar su punto de entrada.
   - Declarar su dependencia (si hereda de v3.0 o v3.5.0).
   - Declarar condición de salida y manejo de error.
3. Está prohibido redefinir decisiones ya existentes.
4. Toda excepción debe redirigir a un flujo de control válido.

---

## 4. Capa de validación automática (IA)

Antes de aceptar un nuevo flujo, la IA debe verificar:

- ❑ No contradice decisiones existentes.
- ❑ No introduce bucles infinitos no controlados.
- ❑ No elimina estados previos.
- ❑ Respeta secuencia lógica Inicio → Validación → Decisión → Acción → Resultado.
- ❑ Declara fallback de error.

Si alguna condición falla → **RECHAZAR FLUJO**.

---

## 5. Integración con diagramas consolidados

Este documento opera directamente sobre:

- `DIAGRAMAS_FLUJOS_CONSOLIDADO.md`

Cualquier ejecución indicará explícitamente:

> “Este agente opera bajo las reglas del Documento Maestro IA v4.0”.

---

## 6. Kit de onboarding

El onboarding mínimo para IA o desarrolladores incluye:

1. README.md
2. project-structure-tree.md
3. COMPLICESCONECTA_PRESENTACION_PUBLICA.md
4. DIAGRAMAS_FLUJOS_CONSOLIDADO.md
5. **Este documento (v4.0)**

---

## 7. Principio rector

> Todo cambio es acumulativo.  
> Toda lógica es determinista.  
> Toda ambigüedad se considera error.

---

## 8. Extensión acumulativa: Billetera, NFTs y Galería Privada

Esta versión **no redefine** flujos. Solo declara como obligatorios (por referencia) los flujos ya definidos en `DIAGRAMAS_FLUJOS_CONSOLIDADO.md`:

- **Billetera / Tokens (`/tokens`)**: punto de entrada “Billetera” desde perfil/app.
- **Creación de NFT (`/nfts`)**: punto de entrada “Crear NFT” / “Mintear NFT”.
- **Galería Privada (Paywall CMPX)**: dentro de Chat Realtime, bifurcación “Galería Privada” → “Pago CMPX / Unlock” → retiro de blur.

Regla v4.0: cualquier implementación/UI debe exponer los puntos de entrada anteriores de forma consistente con los diagramas consolidados.
