import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { FeatureCards } from "./FeatureCards";

describe("FeatureCards", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders all four feature cards with titles and descriptions", () => {
    render(<FeatureCards onSelectMode={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "HTML to Image", level: 3 })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "LaTeX to Image", level: 3 })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Mermaid to Image", level: 3 })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Notes Mode", level: 3 })).toBeTruthy();

    expect(screen.getByText("Render your HTML code into a high-quality image.")).toBeTruthy();
    expect(screen.getByText("Convert LaTeX equations into crisp images.")).toBeTruthy();
    expect(screen.getByText("Turn Mermaid code into clear, professional diagrams.")).toBeTruthy();
    expect(screen.getByText("Convert JSON into beautiful, styled notes.")).toBeTruthy();
  });

  it("renders all four CTA buttons with correct text and accessible labels", () => {
    render(<FeatureCards onSelectMode={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Try HTML Renderer for HTML to Image" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try LaTeX Renderer for LaTeX to Image" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try Mermaid Renderer for Mermaid to Image" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try Notes Mode for Notes Mode" })).toBeTruthy();
  });

  it("renders SVG illustrations for each mode referencing card-svgs", () => {
    const { container } = render(<FeatureCards onSelectMode={vi.fn()} />);
    const images = container.querySelectorAll("img");

    expect(images).toHaveLength(4);
    expect(images[0].getAttribute("src")).toContain("card-svgs/htmltoimage-svg.svg");
    expect(images[1].getAttribute("src")).toContain("card-svgs/latextoimage-svg.svg");
    expect(images[2].getAttribute("src")).toContain("card-svgs/mermaidtoimage-svg.svg");
    expect(images[3].getAttribute("src")).toContain("card-svgs/jsontoimage-svg.svg");
  });

  it("triggers onSelectMode when clicking CTA buttons", () => {
    const onSelectMode = vi.fn();
    render(<FeatureCards onSelectMode={onSelectMode} />);

    fireEvent.click(screen.getByRole("button", { name: "Try HTML Renderer for HTML to Image" }));
    expect(onSelectMode).toHaveBeenCalledWith("html");

    fireEvent.click(screen.getByRole("button", { name: "Try LaTeX Renderer for LaTeX to Image" }));
    expect(onSelectMode).toHaveBeenCalledWith("latex");

    fireEvent.click(screen.getByRole("button", { name: "Try Mermaid Renderer for Mermaid to Image" }));
    expect(onSelectMode).toHaveBeenCalledWith("mermaid");

    fireEvent.click(screen.getByRole("button", { name: "Try Notes Mode for Notes Mode" }));
    expect(onSelectMode).toHaveBeenCalledWith("notes");
  });

  it("triggers onSelectMode when clicking anywhere on a card article", () => {
    const onSelectMode = vi.fn();
    const { container } = render(<FeatureCards onSelectMode={onSelectMode} />);
    const articles = container.querySelectorAll("article");

    expect(articles).toHaveLength(4);
    fireEvent.click(articles[0]);
    expect(onSelectMode).toHaveBeenCalledWith("html");

    fireEvent.click(articles[2]);
    expect(onSelectMode).toHaveBeenCalledWith("mermaid");
  });

  it("renders dual-layer arrow SVGs (base and active) for directional fill animation", () => {
    const { container } = render(<FeatureCards onSelectMode={vi.fn()} />);
    const buttons = container.querySelectorAll("button");
    expect(buttons).toHaveLength(4);

    buttons.forEach((button) => {
      const svgs = button.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThanOrEqual(2);
      // Check stroke attributes: base dark (#012b1b) and active white (#ffffff)
      const strokes = Array.from(svgs).map((s) => s.getAttribute("stroke"));
      expect(strokes).toContain("#012b1b");
      expect(strokes).toContain("#ffffff");
    });
  });
});
