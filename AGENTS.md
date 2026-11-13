<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- The whole app is gated behind sign-in (AuthGate in `__root.tsx`; only /auth and /reset-password are open). Diary entries live in `src/lib/entries.ts` in the Lovable Cloud `entries` table with per-user RLS + realtime; components never call the database directly.
- All UI text goes through `src/lib/i18n.tsx` (en + es-MX); never hardcode user-facing strings in components.
- Sun/moon signs are sidereal (Lahiri ayanamsa) computed locally in `src/lib/astro.ts`; no external astrology API.
- Body-map anatomy uses reference-traced vector contours in `src/lib/body-outline.ts`, transformed into the shared 200×460 region coordinate space to keep tap targets and chakra glows aligned.
- Body-map gestures start only on a dedicated silhouette hit path and ignore points outside it; the framed body area blocks page scrolling (touch-action none) and is sized to fit the viewport; the page scrolls outside the frame.
- Header location uses opt-in browser geolocation and a client-side OpenStreetMap Nominatim lookup with rounded coordinates; persist only the resolved place name in this device's localStorage (never coordinates, never synced, never attached to diary/auth data), to minimize disclosure.
