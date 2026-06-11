# INU Course Dashboard Design System (DESIGN.md)

This document defines the core visual guidelines, tokens, and component styling rules for the **INU 2026-1 Course Dashboard**. All AI-driven and manual UI updates must strictly adhere to these specifications to ensure a unified and premium experience.

---

## 1. Brand Identity & Color Palette

Inspired by Incheon National University (INU) brand colors and the **Shopall Dashboard (Behance @uihecham)** styling.

| Token | CSS / Tailwind | Color Hex | Usage & Description |
| :--- | :--- | :--- | :--- |
| **Primary (INU Blue)** | `bg-[#1A4FA0]` / `text-[#1A4FA0]` | `#1A4FA0` | Main theme color, primary buttons, active states, sidebars. |
| **Secondary (INU Yellow)** | `bg-[#F5B700]` / `text-[#F5B700]` | `#F5B700` | Points of interest, chart maximum indicators, key badges ONLY. |
| **Background (Global)** | `bg-[#F0F2F5]` | `#F0F2F5` | Clean page background. |
| **Card / Panel Background**| `bg-white` | `#FFFFFF` | White card and dashboard modules. |
| **Text Primary** | `text-[#1A1A2E]` | `#1A1A2E` | High readability header/title text. |
| **Text Secondary** | `text-[#6B7280]` | `#6B7280` | Body copy, meta descriptions, secondary indicators. |
| **Border Soft** | `border-[#E5E7EB]` | `#E5E7EB` | Dividers, card strokes. |

---

## 2. Typography

- **Primary Font Family**: `Inter`, `Pretendard`, sans-serif.
- **Font Sizes & Weights**:
  - `Title Large`: `text-2xl` (24px) / `font-bold` / `text-[#1A1A2E]`
  - `Title Medium`: `text-lg` (18px) / `font-bold`
  - `Body Regular`: `text-sm` (14px) / `font-medium` / `text-[#6B7280]`
  - `Caption`: `text-xs` (12px) / `font-semibold`

---

## 3. Layout Grid & Structure

Our layout mirrors the **Shopall Dashboard** 3-tier layout structure:

1. **Sidebar**: Fixed on the left side, width `240px` (`w-[240px] h-screen fixed`). Background is solid white.
2. **Top Header**: Horizontal bar spanning the top of the main area, containing titles, user options, search. Height `56px` (`h-14`). Background is solid white with a bottom border `border-b border-[#E5E7EB]`.
3. **Main Content**: Below the top header, padded appropriately, presenting content organized inside clean white cards on the `#F0F2F5` background.



---

## 4. Components & Cards

### Cards (Card-based UI)
- All main blocks must be containerized in white cards:
  - Classes: `bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm`
  - Hover micro-animations (optional, for interactive cards): `transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`

### Buttons
- **Primary**: `bg-[#1A4FA0] hover:bg-[#153F80] text-white font-semibold rounded-xl text-sm px-4 py-2.5 transition-all shadow-sm`
- **Secondary**: `bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 font-medium rounded-xl text-sm px-4 py-2.5 transition-all`
- **Ghost/Link**: `text-sm font-semibold text-[#1A4FA0] hover:text-[#153F80] transition-all`

### Badges & Tags
- **General Badge Container**: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold`
- **Category Colors**:
  - Primary / Mandatory: `bg-blue-50 text-[#1A4FA0]`
  - Elective / Choice: `bg-amber-50 text-amber-700`
  - Warning / Alert: `bg-[#F5B700]/10 text-amber-800`

---

## 5. Coding Principles & Guidelines

1. **Accessibility (a11y)**: Maintain high color contrast between texts and backgrounds (e.g. do not overlay pure white text on light gold).
2. **Consistency**: Do not introduce arbitrary colors (like generic bright greens or purples) unless mapped to semantic categories approved in this design system.
3. **Responsive Web Design**: Ensure grid columns reduce on smaller viewport resolutions (`grid-cols-1 md:grid-cols-3` etc.).
