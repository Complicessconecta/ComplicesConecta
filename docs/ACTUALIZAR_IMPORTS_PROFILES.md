# Script de Actualización de Imports - PROFILES

## Archivos a actualizar (22 imports en 14 archivos)

### 1. src/components/profiles/couple/ProfileCouple.tsx (4 imports)
```
@/profiles/shared/PrivateImageRequest → @/components/profiles/shared/PrivateImageRequest
@/profiles/shared/ProfileNavTabs → @/components/profiles/shared/ProfileNavTabs
@/profiles/shared/ImageModal → @/components/profiles/shared/ImageModal
@/profiles/shared/ParentalControl → @/components/profiles/shared/ParentalControl
```

### 2. src/components/profiles/single/ProfileSingle.tsx (4 imports)
```
@/profiles/shared/ProfileNavTabs → @/components/profiles/shared/ProfileNavTabs
@/profiles/shared/PrivateImageRequest → @/components/profiles/shared/PrivateImageRequest
@/profiles/shared/ImageModal → @/components/profiles/shared/ImageModal
@/profiles/shared/ParentalControl → @/components/profiles/shared/ParentalControl
```

### 3. src/components/AppSidebar.tsx (2 imports)
```
@/profiles/shared/UserProfile → @/components/profiles/shared/UserProfile
@/profiles/shared/CollapsedUserProfile → @/components/profiles/shared/CollapsedUserProfile
```

### 4. src/pages/Discover.tsx (2 imports)
```
@/profiles/couple/CoupleProfileCard → @/components/profiles/couple/CoupleProfileCard
@/profiles/shared/AnimatedProfileCard → @/components/profiles/shared/AnimatedProfileCard
```

### 5. src/components/auth/ThemeInfoModal.tsx (1 import)
```
@/profiles/shared/ProfileCard → @/components/profiles/shared/ProfileCard
```

### 6. src/components/discover/index.ts (1 import)
```
@/profiles/shared/DiscoverProfileCard → @/components/profiles/shared/DiscoverProfileCard
```

### 7. src/components/profiles/couple/CoupleDashboard.tsx (1 import)
```
@/profiles/couple/AdvancedCoupleService → @/components/profiles/couple/AdvancedCoupleService
```

### 8. src/components/profiles/shared/ProfileReportsPanel.test.tsx (1 import)
```
@/profiles/shared/ProfileReportsPanel → @/components/profiles/shared/ProfileReportsPanel
```

### 9. src/components/profiles/shared/ProfileTabs.tsx (1 import)
```
@/profiles/shared/EnhancedGallery → @/components/profiles/shared/EnhancedGallery
```

### 10. src/components/profiles/shared/ProfileThemeDemo.tsx (1 import)
```
@/profiles/shared/ProfileThemeShowcase → @/components/profiles/shared/ProfileThemeShowcase
```

### 11. src/components/profiles/shared/ProfileThemeShowcase.tsx (1 import)
```
@/profiles/shared/ProfileCard → @/components/profiles/shared/ProfileCard
```

### 12. src/components/profiles/single/EditProfileSingle.test.tsx (1 import)
```
@/profiles/single/EditProfileSingle → @/components/profiles/single/EditProfileSingle
```

### 13. src/components/profiles/single/ProfileSingle.test.tsx (1 import)
```
@/profiles/single/ProfileSingle → @/components/profiles/single/ProfileSingle
```

### 14. src/services/SustainableEventsService.ts (1 import)
```
@/profiles/couple/AdvancedCoupleService → @/components/profiles/couple/AdvancedCoupleService
```

---

## Patrón General

```
@/profiles/shared/ → @/components/profiles/shared/
@/profiles/couple/ → @/components/profiles/couple/
@/profiles/single/ → @/components/profiles/single/
```

---

## Comando para reemplazar (PowerShell)

```powershell
# Reemplazar todos los imports
Get-ChildItem -Path "src" -Recurse -Include "*.tsx", "*.ts" | ForEach-Object {
    (Get-Content $_.FullName) -replace "@/profiles/shared/", "@/components/profiles/shared/" `
                              -replace "@/profiles/couple/", "@/components/profiles/couple/" `
                              -replace "@/profiles/single/", "@/components/profiles/single/" | Set-Content $_.FullName
}
```

---

## Status: ⏳ PENDIENTE EJECUCIÓN
