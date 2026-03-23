# Development Guide

Jeffpardy is an ASP.NET Core + React/TypeScript trivia game app. The backend serves Razor Pages and a SignalR hub; the frontend is built with Vite.

## Prerequisites

| Tool | Version |
|------|---------|
| .NET SDK | 10.0+ |
| Node.js | 22+ |
| npm | (comes with Node) |

## Repository Layout

```
/                        Root (package.json, vite.config.ts, tsconfig.json)
├── src/
│   ├── backend/         ASP.NET Core project (Jeffpardy.csproj)
│   │   ├── api/         REST API controllers
│   │   ├── Hubs/        SignalR hub (GameHub)
│   │   ├── Pages/       Razor Pages (Index, Host, Player, etc.)
│   │   └── Jeffpardy.Tests/  xUnit backend tests
│   └── web/             TypeScript/React frontend source
│       ├── components/  Reusable React components
│       ├── pages/       Page entry points (StartPage, HostPage, PlayerPage, …)
│       └── utilities/   Shared helpers
├── wwwroot/             Static assets & built JS output (wwwroot/js/dist/)
├── .devcontainer/       GitHub Codespaces / Dev Container config
└── .github/workflows/   CI and deploy workflows
```

## Getting Started

### Option A: GitHub Codespaces (Recommended)

1. Click **Code → Codespaces → Create codespace on master** from the repo page.
2. The container will install .NET 10, Node.js 22, and restore all dependencies automatically.
3. Store your Azure Blob connection string (or skip this — see [Debug Mode](#debug-mode)):
    ```bash
    dotnet user-secrets set "BlobConnectionString" "<connection-string>" --project src/backend/Jeffpardy.csproj
    ```
4. Build and run:
    ```bash
    npm run build
    cd src/backend && dotnet run
    ```
5. Codespaces will detect ports **5000** (HTTP) / **5001** (HTTPS) and offer to open them in a browser.

### Option B: Local Setup

1. Install the prerequisites listed above.
2. Clone the repo and install npm dependencies:
    ```bash
    git clone https://github.com/JeffSteinbok/jeffpardy.git
    cd jeffpardy
    npm ci --legacy-peer-deps
    ```
3. Store your Azure Blob connection string (or skip — see [Debug Mode](#debug-mode)):
    ```bash
    dotnet user-secrets set "BlobConnectionString" "<connection-string>" --project src/backend/Jeffpardy.csproj
    ```
4. Build the frontend and start the server:
    ```bash
    npm run build
    cd src/backend && dotnet run
    ```
5. Open **https://localhost:5001** (or http://localhost:5000) in your browser.

## Day-to-Day Development

### Frontend (TypeScript / React)

```bash
# One-time build
npm run build

# Watch mode — rebuilds on file changes
npm run dev
```

The Vite build outputs to `wwwroot/js/dist/`. Entry points are defined in `vite.config.ts`.

### Backend (ASP.NET Core)

```bash
# Run the server (from src/backend/)
dotnet run

# Run with auto-reload on code changes
dotnet watch run
```

The server listens on `https://localhost:5001` and `http://localhost:5000` by default (configured in `Properties/launchSettings.json`).

### Full-Stack Workflow

For the fastest iteration, run the frontend watcher and backend server in separate terminals:

```bash
# Terminal 1 — frontend watch
npm run dev

# Terminal 2 — backend server (from src/backend/)
dotnet run
```

## Testing

### Frontend Tests (Vitest)

```bash
npm test              # Single run
npm run test:watch    # Watch mode
```

Tests live next to source files with `.test.ts` / `.test.tsx` extensions and use `@testing-library/react` with `jsdom`.

### Backend Tests (xUnit)

```bash
dotnet test src/backend/Jeffpardy.Tests -p:SkipFrontendBuild=true
```

> **Note:** Use `-p:SkipFrontendBuild=true` to skip the npm frontend build during `dotnet test`/`dotnet build`. Without it, the build target will run `npm ci && npm run build` automatically.

## Linting & Formatting

### ESLint

```bash
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
```

Config: `eslint.config.js` (flat config with typescript-eslint, eslint-plugin-react, eslint-config-prettier).

### Prettier

```bash
npm run format:check  # Check formatting
npm run format        # Auto-fix formatting
```

Config: `.prettierrc.json` — 4-space tabs, double quotes, 120 char print width, ES5 trailing commas.

## Pre-Push Checklist

Run all of these before pushing. CI will check them on every PR.

```bash
npm run lint
npm run format:check
npm test
dotnet test src/backend/Jeffpardy.Tests -p:SkipFrontendBuild=true
```

## Debug Mode

Add `?debugMode=<value>` to the host URL to enable debug flags. Values are hex and can be combined by adding them together.

| Flag | Bit | Hex | Description |
|------|-----|-----|-------------|
| VerboseLogging | 0 | 1 | Enable verbose console logging |
| LocalCategories | 1 | 2 | Use locally generated lorem ipsum categories (no Azure needed) |
| SkipIntro | 2 | 4 | Skip the lobby/intro screen |
| DailyDouble00 | 3 | 8 | Force daily double at position 0,0 |
| FixedGameCode | 4 | 10 | Use a fixed game code |
| ShortRound | 5 | 20 | Use fewer clues per round |
| ShortTimers | 6 | 40 | Use 1-second timers |
| FinalJeffpardy | 7 | 80 | Jump straight to Final Jeffpardy |
| FastFinalJeffpardy | 8 | 100 | Shorten Final Jeffpardy timer |
| SkipCategoryReveal | 9 | 200 | Skip the category reveal animation |

### Common Combinations

| Value | Flags | Description |
|-------|-------|-------------|
| `4` | SkipIntro | Skip lobby only |
| `6` | SkipIntro + LocalCategories | Skip lobby, fake categories |
| `1E` | SkipIntro + LocalCategories + DD + FixedGameCode | Full dev mode with category reveal |
| `46` | SkipIntro + LocalCategories + ShortTimers | Quick dev iteration |
| `21E` | SkipIntro + LocalCategories + DD + FixedGameCode + SkipCategoryReveal | Full dev mode, no reveal |

> **Tip:** Use `?debugMode=2` (LocalCategories) to bypass the Azure Blob connection entirely for frontend development.

## CI / CD

| Workflow | File | Trigger | What it does |
|----------|------|---------|-------------|
| **CI** | `.github/workflows/ci.yml` | Push & PR to `master` | Backend build & test, frontend build & test, lint & format check |
| **Deploy** | `.github/workflows/dotnetcore.yml` | Push to `master` | Build & publish, deploy to Azure Web App |

## Architecture Notes

- **SignalR hub** at `/hub/game` — real-time game state synchronization between host and players.
- **REST APIs** under `/api/` — category loading, metadata, diagnostics.
- **Razor Pages** — server-rendered HTML shells that load the React bundles.
- **Azure Blob Storage** — stores trivia category/question data. Connection string is stored via .NET User Secrets in development.
