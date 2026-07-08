---
name: state-management-advisor
description: >
  Advises on when to use Zustand, Jotai, or both for React state management.
  Use this skill whenever the user is choosing between Zustand and Jotai, asking
  which state management library to use in a React project, wondering if they
  should combine state management libraries, or describing a state management
  problem that could be solved by either. Also trigger when users describe
  specific architectural patterns like global stores, atomic state, shared
  component state, or cross-component state sharing in React. Trigger even if
  they don't mention Zustand or Jotai by name — phrases like "global state",
  "state management in React", "avoid prop drilling", "too many re-renders", or
  "where should I store this state" are strong signals.
---

# State Management Advisor: Zustand vs Jotai vs Both

This skill helps you recommend the right state management approach based on the
user's specific context. It is grounded in real-world developer experience drawn
from community discussions and the libraries' own design philosophies.

---

## Core Mental Model

Both libraries are made by the same author (Daishi Kato) and intentionally
solve _different_ problems. The key framing:

- **Zustand** = top-down, global store (like Redux but simple)
- **Jotai** = bottom-up, atomic state (like useState but shareable)
- **Both** = Zustand handles app-level globals; Jotai handles component-cluster state

---

## Decision Framework

### Use Zustand when:

1. **You have true global app state** — theme, auth session, feature flags,
   websocket connections, user settings. State that the whole app needs from a
   single source of truth.

2. **Your team is large or the codebase is shared** — Zustand enforces structure.
   Stores live in defined files. Everyone writes stores that look alike. With
   Jotai's free-floating atoms, large teams risk atoms scattered everywhere with
   no clear ownership — real teams have migrated away from Jotai at 10+ person
   scale for this reason.

3. **You're coming from Redux** — Zustand uses the same flux/centralized mental
   model. The migration is natural; the paradigm is familiar.

4. **You need to read/write state outside React components** — plain JS files,
   event handlers, Node utilities. Zustand's store lives outside the React tree
   by design. Jotai has a store API for this but Zustand is more ergonomic here.

5. **You want Redux DevTools** — Zustand has first-class middleware support for
   Redux DevTools. Jotai's DevTools are less mature.

6. **You prefer one file per domain** — `useAuthStore.ts`, `useCartStore.ts`.
   Predictable, auditable, easy to find.

### Use Jotai when:

1. **You're replacing useState + Context** — a component or subtree needs shared
   state without the re-render cost of Context. Jotai is the most ergonomic
   solution: define an atom, use `useAtom` anywhere, done.

2. **You have rapidly-changing state in a component cluster** — charts, tables,
   editors, real-time data panels. Jotai's atomic model means only the components
   subscribed to the _specific_ changed atom re-render. Zustand can do this with
   selectors, but Jotai does it automatically.

3. **Components are far apart in the tree but share state** — lifting state to a
   common parent causes cascading re-renders. Jotai's atoms live outside the tree;
   neither parent nor sibling components are affected.

4. **You're using React Suspense** — Jotai has first-class async atom support with
   Suspense integration out of the box.

5. **You want derived/computed state** — Jotai's derived atoms are first-class.
   You can compose atoms like functions: `const totalAtom = atom(get => get(priceAtom) * get(qtyAtom))`.

6. **You're building a small-to-medium app solo or with a small team** — The
   freedom and flexibility of atoms is a feature, not a liability, when you can
   maintain the structure yourself.

7. **You're building UI-heavy interactive components** — carousels, kanban boards,
   multi-step forms, rich editors where many components share fine-grained state.

### Use Both when:

This is actually the most common real-world answer. The two libraries don't
overlap — they're complementary:

- **Zustand** → app-level globals (auth, theme, global UI state, server config)
- **Jotai** → component-level shared state (interactive UI clusters, local
  multi-component coordination)

**Classic example:**

```
Zustand store:        auth state, user preferences, websocket connection
Jotai atoms:          selected rows in a data table, open panels, editor cursor state
```

Avoid combining them if it adds cognitive overhead for little benefit. On a
small app, just pick one.

---

## Warning Signs / Anti-patterns

| Situation                             | Risk                                          | Recommendation                                |
| ------------------------------------- | --------------------------------------------- | --------------------------------------------- |
| Many atoms with no clear ownership    | Jotai becomes a mess at team scale            | Add a `stores/` convention; consider Zustand  |
| Giant Zustand store with everything   | Re-render performance issues                  | Split stores or use selectors aggressively    |
| Using Zustand as useState replacement | Overkill for local state                      | Use React's built-in useState                 |
| Using Jotai for auth/session          | Risky if you need SSR or outside-React access | Use Zustand for session-critical global state |

---

## Response Format

When advising a user, structure your answer as:

1. **Recommendation** — one of: Zustand / Jotai / Both / Neither (just useState)
2. **Primary reason** — one sentence on the deciding factor for their situation
3. **Supporting reasons** — 2–3 specific points matching their context
4. **Code sketch (optional)** — a brief example if it would clarify the recommendation
5. **Watch out for** — one relevant caveat or anti-pattern to avoid

Keep responses concise and opinionated. Users are trying to make a decision —
avoid "it depends" without following it with a clear recommendation.

---

## Quick Reference Card

| Need                                    | Library |
| --------------------------------------- | ------- |
| Auth, session, theme, global config     | Zustand |
| Shared state between distant components | Jotai   |
| Replace Redux                           | Zustand |
| Replace useState + Context              | Jotai   |
| Large team / enforced structure         | Zustand |
| Rapid re-render optimization            | Jotai   |
| DevTools / middleware                   | Zustand |
| Suspense / async state                  | Jotai   |
| Computed / derived state                | Jotai   |
| State outside React                     | Zustand |
| Both app globals + component clusters   | Both    |
