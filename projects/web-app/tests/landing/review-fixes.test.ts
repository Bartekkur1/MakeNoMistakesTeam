import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HeroActions } from "@/app/_landing/Hero";

describe("landing review fixes", () => {
  it("shows a white focus ring on the hero links over the dark blue background", () => {
    const html = renderToStaticMarkup(HeroActions());
    const links = html.match(/<a [^>]*>/g) ?? [];

    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toContain("focus-visible:outline-white");
    }
  });
});
