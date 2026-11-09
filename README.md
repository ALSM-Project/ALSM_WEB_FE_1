# ALSM FE1 local development

Run your own local backend with private backend-only Gemini credentials. Follow the backend repository's docs/local-ai-development.md for MongoDB replica-set, Redis, converters, JWT/MFA and worker setup.

Use a Node runtime compatible with the lockfile (>=22.12; verified with 24.12), then run npm ci. Put VITE_API_BASE_URL=http://localhost:3000 in your private .env.local; the client adds /api/v1. Never put provider keys in VITE_* or frontend source. Start with npm run dev -- --host localhost --port 5173 --strictPort.

Provider success, heuristic fallback, heuristic-only runs and failures are displayed separately. Historical records without provenance do not confirm provider success. Save must succeed before Save & Run requests validation.

Offline checks: npm test, npm run lint, npm run build (includes typecheck). This UI does not activate or authorize D3A–D3K research execution. Live provider testing needs separate approval.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
