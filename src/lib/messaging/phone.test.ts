import { describe, expect, test } from "vitest";
import { normalizeZimPhone } from "./phone";

describe("normalizeZimPhone", () => {
  test("national 0-trunk format", () => {
    expect(normalizeZimPhone("0772123456")).toBe("+263772123456");
    expect(normalizeZimPhone("0712 345 678")).toBe("+263712345678");
  });
  test("already in +263 / 263 form", () => {
    expect(normalizeZimPhone("+263772123456")).toBe("+263772123456");
    expect(normalizeZimPhone("263772123456")).toBe("+263772123456");
    expect(normalizeZimPhone("00263772123456")).toBe("+263772123456");
  });
  test("bare 9-digit subscriber", () => {
    expect(normalizeZimPhone("772123456")).toBe("+263772123456");
  });
  test("strips formatting characters", () => {
    expect(normalizeZimPhone("(077) 212-3456")).toBe("+263772123456");
  });
  test("rejects non-mobile / malformed", () => {
    expect(normalizeZimPhone("")).toBeNull();
    expect(normalizeZimPhone(null)).toBeNull();
    expect(normalizeZimPhone("12345")).toBeNull();
    expect(normalizeZimPhone("0242123456")).toBeNull(); // Harare landline (starts 2)
    expect(normalizeZimPhone("077212345")).toBeNull(); // too short
    expect(normalizeZimPhone("notaphone")).toBeNull();
  });
});
