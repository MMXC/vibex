/** QRShareDialog.test.tsx — S92-E4 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { QRShareDialog } from "../QRShareDialog";

vi.mock("qrcode", () => {
  const mockToDataURL = vi.fn((url: string) => Promise.resolve(`data:image/png;base64,${btoa(url)}`));
  return { default: { toDataURL: mockToDataURL } };
});

describe("QRShareDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when closed", () => {
    render(<QRShareDialog isOpen={false} canvasId="abc123" onClose={vi.fn()} />);
    expect(screen.queryByTestId("qr-share-dialog")).not.toBeInTheDocument();
  });

  it("renders dialog when open", () => {
    render(<QRShareDialog isOpen={true} canvasId="abc123" onClose={vi.fn()} />);
    expect(screen.getByTestId("qr-share-dialog")).toBeInTheDocument();
  });

  it("shows loading state initially", async () => {
    render(<QRShareDialog isOpen={true} canvasId="abc123" onClose={vi.fn()} />);
    expect(screen.getByTestId("qr-loading")).toBeInTheDocument();
  });

  it("displays canvas info", async () => {
    render(<QRShareDialog isOpen={true} canvasId="abc123" canvasName="Test Canvas" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("Test Canvas")).toBeInTheDocument();
    });
  });

  it("calls onClose when close button clicked", async () => {
    const onClose = vi.fn();
    render(<QRShareDialog isOpen={true} canvasId="abc123" onClose={onClose} />);
    const closeBtn = screen.getByTestId("qr-dialog-close");
    await userEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when done button clicked", async () => {
    const onClose = vi.fn();
    render(<QRShareDialog isOpen={true} canvasId="abc123" onClose={onClose} />);
    await waitFor(() => {
      const doneBtn = screen.getByTestId("qr-done");
      return userEvent.click(doneBtn);
    });
    expect(onClose).toHaveBeenCalled();
  });
});
