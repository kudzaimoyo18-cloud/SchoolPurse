import { describe, expect, test } from "vitest";
import { neutralizeFormula, toCsv } from "./csv";

describe("neutralizeFormula", () => {
  test("prefixes formula-leading cells with a quote", () => {
    expect(neutralizeFormula("=1+1")).toBe("'=1+1");
    expect(neutralizeFormula("+1+1")).toBe("'+1+1");
    expect(neutralizeFormula("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(neutralizeFormula("=HYPERLINK(\"http://evil\")")).toBe(
      "'=HYPERLINK(\"http://evil\")",
    );
    expect(neutralizeFormula("-cmd|' /C calc'!A0")).toBe("'-cmd|' /C calc'!A0");
    expect(neutralizeFormula("\tTabbed")).toBe("'\tTabbed");
  });

  test("leaves genuine numbers (incl. negatives) untouched", () => {
    expect(neutralizeFormula("5")).toBe("5");
    expect(neutralizeFormula("-5.00")).toBe("-5.00");
    expect(neutralizeFormula("1234.56")).toBe("1234.56");
  });

  test("leaves ordinary text untouched", () => {
    expect(neutralizeFormula("Tariro Moyo")).toBe("Tariro Moyo");
    expect(neutralizeFormula("Grade 3")).toBe("Grade 3");
  });

  test("quotes phone-style leading +", () => {
    // Not a plain number, so it's neutralised — which is also correct behaviour
    // for spreadsheets (keeps the leading + instead of evaluating it).
    expect(neutralizeFormula("+263772000000")).toBe("'+263772000000");
  });
});

describe("toCsv", () => {
  test("neutralises an injected name and still CSV-quotes commas", () => {
    const csv = toCsv(
      [{ student: "=cmd('x'), y", balance_usd: "10.00" }],
      ["student", "balance_usd"],
    );
    const [, dataLine] = csv.trimEnd().split("\n");
    // Leading quote (formula neutralised) + wrapped in CSV quotes (comma inside)
    expect(dataLine).toBe(`"'=cmd('x'), y",10.00`);
  });

  test("emits header only for empty rows", () => {
    expect(toCsv([], ["a", "b"])).toBe("a,b\n");
  });
});
