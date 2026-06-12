/** MobilePreviewCanvas.test.tsx — S92-E4 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { MobilePreviewCanvas } from "../MobilePreviewCanvas";

describe("MobilePreviewCanvas", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders header with canvas name", () => {
    render(<MobilePreviewCanvas canvasId="abc123" canvasName="Test Canvas" />);
    expect(screen.getByText("Test Canvas")).toBeInTheDocument();
  });

  it("renders default canvas name", () => {
    render(<MobilePreviewCanvas canvasId="abc123" />);
    expect(screen.getByText("画布")).toBeInTheDocument();
  });

  it("renders viewport container", () => {
    render(<MobilePreviewCanvas canvasId="abc123" />);
    expect(screen.getByTestId("mobile-preview-canvas")).toBeInTheDocument();
  });

  it("renders zoom indicator", () => {
    render(<MobilePreviewCanvas canvasId="abc123" />);
    const indicator = screen.getByTestId("zoom-indicator");
    expect(indicator).toBeInTheDocument();
    // Initial zoom should be 100%
    expect(indicator.textContent).toBe("100%");
  });

  it("renders hint text", () => {
    render(<MobilePreviewCanvas canvasId="abc123" />);
    expect(screen.getByText(/移动端预览/)).toBeInTheDocument();
  });

  it("renders nodes when provided", () => {
    const nodes = [
      { id: "node-1", position: { x: 10, y: 20 }, type: "api", data: { label: "API Node" }, measured: { width: 160, height: 60 } },
    ];
    render(<MobilePreviewCanvas canvasId="abc123" nodes={nodes} />);
    expect(screen.getByText("API Node")).toBeInTheDocument();
  });

  it("renders without nodes", () => {
    render(<MobilePreviewCanvas canvasId="abc123" nodes={[]} />);
    // Just verify no crash and canvas renders
    expect(screen.getByTestId("mobile-preview-canvas")).toBeInTheDocument();
  });
});
