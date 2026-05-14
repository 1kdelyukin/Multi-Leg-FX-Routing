import { describe, expect, it } from "vitest";

import { formatAmountInput, normalizeAmountInput } from "../lib/formatting";

describe("amount input formatting", () => {
  it("adds thousands separators while keeping clean numeric state", () => {
    const normalized = normalizeAmountInput("1234567");

    expect(normalized).toBe("1234567");
    expect(formatAmountInput(normalized)).toBe("1,234,567");
  });

  it("preserves decimals and trailing decimal points while typing", () => {
    expect(formatAmountInput(normalizeAmountInput("1234.50"))).toBe("1,234.50");
    expect(formatAmountInput(normalizeAmountInput("1234."))).toBe("1,234.");
  });

  it("removes pasted currency symbols and grouping characters", () => {
    expect(normalizeAmountInput("£ 1,234.50")).toBe("1234.50");
  });
});
