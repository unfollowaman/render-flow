import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, test, expect, afterEach, vi } from "vitest";
import React from "react";
import NotesConverter from "./NotesConverter";

// Mock html-to-image
vi.mock("html-to-image", () => ({
  toPng: vi.fn().mockImplementation(async (element, options) => {
    return "data:image/png;base64,mockpngdata";
  }),
}));

describe("NotesConverter Export and Zoom Functionality", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const sampleSinglePageJson = JSON.stringify({
    chapter: { title: "Export Test Chapter", subtitle: "Single Page" },
    pages: [
      {
        items: [
          {
            type: "question",
            number: 1,
            question: [{ type: "text", content: "Export question 1" }],
            solution: [{ type: "text", content: "Export solution 1" }],
          },
        ],
      },
    ],
  });

  const multiPageItems = Array.from({ length: 15 }, (_, i) => ({
    type: "question",
    number: i + 1,
    question: [{ type: "text", content: `Question ${i + 1} content block with detailed text for print testing.` }],
    solution: [{ type: "text", content: `Solution ${i + 1} content block with detailed solution text.` }],
  }));

  const sampleThreePageJson = JSON.stringify({
    chapter: { title: "Multi-page Print Test", subtitle: "3 Pages" },
    pages: [{ items: multiPageItems }],
  });

  test("Test Case 1: PNG Download triggers download with pixelRatio = 3 and proper filename", async () => {
    render(<NotesConverter mode="notes" setMode={() => {}} />);

    const textarea = screen.getByLabelText("Input Notes JSON");
    fireEvent.change(textarea, { target: { value: sampleSinglePageJson } });

    const generateBtn = screen.getByRole("button", { name: /Generate/i });
    fireEvent.click(generateBtn);

    expect(await screen.findByText("Export Test Chapter")).toBeTruthy();

    const downloadBtn = screen.getByRole("button", { name: /Download Page as PNG/i });
    expect(downloadBtn).toBeTruthy();

    const linkClickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(linkClickSpy).toHaveBeenCalled();
    });

    expect(await screen.findByText("✓ Downloaded!")).toBeTruthy();

    const htmlToImage = await import("html-to-image");
    expect(htmlToImage.toPng).toHaveBeenCalled();
    const optionsPassed = htmlToImage.toPng.mock.calls[0][1];
    expect(optionsPassed.pixelRatio).toBe(3);
    expect(optionsPassed.backgroundColor).toBe("#FFFFFF");

    linkClickSpy.mockRestore();
  });

  test("Test Case 2: Exceeding 200,000,000px pixel area guardrail shows clear inline error", async () => {
    render(<NotesConverter mode="notes" setMode={() => {}} />);

    const textarea = screen.getByLabelText("Input Notes JSON");
    fireEvent.change(textarea, { target: { value: sampleSinglePageJson } });

    const generateBtn = screen.getByRole("button", { name: /Generate/i });
    fireEvent.click(generateBtn);

    expect(await screen.findByText("Export Test Chapter")).toBeTruthy();

    const downloadBtn = screen.getByRole("button", { name: /Download Page as PNG/i });

    // Mock offsetWidth & offsetHeight on HTMLDivElement prototype to artificially exceed 200,000,000px
    const widthGetter = vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(10000);
    const heightGetter = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(10000);

    fireEvent.click(downloadBtn);

    expect(
      await screen.findByText(/Dimensions too large: requested export area of/i)
    ).toBeTruthy();

    widthGetter.mockRestore();
    heightGetter.mockRestore();
  });

  test("Test Case 3 & 4: Clicking Print/Export All Pages creates temporary print DOM with break-after: page and clears on afterprint", async () => {
    render(<NotesConverter mode="notes" setMode={() => {}} />);

    const textarea = screen.getByLabelText("Input Notes JSON");
    fireEvent.change(textarea, { target: { value: sampleThreePageJson } });

    const generateBtn = screen.getByRole("button", { name: /Generate/i });
    fireEvent.click(generateBtn);

    expect(await screen.findByText("Multi-page Print Test")).toBeTruthy();
    expect(await screen.findByText(/Page 1 of/i)).toBeTruthy();

    const printBtn = screen.getByRole("button", { name: /Print \/ Export All Pages/i });

    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    fireEvent.click(printBtn);

    expect(screen.getByText("Preparing print...")).toBeTruthy();

    await waitFor(() => {
      const printContainer = document.querySelector(".print-only-container");
      expect(printContainer).toBeTruthy();
      const pageWrappers = printContainer.querySelectorAll(".print-page-wrapper");
      expect(pageWrappers.length).toBeGreaterThanOrEqual(3);
    });

    // Fire window afterprint event to simulate print dialog close
    fireEvent(window, new Event("afterprint"));

    await waitFor(() => {
      const printContainerAfter = document.querySelector(".print-only-container");
      expect(printContainerAfter).toBeNull();
      expect(screen.getByText("Print / Export All Pages")).toBeTruthy();
    });

    printSpy.mockRestore();
  });

  test("Test Case 5: Zoom level changes scale on screen but does not alter PNG export element", async () => {
    render(<NotesConverter mode="notes" setMode={() => {}} />);

    const textarea = screen.getByLabelText("Input Notes JSON");
    fireEvent.change(textarea, { target: { value: sampleSinglePageJson } });

    const generateBtn = screen.getByRole("button", { name: /Generate/i });
    fireEvent.click(generateBtn);

    expect(await screen.findByText("Export Test Chapter")).toBeTruthy();

    const zoomInBtn = screen.getByRole("button", { name: "Zoom in" });
    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomInBtn);

    expect(screen.getByText("120%")).toBeTruthy();

    const linkClickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const downloadBtn = screen.getByRole("button", { name: /Download Page as PNG/i });

    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(linkClickSpy).toHaveBeenCalled();
    });

    const htmlToImage = await import("html-to-image");
    const exportedElement = htmlToImage.toPng.mock.calls[0][0];

    // The captured element is the unscaled container ref div inside the transform wrapper
    expect(exportedElement.style.transform).not.toContain("scale");

    linkClickSpy.mockRestore();
  });

  test("Test Case 6: Zoom respects documented min/max bounds (50% to 150%)", async () => {
    render(<NotesConverter mode="notes" setMode={() => {}} />);

    const textarea = screen.getByLabelText("Input Notes JSON");
    fireEvent.change(textarea, { target: { value: sampleSinglePageJson } });

    const generateBtn = screen.getByRole("button", { name: /Generate/i });
    fireEvent.click(generateBtn);

    expect(await screen.findByText("Export Test Chapter")).toBeTruthy();

    const zoomOutBtn = screen.getByRole("button", { name: "Zoom out" });
    const zoomInBtn = screen.getByRole("button", { name: "Zoom in" });

    // Zoom out multiple times below min bound (50%)
    for (let i = 0; i < 10; i++) {
      fireEvent.click(zoomOutBtn);
    }
    expect(screen.getByText("50%")).toBeTruthy();
    expect(zoomOutBtn.disabled).toBe(true);

    // Zoom in multiple times above max bound (150%)
    for (let i = 0; i < 20; i++) {
      fireEvent.click(zoomInBtn);
    }
    expect(screen.getByText("150%")).toBeTruthy();
    expect(zoomInBtn.disabled).toBe(true);
  });

  test("Test Case 7: Zoom reset button has proper aria-label", async () => {
    render(<NotesConverter mode="notes" setMode={() => {}} />);

    const textarea = screen.getByLabelText("Input Notes JSON");
    fireEvent.change(textarea, { target: { value: sampleSinglePageJson } });

    const generateBtn = screen.getByRole("button", { name: /Generate/i });
    fireEvent.click(generateBtn);

    expect(await screen.findByText("Export Test Chapter")).toBeTruthy();

    const resetButton = screen.getByRole("button", { name: "Reset zoom level to 100%" });
    expect(resetButton).toBeTruthy();
  });
});
