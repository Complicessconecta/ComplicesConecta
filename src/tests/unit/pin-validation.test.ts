import { describe, it, expect } from "vitest";
import { isWeakPin } from "@/components/settings/PinSettings";

describe("isWeakPin", () => {
  it("rechaza dígitos repetidos", () => {
    expect(isWeakPin("0000")).toBe(true);
    expect(isWeakPin("1111")).toBe(true);
    expect(isWeakPin("9999")).toBe(true);
  });

  it("rechaza secuencias consecutivas ascendentes y descendentes", () => {
    expect(isWeakPin("1234")).toBe(true);
    expect(isWeakPin("0123")).toBe(true);
    expect(isWeakPin("5678")).toBe(true);
    expect(isWeakPin("4321")).toBe(true);
    expect(isWeakPin("9876")).toBe(true);
  });

  it("acepta PINs no consecutivos", () => {
    expect(isWeakPin("1357")).toBe(false);
    expect(isWeakPin("2580")).toBe(false);
    expect(isWeakPin("4826")).toBe(false);
    expect(isWeakPin("9021")).toBe(false);
  });
});
