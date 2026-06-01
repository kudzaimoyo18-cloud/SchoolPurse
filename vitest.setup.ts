// Vitest setup — runs before every test file.
//
// Wires `@testing-library/jest-dom` matchers (e.g. `toBeInTheDocument`,
// `toHaveTextContent`) onto Vitest's `expect`. Safe to keep even before any
// component tests exist — pure-function tests don't touch it.
import "@testing-library/jest-dom/vitest";
