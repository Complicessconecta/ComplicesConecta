# Flujo de Funcionalidad NFT - CómplicesConecta

## 1. Descripción General
El sistema de NFTs permite a los usuarios (singles y parejas) "mintear" (crear) tokens no fungibles que representan contenido exclusivo o identidad en la blockchain de Polygon.

## 2. Componente Principal
`NFTMintButton` (`src/components/blockchain/NFTMintButton.tsx`)

### Props
- `userId`: ID del usuario.
- `type`: 'single' | 'couple'.
- `nftName`: Nombre del activo.
- `nftDescription`: Descripción.
- `imageFile`: Archivo a mintear.
- `partnerEmail`: (Requerido para 'couple').

## 3. Lógica de Negocio
### Validaciones
- **Tamaño de archivo:** Máximo 5MB.
- **Formato:** JPG, PNG, WEBP.
- **Parejas:** Requiere email de la pareja para flujo de doble consentimiento.

### Modos de Operación
1. **Modo Demo:**
   - Simula la transacción sin costo.
   - Retorna un `tokenId` simulado.
   - No interactúa con la blockchain real.
   - Ideal para pruebas y desarrollo.

2. **Modo Producción:**
   - Interactúa con `WalletService` y `NFTService`.
   - **Single:** Minteo directo.
   - **Couple:** Crea una solicitud de firma pendiente. La pareja debe aprobar.

## 4. Flujo de Usuario
1. Usuario selecciona imagen en Galería.
2. Clic en "Mintear NFT".
3. Se valida el archivo.
4. Feedback visual (Loading/Spinner).
5. **Éxito:**
   - Single: Mensaje "NFT Minteado".
   - Couple: Mensaje "Solicitud enviada a pareja".
6. **Error:**
   - Mensaje descriptivo (e.g., "Archivo muy grande").

## 5. Pruebas
### Unitarias
Ubicación: `src/tests/components/NFTMintButton.test.tsx`
- Ejecutar: `npm run test`
- Cobertura: Renderizado, Validaciones, Simulación de éxito.

### Integración
El botón se integra en `ProfileNavTabs` (sección Galería) y `TokenDashboard`.

## 6. Seguridad
- Doble consentimiento para parejas (Ley Olimpia compliant).
- Metadatos en IPFS (opcional/futuro).
- Verificación de propiedad en backend.
