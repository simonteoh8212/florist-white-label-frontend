<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## UI/UX Design System Guidelines

All frontend UI components, cards, forms, and modals MUST follow the design standards documented in [`DESIGN.md`](./DESIGN.md).
- **60-30-10 Color Discipline:** Keep 90% neutral monochrome (white/stone/charcoal); color is reserved exclusively for functional fulfillment status dots and urgent rush alerts. Do not create multi-colored pastel badge clutter.
- **Flat Container Hierarchy:** Never nest shaded or bordered boxes inside cards ("card-in-a-card" syndrome). Use whitespace, subtle 1px dividers, and typography instead.
- **Unified Action Bars:** Group related actions into clean, consistent neutral button rows. Do not duplicate action triggers (e.g., Reschedule should exist only once).
- **Modals & Overlays:** Every modal must dismiss on `ESC` and outside backdrop click, and animate within `260ms ease-out`.
