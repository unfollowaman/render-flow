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

describe("NotesConverter Export Functionality", () => {
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

  test("Test Case 1: PNG Download triggers download with pixelRatio = 3 and proper filename", async () => {
    render(<NotesConverter mode="notes" setMode={() => {}} />);

    const textarea = screen.getByLabelText("Input Notes JSON");
    fireEvent.change(textarea, { target: { value: sampleSinglePageJson } });

    const generateBtn = screen.getByRole("button", { name: /Generate/i });
    fireEvent.click(generateBtn);

    expect(await screen.findByText("Export Test Chapter")).toBeTruthy();

    const downloadBtn = screen.getByRole("button", { name: /^Download PNG$/i });
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

    const downloadBtn = screen.getByRole("button", { name: /^Download PNG$/i });

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

  test("Test Case 3: Screen reader status announcements update during PNG export", async () => {
    render(<NotesConverter mode="notes" setMode={() => {}} />);

    const textarea = screen.getByLabelText("Input Notes JSON");
    fireEvent.change(textarea, { target: { value: sampleSinglePageJson } });

    const generateBtn = screen.getByRole("button", { name: /Generate/i });
    fireEvent.click(generateBtn);

    expect(await screen.findByText("Export Test Chapter")).toBeTruthy();

    const statusContainer = screen.getByRole("status", { name: "Export status" });
    expect(statusContainer).toBeTruthy();

    const linkClickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const downloadBtn = screen.getByRole("button", { name: /^Download PNG$/i });

    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(statusContainer.textContent).toBe("Page(s) exported as PNG successfully!");
    });

    linkClickSpy.mockRestore();
  });
});
