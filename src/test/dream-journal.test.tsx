import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JournalComposer } from "@/components/JournalComposer";
import { I18nProvider } from "@/lib/i18n";
import { journalSnapshot, saveJournal } from "@/lib/journal";

beforeEach(() => {
  Element.prototype.scrollIntoView = () => {};
  if (typeof crypto.randomUUID !== "function") vi.stubGlobal("crypto", { ...crypto, randomUUID: () => `test-${Math.random().toString(36).slice(2)}` });
});
afterEach(cleanup);

function renderComposer(editing: Parameters<typeof JournalComposer>[0]["editing"]) {
  const onClear = vi.fn();
  const onStatus = vi.fn();
  render(<I18nProvider><JournalComposer editing={editing} onClear={onClear} onStatus={onStatus} /></I18nProvider>);
  return { onClear, onStatus };
}
function openForm(kind: "Daily journal" | "Dream journal") {
  fireEvent.click(screen.getByRole("button", { name: /Create a new journal entry/ }));
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${kind}`) }));
}
const saved = (title: string) => journalSnapshot().find((j) => j.title === title);

describe("Dream journal flow", () => {
  it("starts closed and steps through kind → dream form", () => {
    renderComposer(null);
    expect(screen.queryByLabelText("Entry headline")).toBeNull();
    openForm("Dream journal");
    expect(screen.getByRole("button", { name: "Change date" })).toBeTruthy();
    expect(screen.getByLabelText("Entry headline")).toBeTruthy();
    expect(screen.getByLabelText("Write about your dream experience")).toBeTruthy();
    expect(screen.getAllByPlaceholderText("A symbol from your dream")).toHaveLength(1);
    expect(screen.getByText("What kind of dream?")).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(8);
  });

  it("adds and removes key symbols", () => {
    renderComposer(null);
    openForm("Dream journal");
    fireEvent.click(screen.getByRole("button", { name: "Add symbol" }));
    expect(screen.getAllByPlaceholderText("A symbol from your dream")).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: "Remove symbol" })[0]!);
    expect(screen.getAllByPlaceholderText("A symbol from your dream")).toHaveLength(1);
  });

  it("requires content and a dream type, then saves the dream", () => {
    const { onStatus, onClear } = renderComposer(null);
    openForm("Dream journal");
    fireEvent.click(screen.getByRole("button", { name: "Save dream" }));
    expect(screen.getByRole("alert").textContent).toBe("Write a few words, a headline, or one symbol.");
    fireEvent.change(screen.getByLabelText("Entry headline"), { target: { value: "Flying again" } });
    fireEvent.click(screen.getByRole("button", { name: "Save dream" }));
    expect(screen.getByRole("alert").textContent).toBe("Choose what kind of dream this was.");
    fireEvent.click(screen.getByRole("radio", { name: "Lucid dream" }));
    fireEvent.change(screen.getByLabelText("Write about your dream experience"), { target: { value: "I knew I was dreaming and flew." } });
    fireEvent.click(screen.getAllByRole("button", { name: "Add symbol" })[0]!);
    fireEvent.change(screen.getAllByPlaceholderText("A symbol from your dream")[0]!, { target: { value: "flying" } });
    fireEvent.change(screen.getAllByPlaceholderText("A symbol from your dream")[1]!, { target: { value: "  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save dream" }));
    const e = saved("Flying again");
    expect(e?.kind).toBe("dream");
    expect(e?.dreamType).toBe("lucid");
    expect(e?.symbols).toEqual(["flying"]); // blank symbol trimmed away
    expect(e?.moods).toEqual([]);
    expect(onStatus).toHaveBeenCalledWith("Dream saved.");
    expect(onClear).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Create a new journal entry/ })).toBeTruthy();
  });

  it("keeps the daily flow as before", () => {
    const { onStatus } = renderComposer(null);
    openForm("Daily journal");
    expect(screen.getByLabelText("Write freely")).toBeTruthy();
    expect(screen.getByLabelText("Gratitude 1")).toBeTruthy();
    expect(screen.getByText("How are you feeling?")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Write freely"), { target: { value: "A gentle day." } });
    fireEvent.click(screen.getByRole("button", { name: "Save reflection" }));
    const e = journalSnapshot().find((j) => j.text === "A gentle day.");
    expect(e?.kind).toBe("daily");
    expect(e?.text).toBe("A gentle day.");
    expect(onStatus).toHaveBeenCalledWith("Reflection saved.");
  });

  it("opens an existing dream directly in the dream form for editing", () => {
    saveJournal({ date: "2026-11-01", kind: "dream", title: "Recurring hallway", text: "Same door, again.", gratitude: [], moods: [], dreamType: "nightmare", symbols: ["long hallway"] });
    const editing = saved("Recurring hallway")!;
    renderComposer(editing);
    expect(screen.getByRole("button", { name: "Update dream" })).toBeTruthy();
    expect((screen.getByLabelText("Entry headline") as HTMLInputElement).value).toBe("Recurring hallway");
    expect((screen.getByRole("radio", { name: "Nightmare" }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getAllByPlaceholderText("A symbol from your dream")[0] as HTMLInputElement).value).toBe("long hallway");
  });
});
