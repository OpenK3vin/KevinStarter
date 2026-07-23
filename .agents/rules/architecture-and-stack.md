# Architecture and Tech Stack Rules

This project follows a strict technology stack and architecture. You must adhere to these guidelines and always use the designated tools for their specific purposes.

## Core Tech Stack

- **React 19**: Use the latest React 19 features and modern hooks. Avoid deprecated patterns.
- **Vite 8**: The project is built using Vite. Do not use Next.js or other frameworks.
- **Tailwind CSS v4**: Use Tailwind for all styling. Rely on modern Tailwind classes and avoid custom CSS unless necessary.
- **TanStack Router**: All routing must be handled through `@tanstack/react-router`. Use file-based routing and loaders as per TanStack Router's patterns. Do not use `react-router-dom`.
- **Jotai**: Use `jotai` for global state management. Use atoms to manage shared state across components. Do not introduce Redux, Zustand, or React Context for complex global state.
- **Shadcn UI**: Use `shadcn` for UI components. When building new features, always prioritize using existing Shadcn components or installing new ones via the Shadcn CLI/skill before building custom ones from scratch.
- **React Three Fiber & Drei**: Use [`@react-three/fiber`](https://github.com/pmndrs/react-three-fiber) and [`@react-three/drei`](https://github.com/pmndrs/drei) for 3D interfaces and rendering. When building specific decoration components, adhere to the architectural constraints outlined in `threejs-deco-arc-rule.md`.

## Agent Skills Enforcement

When instructed to add UI components or design new interfaces:

1. **Always use the `shadcn` skill** to manage, add, or compose UI components. Check if a Shadcn component exists for your needs before building a bespoke one.
2. **Follow the `frontend-design` skill** to ensure the aesthetics match the high-quality, modern design required for this project.

## General Architecture Guidelines

- **Component Structure**: Keep components modular. Separate logic from presentation where appropriate.
- **Routing**: Manage all page transitions, path parameters, and query state using TanStack Router hooks like `useNavigate`, `useParams`, and `useSearch`.
- **State**: Keep local state local. Use Jotai for state that needs to be shared across the routing boundaries or deep component trees.
- **Forms**: Use `react-hook-form` in combination with Shadcn UI's `<Form>` components and Zod schema validation for all forms. Avoid raw React state for form inputs.
- **Styling**: Rely heavily on Shadcn's provided utility classes and extend them carefully. Always use `cn` utility (clsx + tailwind-merge) when composing class names in components.
