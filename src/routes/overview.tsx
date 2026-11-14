import { createFileRoute, Link } from "@tanstack/react-router";
import { sortByDate, useEntries, FACTORS } from "@/lib/entries";
import { CHAKRA } from "@/lib/regions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/overview")({
  head: () => ({
    meta: [
      { title: "Diary overview — Know Thyself" },
      { name: "description", content: "A printable summary of your body diary to save as PDF or share with a doctor." },
      { property: "og:title", content: "Diary overview — Know Thyself" },
      { property: "og:description", content: "A printable summary of your body, mind and spirit diary." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { t, locale } = useI18n();
  const list = sortByDate(useEntries());
  const fmt = (d: string) => new Date(d + "T12:00").toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
  const avg = list.length ? (list.reduce((s, e) => s + e.intensity, 0) / list.length).toFixed(1) : "—";
  const byRegion = new Map<string, number>();
  list.forEach((e) => byRegion.set(e.region, (byRegion.get(e.region) ?? 0) + 1));
  const top = [...byRegion].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const factors = FACTORS.map((f) => { const m = list.filter((e) => e.factors.includes(f)); return { f, n: m.length, a: m.length ? (m.reduce((s, e) => s + e.intensity, 0) / m.length).toFixed(1) : "" }; }).filter((x) => x.n);

  return (
    <div className="print-sheet mx-auto max-w-4xl px-5 py-10">
      <div className="no-print mb-6 flex flex-wrap items-center justify-center gap-3">
        <button type="button" className="btn-primary" onClick={() => window.print()}>{t.printNow}</button>
        <Link to="/insights" className="btn-ghost">{t.backToApp}</Link>
        <p className="w-full text-center text-sm text-ink-muted">{t.printHint}</p>
      </div>
      <h1 className="font-display text-4xl">{t.appName} — {t.overviewTitle}</h1>
      <p className="mt-2 text-ink-muted">{t.overviewIntro}</p>
      <section aria-labelledby="sum" className="mt-8">
        <h2 id="sum" className="font-display text-2xl">{t.summary}</h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div><dt className="text-sm text-ink-muted">{t.totalNotes}</dt><dd className="text-2xl font-bold">{list.length}</dd></div>
          <div><dt className="text-sm text-ink-muted">{t.span}</dt><dd className="text-lg font-bold">{list.length ? `${fmt(list.at(-1)!.date)} – ${fmt(list[0]!.date)}` : "—"}</dd></div>
          <div><dt className="text-sm text-ink-muted">{t.avgIntensity}</dt><dd className="text-2xl font-bold">{avg}/5</dd></div>
        </dl>
        <h3 className="mt-6 text-lg font-bold">{t.attention}</h3>
        <ul className="mt-1 list-disc pl-6">{top.map(([r, n]) => <li key={r} className="capitalize">{t.regions[r as keyof typeof t.regions]} — {t.notesCount(n)}</li>)}</ul>
        {factors.length > 0 && <>
          <h3 className="mt-6 text-lg font-bold">{t.factorsTitle}</h3>
          <ul className="mt-1 list-disc pl-6">{factors.map((x) => <li key={x.f}>{t.factorNames[x.f]} — {t.timesAvg(x.n, x.a)}</li>)}</ul>
        </>}
      </section>
      <section aria-labelledby="tbl" className="mt-10">
        <h2 id="tbl" className="font-display text-2xl">{t.allLog}</h2>
        <table className="print-table mt-3 w-full text-left text-sm">
          <thead><tr><th>{t.date}</th><th>{t.area}</th><th>{t.chakra}</th><th>{t.intensity}</th><th>{t.kind}</th><th>{t.notes}</th></tr></thead>
          <tbody>{list.map((e) => (
            <tr key={e.id}>
              <td className="whitespace-nowrap">{fmt(e.date)}</td>
              <td className="capitalize">{t.regions[e.region]}</td>
              <td>{t.chakras[CHAKRA[e.region]]}</td>
              <td>{e.intensity}/5</td>
              <td>{t[e.kind]}</td>
              <td>{e.notes}{e.factors.length > 0 && <span className="block text-ink-muted">{e.factors.map((f) => t.factorNames[f]).join(", ")}</span>}</td>
            </tr>))}</tbody>
        </table>
      </section>
    </div>
  );
}
