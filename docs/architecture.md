# Architecture & Style Guide

This document describes how to keep the codebase consistent when adding new
features or refactoring existing ones.

## Structure

- **Views are thin.** Keep UI and wiring in `src/views/*`.
- **Logic lives in composables.** Shared or complex logic goes in
  `src/composables/*`.
- **Services remain pure.** Appwrite and data access stay in
  `src/services/appwrite.js` and should not be duplicated in views.

## Reuse Components

Prefer existing components before creating new markup:

- `BaseButton`
- `BaseModal`
- `MonthTabs`
- `CategoryLegend`
- `EntryList`
- `EntryCard`

If a UI pattern appears more than once, extract a new component in
`src/components/*`.

## Styling Rules

Global styles in `src/style.css` are for:

- Base resets and layout primitives
- Shared form styles (`.field`, `.switch`)
- Design tokens (`--radius-*`, `--font-*`, `--space-*`)

Everything view-specific belongs in the view’s `<style scoped>` block.

### Consistency Targets

- **Buttons**: consistent radius (`--radius-pill`) and sizing.
- **Inputs/Selects**: consistent height and background across the app.
- **Backgrounds**: inputs, selects, and pill-buttons use white background.

If you need a new size variant, add a token and use it consistently.

## Development Flow

1. Add or update composable(s).
2. Wire the view(s).
3. Add or update component styles.
4. Keep `src/style.css` clean and minimal.

## Quick Test Checklist

- **Budget**: create/edit/delete, copy month, clear month, templates, filters.
- **Calendar**: month navigation, day modal, dots.
- **Settings**: preferences save, categories CRUD, admin user creation.
