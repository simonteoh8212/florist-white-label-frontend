# UI/UX Design System Guidelines

This document outlines the design laws, principles, and implementation rules for all frontend components, modals, and layouts across the Florist White-Label platform.

---

## 1. The 60-30-10 Color Discipline (Kill the "Skittles Palette")

When everything has a colorful pastel badge, nothing stands out, and cognitive fatigue sets in. Follow the **60-30-10 rule**:

- **60% Dominant Base:** Clean white (`bg-white`) and soft neutral backgrounds (`bg-stone-50`).
- **30% Structure & Content:** Deep charcoal typography (`text-stone-900`), secondary labels (`text-stone-500`), crisp muted borders (`border-stone-200/80`).
- **10% Functional Accent Only:** Color must be strictly functional:
  - **Fulfillment Status Dots:** Amber (New), Purple (Arranging), Cyan (Ready), Blue (Dispatched), Emerald (Delivered).
  - **Critical Alerts:** Urgent Rush Order badges (`⚡ Rush`), Store Closed/Emergency notices.
  - **Do NOT colorize neutral metadata:** Channel origins (`Web`, `Walk-in`), payment methods, utility buttons, and standard labels must stay neutral monochrome.

---

## 2. Container Hierarchy (Eliminate "Card-in-a-Card" Syndrome)

Never nest bordered, shaded boxes inside other bordered cards (e.g., outer white card → inner gray recipient card → inner amber notes card).

- **Flat Layouts:** Use generous vertical rhythm (`space-y-3` or `space-y-4`) and subtle 1px dividers (`border-t border-stone-100`).
- **Typographic Scale:** Distinguish sections with typographic hierarchy (bold names, muted helper text) rather than wrapping every section in its own container box.
- **Elevation:** Stick to subtle elevation (`shadow-2xs` or `shadow-xs`) with smooth transitions on hover (`hover:shadow-sm`).

---

## 3. Action Button Hierarchy & Hick's Law

Reduce cognitive clutter by organizing interactive elements into cohesive, predictable patterns:

- **Unified Neutral Action Bars:** Group related actions (Call, WhatsApp, Copy Rider Info, Maps) into a single row of cohesive neutral buttons:
  - Base: `bg-white border border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-50 shadow-2xs text-[11px] font-medium`
  - Avoid separate brightly-colored neon square icons. Keep the icon subtle and the button styled consistently.
- **Zero Redundancy:** Never place the same action trigger twice on the same card (e.g., Reschedule should exist in only one clear, logical place).
- **Tactile Feedback:** Every button must provide instant tactile response via `active:scale-97` and cursor pointer.

---

## 4. Rapid Scanning Hierarchy (The 2-Second Rule)

In a busy store or counter workflow, staff must absorb the critical state in under 2 seconds:

1. **WHEN:** Delivery slot date, time window, and rush urgency must lead the card at the top.
2. **STATUS:** Sleek, high-contrast status indicator pill with an unambiguous colored dot.
3. **WHAT:** Hero product thumbnail, item title, price, and add-on tags.
4. **WHO & WHERE:** Recipient name, fulfillment method (Delivery vs Self-Pickup), and drop-off address.
5. **DISPATCH:** 1-tap dispatch actions (Copy for Rider, WhatsApp, Call, Maps).
6. **FINANCIALS:** Quiet payment status and grand total at the bottom.

---

## 5. Animation & Modal Standards

- **Transitions:** Standard `260ms ease-out` on enter and dismiss for all modal overlays and drawers.
- **Dismissibility:** All popups and modals must support:
  - `ESC` keyboard press to dismiss.
  - Clicking outside the modal backdrop to dismiss.
- **Sliding Tabs:** Reusable pill tabs must use the spring curve `cubic-bezier(0.3, 1.3, 0.5, 1)` with automatic centered scroll into view.

