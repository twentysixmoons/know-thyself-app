import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BodyMap } from "@/components/BodyMap";

beforeEach(() => {
  Object.defineProperty(window, "PointerEvent", { configurable: true, value: MouseEvent });
  Object.defineProperty(SVGElement.prototype, "getScreenCTM", { configurable: true, value: () => ({ inverse: () => ({}) }) });
  Object.defineProperty(SVGElement.prototype, "createSVGPoint", { configurable: true, value: () => ({ x: 0, y: 0, matrixTransform() { return { x: this.x, y: this.y }; } }) });
  Object.defineProperty(SVGElement.prototype, "isPointInFill", { configurable: true, value: (p: { x: number }) => p.x >= 30 && p.x <= 170 });
  Object.defineProperty(SVGElement.prototype, "setPointerCapture", { configurable: true, value: vi.fn() });
});
afterEach(cleanup);

describe("Body gesture boundaries", () => {
  it("ignores a gesture starting in the empty background even if it moves onto the body", () => {
    const onPick = vi.fn(); render(<BodyMap scores={{}} onPick={onPick} />);
    const svg = screen.getByRole("img");
    fireEvent.pointerDown(svg, { clientX: 5, clientY: 40 });
    fireEvent.pointerMove(svg, { clientX: 100, clientY: 40, buttons: 1 });
    fireEvent.pointerUp(svg, { clientX: 100, clientY: 40 });
    expect(onPick).not.toHaveBeenCalled();
  });
  it("keeps all arm segments selected during dragging and ignores outside points", () => {
    const onPick = vi.fn(); render(<BodyMap scores={{}} onPick={onPick} />);
    const svg = screen.getByRole("img");
    fireEvent.pointerDown(svg, { clientX: 55, clientY: 130 });
    fireEvent.pointerMove(svg, { clientX: 48, clientY: 165, buttons: 1 });
    fireEvent.pointerMove(svg, { clientX: 41, clientY: 202, buttons: 1 });
    fireEvent.pointerMove(svg, { clientX: 34, clientY: 240, buttons: 1 });
    fireEvent.pointerUp(svg, { clientX: 5, clientY: 440 });
    expect(onPick).toHaveBeenCalledExactlyOnceWith(["armL", "elbowL", "forearmL", "handL"]);
  });
  it("cancels selection without opening a note", () => {
    const onPick = vi.fn(); render(<BodyMap scores={{}} onPick={onPick} />);
    const svg = screen.getByRole("img");
    fireEvent.pointerDown(svg, { clientX: 82, clientY: 440 });
    fireEvent.pointerCancel(svg);
    fireEvent.pointerUp(svg, { clientX: 82, clientY: 440 });
    expect(onPick).not.toHaveBeenCalled();
  });
});