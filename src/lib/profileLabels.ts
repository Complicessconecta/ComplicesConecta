// Etiquetas localizadas para los valores de perfil guardados en inglés
// (`gender` / `interested_in`). Los valores crudos ("men", "women",
// "male", "female", "both", ...) nunca se muestran al usuario: toda
// píldora, badge o texto que los renderice pasa por estas funciones.
// Ronda 9 (stream B): la píldora de Sofía mostraba "men" porque el
// mapeo anterior solo conocía "male"/"female" y el valor guardado en
// demo es "men" (ver `useAuth`, perfil demo single).

const INTERESTED_IN_LABELS: Record<string, string> = {
  men: "Hombres",
  male: "Hombres",
  women: "Mujeres",
  female: "Mujeres",
  both: "Ambos",
  couple: "Parejas",
  couples: "Parejas",
  "non-binary": "No binario",
  nonbinary: "No binario",
  trans: "Personas trans",
  all: "Todos",
  everyone: "Todos",
};

const GENDER_LABELS: Record<string, string> = {
  male: "Hombre",
  female: "Mujer",
  couple: "Pareja",
  "non-binary": "No binario",
  nonbinary: "No binario",
};

// `useAuth` une `interested_in` (string[]) con ", " al cargar el perfil,
// así que el valor puede venir como lista ("men, women").
const splitEnumValues = (value?: string | null): string[] =>
  (value ?? "")
    .toLowerCase()
    .split(/[,\s;]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

/**
 * Etiqueta de "interesado en": "men" -> "Hombres", "women" -> "Mujeres",
 * "men, women" -> "Ambos". Un valor desconocido o vacío nunca se devuelve
 * crudo: cae a "No especificado".
 */
export const formatInterestedInLabel = (value?: string | null): string => {
  const labels = [
    ...new Set(
      splitEnumValues(value)
        .map((part) => INTERESTED_IN_LABELS[part])
        .filter((label): label is string => Boolean(label)),
    ),
  ];
  if (labels.length === 0) return "No especificado";
  if (
    labels.length === 2 &&
    labels.includes("Hombres") &&
    labels.includes("Mujeres")
  )
    return "Ambos";
  return labels.join(" y ");
};

/** Etiqueta de género: "male" -> "Hombre", "female" -> "Mujer". */
export const formatGenderLabel = (value?: string | null): string => {
  const key = (value ?? "").toLowerCase().trim();
  return GENDER_LABELS[key] ?? "No especificado";
};

/**
 * Orientación derivada (Heterosexual / Homosexual / Bisexual) desde
 * `gender` + `interested_in`. Acepta "men"/"women" además de
 * "male"/"female" (el mapeo anterior no los conocía y devolvía null).
 */
export const deriveOrientationLabel = (
  gender?: string | null,
  interestedIn?: string | null,
): string | null => {
  const parts = splitEnumValues(interestedIn);
  if (parts.length === 0) return null;
  if (
    parts.includes("both") ||
    parts.includes("all") ||
    parts.includes("everyone")
  )
    return "Bisexual";
  const wantsMale = parts.includes("male") || parts.includes("men");
  const wantsFemale = parts.includes("female") || parts.includes("women");
  if (wantsMale && wantsFemale) return "Bisexual";
  const target = wantsMale ? "male" : wantsFemale ? "female" : null;
  if (!target) return null;
  const g = (gender ?? "").toLowerCase();
  if (g === "male") return target === "female" ? "Heterosexual" : "Homosexual";
  if (g === "female") return target === "male" ? "Heterosexual" : "Homosexual";
  return null;
};
