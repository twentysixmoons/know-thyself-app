import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { EntryDialog } from "@/components/EntryDialog";

const { remove } = vi.hoisted(() => ({ remove: vi.fn() }));
vi.mock("@/lib/entries", () => ({ FACTORS: [], KINDS: ["body"], saveEntry: vi.fn(), deleteEntry: remove }));
const entry = { id: "test-card", date: "2026-11-10", region: "head" as const, intensity: 3, kind: "body" as const, notes: "Test note", factors: [], createdAt: 1 };
beforeEach(() => {
  remove.mockClear();
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
});
afterEach(cleanup);
function openDelete() {
  render(<EntryDialog region="head" editing={entry} history={[]} onClose={vi.fn()} onSaved={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
}
describe("Card deletion confirmation", () => {
  it("does not delete when first requesting deletion", () => { openDelete(); expect(remove).not.toHaveBeenCalled(); });
  it("keeps the card when canceled", () => {
    openDelete(); fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(remove).not.toHaveBeenCalled();
  });
  it("deletes only the edited card after confirmation", () => {
    openDelete(); fireEvent.click(screen.getByRole("button", { name: "Yes, delete this card" }));
    expect(remove).toHaveBeenCalledExactlyOnceWith("test-card");
  });
});