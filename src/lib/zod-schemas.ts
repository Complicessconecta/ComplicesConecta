import { z } from "zod";

// ===== ESQUEMAS DE VALIDACIÓN ZOD =====

export const LoginSchema = z.object({
  email: z
    .string()
    .email("Email inválido")
    .min(5, "Email muy corto")
    .max(100, "Email muy largo")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, "Contraseña mínimo 8 caracteres")
    .max(128, "Contraseña muy larga")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Contraseña debe incluir mayúscula, minúscula y número",
    ),
  rememberMe: z.boolean().optional(),
  hcaptchaToken: z.string().optional(),
});

export const RegisterSchema = z
  .object({
    email: z
      .string()
      .email("Email inválido")
      .min(5, "Email muy corto")
      .max(100, "Email muy largo")
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(8, "Contraseña mínimo 8 caracteres")
      .max(128, "Contraseña muy larga")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Contraseña debe incluir mayúscula, minúscula y número",
      ),
    confirmPassword: z.string(),
    name: z
      .string()
      .min(2, "Nombre muy corto")
      .max(50, "Nombre muy largo")
      .trim(),
    age: z
      .number()
      .int("Edad debe ser un número entero")
      .min(18, "Edad mínima 18 años")
      .max(99, "Edad máxima 99 años"),
    accountType: z.enum(["single", "couple"], {
      message: "Tipo de cuenta debe ser single o couple",
    }),
    gender: z.enum(["male", "female"], {
      message: "Género debe ser male o female",
    }),
    partnerGender: z.enum(["male", "female"]).optional(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "Debes aceptar los términos y condiciones",
    }),
    privacyAccepted: z.boolean().refine((val) => val === true, {
      message: "Debes aceptar la política de privacidad",
    }),
    hcaptchaToken: z.string().min(1, "Verificación hCaptcha requerida"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.accountType === "couple" && !data.partnerGender) {
        return false;
      }
      return true;
    },
    {
      message: "Género de pareja requerido para cuentas de pareja",
      path: ["partnerGender"],
    },
  );

export const ChatMessagePayloadSchema = z.object({
  content: z
    .string()
    .min(1, "Mensaje no puede estar vacío")
    .max(1000, "Mensaje muy largo (máximo 1000 caracteres)")
    .trim(),
  type: z.enum(["text", "image", "file", "emoji"], {
    message: "Tipo de mensaje inválido",
  }),
  timestamp: z.date().default(() => new Date()),
  senderId: z.string().uuid("ID de remitente inválido"),
  receiverId: z.string().uuid("ID de destinatario inválido"),
  chatId: z.string().uuid("ID de chat inválido"),
  metadata: z
    .object({
      fileName: z.string().optional(),
      fileSize: z.number().optional(),
      mimeType: z.string().optional(),
      imageUrl: z.string().url().optional(),
      thumbnailUrl: z.string().url().optional(),
    })
    .optional(),
});

export const ProfileValidationSchema = z.object({
  isDemoMode: z.boolean(),
  role: z.enum(["user", "admin", "demo"], {
    message: "Rol debe ser user, admin o demo",
  }),
  images: z
    .array(z.string().url("URL de imagen inválida"))
    .max(10, "Máximo 10 imágenes por perfil")
    .min(1, "Al menos una imagen es requerida"),
  interests: z
    .array(z.string().min(1).max(30))
    .max(15, "Máximo 15 intereses")
    .min(3, "Mínimo 3 intereses requeridos"),
  bio: z
    .string()
    .max(500, "Biografía muy larga (máximo 500 caracteres)")
    .min(10, "Biografía muy corta (mínimo 10 caracteres)")
    .trim(),
  location: z
    .string()
    .max(100, "Ubicación muy larga")
    .min(2, "Ubicación muy corta")
    .trim(),
  verified: z.boolean().default(false),
  isOnline: z.boolean().default(false),
  lastSeen: z.date().optional(),
  privacySettings: z
    .object({
      showAge: z.boolean().default(true),
      showLocation: z.boolean().default(true),
      showOnlineStatus: z.boolean().default(true),
      allowMessages: z.boolean().default(true),
      allowRequests: z.boolean().default(true),
    })
    .optional(),
});

export const InterestsSchema = z.object({
  lifestyle: z
    .array(
      z.enum([
        "Intercambio de parejas",
        "Soft swap",
        "Full swap",
        "Voyeurismo",
        "Exhibicionismo",
        "Threesome",
        "Moresome",
        "Unicornio",
        "Bull",
        "Hotwife",
        "Cuckold",
        "BDSM suave",
        "Dominación",
        "Sumisión",
        "Fetichismo",
        "Role play",
        "Tantrico",
        "Naturismo",
      ]),
    )
    .max(8, "Máximo 8 intereses lifestyle"),
  social: z
    .array(
      z.enum([
        "Fiestas privadías",
        "Clubs swingers",
        "Eventos temáticos",
        "Cenas íntimas",
        "Viajes en grupo",
        "Playas nudistas",
        "Resorts lifestyle",
        "Cruceros temáticos",
        "Spa parejas",
        "Workshops",
        "Conferencias",
        "Meet & greet",
      ]),
    )
    .max(6, "Máximo 6 intereses sociales"),
  general: z
    .array(
      z.enum([
        "Música",
        "Baile",
        "Cocina",
        "Vinos",
        "Cocteles",
        "Fitness",
        "Yoga",
        "Meditación",
        "Arte",
        "Fotografía",
        "Viajes",
        "Playa",
        "Montaña",
        "Deportes",
        "Lectura",
        "Cine",
        "Teatro",
        "Gastronomía",
      ]),
    )
    .max(10, "Máximo 10 intereses generales"),
});

export const EventSchema = z.object({
  title: z
    .string()
    .min(5, "Título muy corto")
    .max(100, "Título muy largo")
    .trim(),
  description: z
    .string()
    .min(20, "Descripción muy corta")
    .max(1000, "Descripción muy larga")
    .trim(),
  date: z.date().min(new Date(), "La fecha debe ser futura"),
  location: z
    .string()
    .min(5, "Ubicación muy corta")
    .max(200, "Ubicación muy larga")
    .trim(),
  maxAttendees: z
    .number()
    .int("Número de asistentes debe ser entero")
    .min(2, "Mínimo 2 asistentes")
    .max(100, "Máximo 100 asistentes"),
  ageRange: z
    .object({
      min: z.number().int().min(18, "Edad mínima 18 años"),
      max: z.number().int().max(99, "Edad máxima 99 años"),
    })
    .refine((data) => data.min <= data.max, {
      message: "Edad mínima debe ser menor o igual a la máxima",
    }),
  eventType: z.enum(["party", "dinner", "travel", "workshop", "meet", "other"]),
  isPrivate: z.boolean().default(false),
  requiresApproval: z.boolean().default(true),
  dresscode: z.string().max(100).optional(),
  price: z.number().min(0, "El precio no puede ser negativo").optional(),
  tags: z.array(z.string().max(20)).max(10, "Máximo 10 etiquetas"),
});

export const ConnectionRequestSchema = z.object({
  senderId: z.string().uuid("ID de remitente inválido"),
  receiverId: z.string().uuid("ID de destinatario inválido"),
  message: z
    .string()
    .min(10, "Mensaje muy corto (mínimo 10 caracteres)")
    .max(500, "Mensaje muy largo (máximo 500 caracteres)")
    .trim(),
  type: z.enum(["connection", "chat", "event_invite", "photo_request"]),
  metadata: z
    .object({
      eventId: z.string().uuid().optional(),
      photoType: z.enum(["public", "private"]).optional(),
      urgency: z.enum(["low", "medium", "high"]).default("medium"),
    })
    .optional(),
});

export const PrivacySettingsSchema = z.object({
  profileVisibility: z.enum(["public", "members_only", "connections_only"]),
  photoVisibility: z.object({
    public: z.boolean().default(true),
    private: z.boolean().default(false),
  }),
  contactSettings: z.object({
    allowMessages: z.boolean().default(true),
    allowRequests: z.boolean().default(true),
    allowEventInvites: z.boolean().default(true),
    autoAcceptConnections: z.boolean().default(false),
  }),
  searchSettings: z.object({
    appearInSearch: z.boolean().default(true),
    showDistance: z.boolean().default(true),
    showLastSeen: z.boolean().default(false),
  }),
  notificationSettings: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    sms: z.boolean().default(false),
    frequency: z.enum(["immediate", "daily", "weekly"]).default("immediate"),
  }),
});

export const TokenTransactionExtendedSchema = z.object({
  userId: z.string().uuid("ID de usuario inválido"),
  amount: z
    .number()
    .int("Cantidad debe ser un número entero")
    .min(1, "Cantidad mínima 1 token")
    .max(10000, "Cantidad máxima 10,000 tokens"),
  type: z.enum(["purchase", "spend", "earn", "refund", "bonus"]),
  description: z
    .string()
    .min(5, "Descripción muy corta")
    .max(200, "Descripción muy larga")
    .trim(),
  reference: z.string().optional(),
  metadata: z
    .object({
      paymentMethod: z.string().optional(),
      promotionCode: z.string().optional(),
      expiresAt: z.date().optional(),
    })
    .optional(),
});

// Esquema para ProfileCard con validación completa
export const ProfileCardSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().min(1, "Nombre es requerido").max(50, "Nombre muy largo"),
  age: z
    .number()
    .int()
    .min(18, "Edad mínima 18 años")
    .max(99, "Edad máxima 99 años")
    .optional(),
  location: z.string().max(100, "Ubicación muy larga").optional(),
  image: z.string().url("URL de imagen inválida").optional(),
  interests: z.array(z.string()).max(10, "Máximo 10 intereses").optional(),
  bio: z.string().max(500, "Biografía muy larga").optional(),
  isOnline: z.boolean().optional(),
  verified: z.boolean().optional(),
  accountType: z.literal("single").or(z.literal("couple")).optional(),
  // Campos específicos para perfiles de pareja
  partner_name: z.string().max(50, "Nombre de pareja muy largo").optional(),
  partner_age: z.number().int().min(18).max(99).optional(),
  partner_image: z.string().url().optional(),
  partner2_name: z.string().max(50).optional(),
  partner2_age: z.number().int().min(18).max(99).optional(),
  partner2_image: z.string().url().optional(),
});

export type ProfileCardProps = z.infer<typeof ProfileCardSchema>;

// Esquema para ThemeSelector con tipos estrictos
export const ThemeSelectorSchema = z.object({
  currentTheme: z
    .literal("elegant")
    .or(z.literal("modern"))
    .or(z.literal("vibrant")),
  onThemeChange: z.function(),
  disabled: z.boolean().optional(),
  showPreview: z.boolean().optional(),
  className: z.string().optional(),
});

export type ThemeSelectorProps = z.infer<typeof ThemeSelectorSchema>;

// Esquema para mensajes de chat
export const ChatMessageSchema = z.object({
  id: z.string().min(1, "ID de mensaje requerido"),
  content: z
    .string()
    .min(1, "Contenido no puede estar vacío")
    .max(1000, "Mensaje muy largo"),
  type: z.literal("user").or(z.literal("assistant")).or(z.literal("system")),
  timestamp: z.date().optional(),
  userId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Esquema para validación de email
export const EmailValidationSchema = z.object({
  email: z
    .string()
    .email("Formato de email inválido")
    .min(5, "Email muy corto")
    .max(100, "Email muy largo"),
  template: z
    .literal("welcome")
    .or(z.literal("confirmation"))
    .or(z.literal("reset-password"))
    .or(z.literal("invitation"))
    .optional(),
  variables: z.record(z.string(), z.string()).optional(),
});

export type EmailValidation = z.infer<typeof EmailValidationSchema>;

// Esquema para transacciones de tokens
export const TokenTransactionSchema = z.object({
  userId: z.string().uuid("ID de usuario inválido"),
  tokenType: z.literal("cmpx").or(z.literal("gtk")),
  amount: z
    .number()
    .int()
    .min(1, "Cantidad debe ser mayor a 0")
    .max(10000, "Cantidad muy alta"),
  transactionType: z
    .literal("referral_bonus")
    .or(z.literal("welcome_bonus"))
    .or(z.literal("world_id_bonus"))
    .or(z.literal("staking_reward"))
    .or(z.literal("premium_purchase"))
    .or(z.literal("beta_reward"))
    .or(z.literal("stake_tokens"))
    .or(z.literal("unstake_tokens"))
    .or(z.literal("manual_adjustment")),
  description: z.string().max(200, "Descripción muy larga").optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type TokenTransaction = z.infer<typeof TokenTransactionSchema>;

// Esquema para staking
export const StakingSchema = z.object({
  userId: z.string().uuid("ID de usuario inválido"),
  amount: z
    .number()
    .int()
    .min(10, "Cantidad mínima para staking: 10 tokens")
    .max(10000),
  duration: z
    .number()
    .int()
    .min(1, "Duración mínima: 1 día")
    .max(365, "Duración máxima: 365 días"),
  tokenType: z.literal("cmpx").or(z.literal("gtk")).default("cmpx"),
});

export type StakingRequest = z.infer<typeof StakingSchema>;

// Esquema para tabla staking_records
export const StakingRecordSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  token_type: z.literal("cmpx").or(z.literal("gtk")),
  amount: z.number().int().positive(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  apy: z.number().min(0).max(100),
  status: z
    .literal("active")
    .or(z.literal("completed"))
    .or(z.literal("cancelled")),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
});

export type StakingRecord = z.infer<typeof StakingRecordSchema>;

export type LoginFormData = z.infer<typeof LoginSchema>;
export type RegisterFormData = z.infer<typeof RegisterSchema>;
export type ChatMessagePayload = z.infer<typeof ChatMessagePayloadSchema>;
export type ProfileValidation = z.infer<typeof ProfileValidationSchema>;
export type InterestsData = z.infer<typeof InterestsSchema>;
export type EventData = z.infer<typeof EventSchema>;
export type ConnectionRequest = z.infer<typeof ConnectionRequestSchema>;
export type PrivacySettings = z.infer<typeof PrivacySettingsSchema>;
export type TokenTransactionExtended = z.infer<
  typeof TokenTransactionExtendedSchema
>;

// ===== FUNCIONES DE VALIDACIÓN =====

/**
 * Valida props de ProfileCard con manejo de errores
 */
export function validateProfileCard(props: unknown): ProfileCardProps {
  try {
    return ProfileCardSchema.parse(props);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
      throw new Error(`Validación ProfileCard falló: ${messages.join(", ")}`);
    }
    throw error;
  }
}

/**
 * Valida configuración de tema
 */
export function validateThemeSelector(props: unknown): ThemeSelectorProps {
  try {
    return ThemeSelectorSchema.parse(props);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
      throw new Error(`Validación ThemeSelector falló: ${messages.join(", ")}`);
    }
    throw error;
  }
}

/**
 * Valida email y template
 */
export function validateEmail(data: unknown): EmailValidation {
  try {
    return EmailValidationSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
      throw new Error(`Validación Email falló: ${messages.join(", ")}`);
    }
    throw error;
  }
}

/**
 * Valida transacción de tokens
 */
export function validateTokenTransaction(
  transaction: unknown,
): TokenTransaction {
  try {
    return TokenTransactionSchema.parse(transaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
      throw new Error(
        `Validación TokenTransaction falló: ${messages.join(", ")}`,
      );
    }
    throw error;
  }
}

/**
 * Valida solicitud de staking
 */
export function validateStaking(request: unknown): StakingRequest {
  try {
    return StakingSchema.parse(request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
      throw new Error(`Validación Staking falló: ${messages.join(", ")}`);
    }
    throw error;
  }
}

/**
 * Valida registro de staking
 */
export function validateStakingRecord(record: unknown): StakingRecord {
  try {
    return StakingRecordSchema.parse(record);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
      throw new Error(`Validación StakingRecord falló: ${messages.join(", ")}`);
    }
    throw error;
  }
}

/**
 * Valida de forma segura sin lanzar errores
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`,
  );
  return { success: false, errors };
}

