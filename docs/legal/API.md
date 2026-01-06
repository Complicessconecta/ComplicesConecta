# 🚀 ComplicesConecta - API Documentation v2.0.0

## 📋 Endpoints Principales

### 🔐 Autenticación

#### POST `/auth/signup`

Registro de nuevo usuario

```typescript
// Request
{
  email: string;
  password: string;
  user_type: 'single' | 'couple';
  first_name: string;
  last_name?: string;
  age: number;
}

// Response
{
  user: User;
  session: Session;
}
```

#### POST `/auth/signin`

Inicio de sesión

```typescript
// Request
{
  email: string;
  password: string;
}

// Response
{
  user: User;
  session: Session;
}
```

#### POST `/auth/signout`

Cerrar sesión

```typescript
// Response
{
  success: boolean;
}
```

### 👤 Perfiles

#### GET `/profiles`

Obtener perfiles públicos

```typescript
// Query Parameters
{
  limit?: number;
  offset?: number;
  user_type?: 'single' | 'couple';
  age_min?: number;
  age_max?: number;
}

// Response
{
  profiles: Profile[];
  total: number;
}
```

#### GET `/profiles/:id`

Obtener perfil específico

```typescript
// Response
{
  profile: Profile;
  images: Image[];
}
```

#### PUT `/profiles/:id`

Actualizar perfil

```typescript
// Request
{
  first_name?: string;
  last_name?: string;
  bio?: string;
  age?: number;
  interests?: string[];
  location?: string;
}

// Response
{
  profile: Profile;
}
```

### 🖼️ Imágenes

#### POST `/images/upload`

Subir imagen

```typescript
// Request (FormData)
{
  file: File;
  profile_id: string;
  is_public: boolean;
  description?: string;
}

// Response
{
  image: Image;
  url: string;
}
```

#### GET `/images/:profile_id`

Obtener imágenes de perfil

```typescript
// Query Parameters
{
  is_public?: boolean;
}

// Response
{
  images: Image[];
}
```

#### DELETE `/images/:id`

Eliminar imagen

```typescript
// Response
{
  success: boolean;
}
```

### 💬 Chat

#### GET `/chat/rooms`

Obtener salas de chat

```typescript
// Response
{
  rooms: ChatRoom[];
}
```

#### POST `/chat/rooms`

Crear sala privada

```typescript
// Request
{
  name: string;
  member_ids: string[];
}

// Response
{
  room: ChatRoom;
}
```

#### GET `/chat/rooms/:id/messages`

Obtener mensajes de sala

```typescript
// Query Parameters
{
  limit?: number;
  offset?: number;
}

// Response
{
  messages: Message[];
  total: number;
}
```

#### POST `/chat/rooms/:id/messages`

Enviar mensaje

```typescript
// Request
{
  content: string;
  message_type: "text" | "image" | "file";
}

// Response
{
  message: Message;
}
```

### 🔗 Solicitudes

#### GET `/invitations`

Obtener invitaciones

```typescript
// Query Parameters
{
  type?: 'sent' | 'received';
  status?: 'pending' | 'accepted' | 'declined';
}

// Response
{
  invitations: Invitation[];
}
```

#### POST `/invitations`

Enviar invitación

```typescript
// Request
{
  recipient_id: string;
  invitation_type: 'profile' | 'gallery' | 'chat';
  message?: string;
}

// Response
{
  invitation: Invitation;
}
```

#### PUT `/invitations/:id`

Responder invitación

```typescript
// Request
{
  status: 'accepted' | 'declined';
  response_message?: string;
}

// Response
{
  invitation: Invitation;
}
```

### 🛡️ Verificación

#### POST `/functions/v1/hcaptcha-verify`

Verificar hCaptcha (Edge Function)

```typescript
// Request
{
  token: string;
  remoteip?: string;
}

// Response
{
  success: boolean;
  timestamp?: string;
  hostname?: string;
  score?: number;
  errors?: string[];
}
```

#### POST `/functions/v1/worldid-verify`

Verificar World ID (Edge Function)

```typescript
// Request
{
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  signal: string;
}

// Response
{
  success: boolean;
  verification_level: string;
  tokens_awarded: number;
}
```

## 📊 Tipos de Datos

### User

```typescript
interface User {
  id: string;
  email: string;
  user_type: "single" | "couple";
  created_at: string;
  updated_at: string;
}
```

### Profile

```typescript
interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name?: string;
  bio?: string;
  age: number;
  user_type: "single" | "couple";
  interests: string[];
  location?: string;
  is_verified: boolean;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}
```

### Image

```typescript
interface Image {
  id: string;
  profile_id: string;
  url: string;
  is_public: boolean;
  description?: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}
```

### ChatRoom

```typescript
interface ChatRoom {
  id: string;
  name: string;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

### Message

```typescript
interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: "text" | "image" | "file";
  created_at: string;
}
```

### Invitation

```typescript
interface Invitation {
  id: string;
  sender_id: string;
  recipient_id: string;
  invitation_type: "profile" | "gallery" | "chat";
  status: "pending" | "accepted" | "declined";
  message?: string;
  response_message?: string;
  created_at: string;
  updated_at: string;
}
```

## 🔒 Autenticación

Todas las rutas protegidas requieren un token JWT válido en el header:

```
Authorization: Bearer <jwt_token>
```

## 🚨 Códigos de Error

| Código | Descripción                                |
| ------ | ------------------------------------------ |
| 400    | Bad Request - Datos inválidos              |
| 401    | Unauthorized - Token inválido o expirado   |
| 403    | Forbidden - Sin permisos                   |
| 404    | Not Found - Recurso no encontrado          |
| 409    | Conflict - Recurso ya existe               |
| 422    | Unprocessable Entity - Validación fallida  |
| 500    | Internal Server Error - Error del servidor |

## 📡 Real-time

### WebSocket Channels

#### `chat:room:{room_id}`

Suscripción a mensajes de sala

```typescript
// Eventos recibidos
{
  event: "INSERT" | "UPDATE" | "DELETE";
  payload: Message;
}
```

#### `invitations:user:{user_id}`

Suscripción a invitaciones

```typescript
// Eventos recibidos
{
  event: "INSERT" | "UPDATE";
  payload: Invitation;
}
```

## 🔧 Variables de Entorno

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# hCaptcha
VITE_HCAPTCHA_SITE_KEY=your-site-key
HCAPTCHA_SECRET=your-secret-key

# World ID
VITE_WORLD_ID_APP_ID=your-app-id
WORLD_ID_API_KEY=your-api-key
```

## 📝 Notas de Implementación

- Todas las fechas están en formato ISO 8601 UTC
- Los archivos de imagen tienen límite de 10MB
- Las salas de chat públicas son accesibles por todos los usuarios verificados
- Las políticas RLS están activas en todas las tablas críticas
- Los tokens JWT expiran en 24 horas
- Rate limiting: 100 requests/minuto por IP
