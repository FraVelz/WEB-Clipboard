import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("merges class names and tailwind conflicts", () => {
    expect(cn("px-2", "px-4", "hidden")).toBe("px-4 hidden");
  });
});
