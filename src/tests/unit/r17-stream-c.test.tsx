/**
 * Ronda 17, stream C: las 2 alertas CodeQL altas del PR #76 (check
 * run 139878905619, regla `js/clear-text-storage-of-sensitive-information`).
 *
 * (1) `src/lib/profile-interests.ts:196` — el `setItem` de
 * `saveCoupleDemoInterests` guardaba la selección en
 * `profile_interests:<id>` en claro. La selección llega desde el
 * `formData` del editor, construido a partir del `demo_user` parseado,
 * y ese objeto trae `gender` (Profile.gender): el rastreo de CodeQL
 * es a nivel de objeto, así que un valor derivado de un objeto que
 * contiene un campo sensible cuenta como contaminado aunque el array
 * de intereses jamás contenga el género. El fix es
 * `sanitizeInterestsForStorage` (`profile-interests.ts`): lo guardado
 * se construye filtrando el vocabulario constante — la entrada solo
 * decide pertenencia, nunca aporta caracteres — así que por
 * construcción la clave solo puede contener títulos de interés
 * conocidos. Estos tests pinean ese dominio: qué sobrevive, qué se
 * descarta, el orden resultante y que ningún rastro de `gender`
 * llega al valor guardado.
 *
 * (2) `src/tests/unit/r15-stream-a.test.tsx:165` — el test de semilla
 * expirada envejecía la fila a mano con un `setItem` directo sobre
 * `friend_requests_demo`. El test ya no escribe ahí: acepta por
 * `respondFriendRequest` y viaja 25 h con relojes falsos (ver ese
 * archivo). Aquí queda el pin en fuente para que el sumidero no
 * vuelva.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  demoInterestsKey,
  readSingleDemoInterests,
  readCoupleDemoInterests,
  saveSingleDemoInterests,
  saveCoupleDemoInterests,
} from "@/lib/profile-interests";

const SOFIA_ID = "sofia-r17-stream-c";
const COUPLE_ID = "pareja-r17-stream-c";

beforeEach(() => {
  window.localStorage.clear();
});

describe("(1) El sanitizador solo persiste títulos del vocabulario conocido", () => {
  it("single: mezcla dentro/fuera de vocabulario — solo sobreviven los conocidos", () => {
    saveSingleDemoInterests(SOFIA_ID, [
      "Viajes",
      "Lifestyle Swinger",
      "Cine",
      "Eventos VIP",
    ]);
    // Orden de vocabulario (SAFE antes que títulos demo), no de entrada.
    expect(readSingleDemoInterests(SOFIA_ID)).toEqual([
      "Lifestyle Swinger",
      "Eventos VIP",
    ]);
    expect(window.localStorage.getItem(demoInterestsKey(SOFIA_ID))).toBe(
      JSON.stringify(["Lifestyle Swinger", "Eventos VIP"]),
    );
  });

  it("single: todo fuera de vocabulario borra la clave (igual que [])", () => {
    saveSingleDemoInterests(SOFIA_ID, ["Lifestyle Swinger"]);
    saveSingleDemoInterests(SOFIA_ID, ["Viajes", "Cine", "Deportes"]);
    expect(readSingleDemoInterests(SOFIA_ID)).toBeNull();
    expect(window.localStorage.getItem(demoInterestsKey(SOFIA_ID))).toBeNull();
  });

  it("single: el orden guardado es el de vocabulario, no el de selección", () => {
    saveSingleDemoInterests(SOFIA_ID, [
      "Viajes en Pareja",
      "Lifestyle Swinger",
      "Eventos Lifestyle",
    ]);
    expect(readSingleDemoInterests(SOFIA_ID)).toEqual([
      "Lifestyle Swinger",
      "Eventos Lifestyle",
      "Viajes en Pareja",
    ]);
  });

  it("single: un título repetido en el vocabulario (SAFE y EXPLICIT) se guarda una sola vez", () => {
    // "Experiencias Sensuales" está en SAFE_INTERESTS y en
    // EXPLICIT_INTERESTS; sin dedup del vocabulario se guardaría dos veces.
    saveSingleDemoInterests(SOFIA_ID, ["Experiencias Sensuales"]);
    expect(readSingleDemoInterests(SOFIA_ID)).toEqual([
      "Experiencias Sensuales",
    ]);
    saveSingleDemoInterests(SOFIA_ID, [
      "Lifestyle Swinger",
      "Lifestyle Swinger",
    ]);
    expect(readSingleDemoInterests(SOFIA_ID)).toEqual(["Lifestyle Swinger"]);
  });

  it("pareja: por campo — el campo fuera de vocabulario se descarta sin tocar los demás", () => {
    saveCoupleDemoInterests(COUPLE_ID, {
      couple: ["Eventos VIP"],
      his: ["Deportes"],
      her: ["Cine"],
    });
    expect(readCoupleDemoInterests(COUPLE_ID)).toEqual({
      couple: ["Eventos VIP"],
      his: null,
      her: null,
    });
  });

  it("pareja: los títulos demo pre-cargados sí son vocabulario y se guardan", () => {
    saveCoupleDemoInterests(COUPLE_ID, {
      couple: ["Privacidad Total", "Chat Encriptado"],
      his: ["Lifestyle Exclusivo"],
      her: ["Match Inteligente"],
    });
    expect(readCoupleDemoInterests(COUPLE_ID)).toEqual({
      couple: ["Privacidad Total", "Chat Encriptado"],
      his: ["Lifestyle Exclusivo"],
      her: ["Match Inteligente"],
    });
  });
});

describe("(1) Ningún campo del perfil (gender) llega a la clave durable", () => {
  it("single: la selección que sale de un demo_user con gender guarda solo títulos", () => {
    // El flujo que CodeQL marcaba: el editor construye la selección
    // desde el `demo_user` parseado, que trae `gender`.
    const demoUser = {
      id: SOFIA_ID,
      email: "single@outlook.es",
      gender: "female",
      interests: ["Viajes en Pareja", "Lifestyle Swinger"],
    };
    saveSingleDemoInterests(demoUser.id, demoUser.interests);
    const raw = window.localStorage.getItem(demoInterestsKey(SOFIA_ID));
    expect(raw).toBe(
      JSON.stringify(["Lifestyle Swinger", "Viajes en Pareja"]),
    );
    expect(raw).not.toContain("gender");
    expect(raw).not.toContain("female");
    expect(raw).not.toContain("male");
  });

  it("pareja: his/her derivados de demo_user con gender guardan solo títulos", () => {
    const demoUser = {
      id: COUPLE_ID,
      email: "pareja@outlook.es",
      gender: "female",
      partner1: { interests: ["Lifestyle Swinger", "Eventos VIP"] },
      partner2: { interests: ["Cenas Temáticas"] },
    };
    saveCoupleDemoInterests(demoUser.id, {
      couple: ["Eventos Lifestyle"],
      his: demoUser.partner1.interests,
      her: demoUser.partner2.interests,
    });
    const raw = window.localStorage.getItem(demoInterestsKey(COUPLE_ID));
    expect(raw).toBe(
      JSON.stringify({
        couple: ["Eventos Lifestyle"],
        his: ["Lifestyle Swinger", "Eventos VIP"],
        her: ["Cenas Temáticas"],
      }),
    );
    expect(raw).not.toContain("gender");
    expect(raw).not.toContain("female");
    expect(raw).not.toContain("male");
  });
});

describe("(1) La lectura sigue siendo permisiva con valores de versiones anteriores", () => {
  it("un valor guardado antes del sanitizador (p. ej. 'Viajes') se sigue leyendo", () => {
    window.localStorage.setItem(
      demoInterestsKey(SOFIA_ID),
      JSON.stringify(["Viajes", "Cine"]),
    );
    expect(readSingleDemoInterests(SOFIA_ID)).toEqual(["Viajes", "Cine"]);
  });
});

describe("Pines en fuente: los dos sumideros de las alertas", () => {
  const read = (rel: string) =>
    readFileSync(join(process.cwd(), rel), "utf8");

  it("profile-interests: los dos save persisten solo lo sanitizado", () => {
    const src = read("src/lib/profile-interests.ts");
    expect(src).toContain(
      "const saved = sanitizeInterestsForStorage(interests ?? null);",
    );
    expect(src).toContain(
      "const couple = sanitizeInterestsForStorage(interests.couple ?? null);",
    );
    expect(src).toContain(
      "const his = sanitizeInterestsForStorage(interests.his ?? null);",
    );
    expect(src).toContain(
      "const her = sanitizeInterestsForStorage(interests.her ?? null);",
    );
    // El valor guardado se construye filtrando el vocabulario constante.
    expect(src).toContain(
      "const clean = KNOWN_INTEREST_TITLES.filter((title) => wanted.has(title));",
    );
  });

  it("r15-stream-a: ningún setItem directo sobre friend_requests_demo", () => {
    const test = read("src/tests/unit/r15-stream-a.test.tsx");
    expect(test).not.toContain('setItem("friend_requests_demo"');
    expect(test).not.toContain("setItem('friend_requests_demo'");
    // El escenario de expiración sigue existiendo, por el camino real.
    expect(test).toContain("respondFriendRequest");
    expect(test).toContain("useFakeTimers");
  });
});
