import { describe, it, expect } from "vitest";
import {
  formatInterestedInLabel,
  formatGenderLabel,
  deriveOrientationLabel,
} from "@/lib/profileLabels";

describe("profileLabels (ronda 9, stream B)", () => {
  describe("formatInterestedInLabel", () => {
    it("localiza 'men' como 'Hombres' (valor guardado del demo single)", () => {
      expect(formatInterestedInLabel("men")).toBe("Hombres");
    });

    it("localiza 'women' como 'Mujeres'", () => {
      expect(formatInterestedInLabel("women")).toBe("Mujeres");
    });

    it("localiza 'male'/'female' igual que 'men'/'women'", () => {
      expect(formatInterestedInLabel("male")).toBe("Hombres");
      expect(formatInterestedInLabel("female")).toBe("Mujeres");
    });

    it("localiza 'both' como 'Ambos' y 'men, women' (lista unida) también", () => {
      expect(formatInterestedInLabel("both")).toBe("Ambos");
      expect(formatInterestedInLabel("men, women")).toBe("Ambos");
    });

    it("localiza 'couple' como 'Parejas' y 'all' como 'Todos'", () => {
      expect(formatInterestedInLabel("couple")).toBe("Parejas");
      expect(formatInterestedInLabel("all")).toBe("Todos");
    });

    it("nunca devuelve el valor crudo en inglés", () => {
      expect(formatInterestedInLabel("non-binary")).toBe("No binario");
      expect(formatInterestedInLabel("klingon")).toBe("No especificado");
      expect(formatInterestedInLabel(null)).toBe("No especificado");
      expect(formatInterestedInLabel("")).toBe("No especificado");
    });
  });

  describe("formatGenderLabel", () => {
    it("localiza 'male'/'female'/'couple'", () => {
      expect(formatGenderLabel("male")).toBe("Hombre");
      expect(formatGenderLabel("female")).toBe("Mujer");
      expect(formatGenderLabel("couple")).toBe("Pareja");
    });

    it("no devuelve el valor crudo cuando es desconocido", () => {
      expect(formatGenderLabel("unknown")).toBe("No especificado");
      expect(formatGenderLabel(null)).toBe("No especificado");
    });
  });

  describe("deriveOrientationLabel", () => {
    it("deriva Heterosexual para mujer interesada en 'men'", () => {
      expect(deriveOrientationLabel("female", "men")).toBe("Heterosexual");
    });

    it("deriva Homosexual para mujer interesada en 'women'", () => {
      expect(deriveOrientationLabel("female", "women")).toBe("Homosexual");
    });

    it("deriva Bisexual para 'both' y para 'men, women'", () => {
      expect(deriveOrientationLabel("female", "both")).toBe("Bisexual");
      expect(deriveOrientationLabel("male", "men, women")).toBe("Bisexual");
    });

    it("devuelve null sin interested_in", () => {
      expect(deriveOrientationLabel("female", null)).toBeNull();
    });
  });
});
