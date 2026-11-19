import { describe, expect, it, vi } from "vitest";

vi.mock("@vercel/analytics", () => ({ inject: vi.fn(), pageview: vi.fn(), track: vi.fn() }));
const { readSource } = await import("./analytics");

describe("readSource", () => {
  it("reads a simple channel name", () => {
    expect(readSource("?ref=linkedin")).toBe("linkedin");
    expect(readSource("?ref=Show-HN")).toBe("show-hn");
  });
  it("ignores missing or unsafe values", () => {
    expect(readSource("")).toBeNull();
    expect(readSource("?ref=")).toBeNull();
    expect(readSource("?ref=a%20b")).toBeNull();
    expect(readSource("?ref=" + "x".repeat(31))).toBeNull();
    expect(readSource("?ref=<script>")).toBeNull();
  });
});
