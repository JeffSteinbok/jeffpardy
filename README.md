# Jeffpardy

<p align="center">
  <img src="wwwroot/images/jeffpardyrounded.png" alt="Jeffpardy" width="400" />
</p>

[![Health Check](https://github.com/JeffSteinbok/jeffpardy/actions/workflows/health-check.yml/badge.svg)](https://github.com/JeffSteinbok/jeffpardy/actions/workflows/health-check.yml)

> 🎮 **Ready to play?** Head over to [jeffpardy.azurewebsites.net](https://jeffpardy.azurewebsites.net) and let [GitHub Copilot](https://github.com/features/copilot) or [Claude](https://claude.ai) whip up a custom game for you — no setup required! 🏆

A Jeopardy-style trivia game built with ASP.NET Core, React/TypeScript, and SignalR for real-time multiplayer gameplay. Game data is stored in Azure Blob Storage.

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 22+](https://nodejs.org/) (includes npm)

## Getting Started

```bash
git clone https://github.com/JeffSteinbok/jeffpardy.git
cd jeffpardy
npm install
```

### Azure Blob Storage (optional)

Game categories are loaded from Azure Blob Storage. To connect, store the connection string as a user secret:

```bash
dotnet user-secrets --project src/backend set "BlobConnectionString" "[string from Azure Portal]"
```

**Don't have Azure access?** Add `?debugMode=2` to the URL to use locally generated placeholder categories — no Azure connection needed.

### Running the App

```bash
npm run build        # Build the frontend
dotnet run --project src/backend   # Start the server
```

For development with auto-rebuild:

```bash
npm run dev                          # Watch & rebuild frontend
dotnet watch run --project src/backend   # Watch & rebuild backend (in a second terminal)
```

The app will be available at the URL shown in the terminal output (typically `https://localhost:5001`).

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Development frontend build |
| `npm run buildProd` | Production frontend build |
| `dotnet build src/backend` | Build the backend (does **not** trigger a frontend build) |
| `dotnet run --project src/backend` | Run the server |
| `dotnet watch run --project src/backend` | Run with auto-rebuild |

> **Note:** Frontend and backend builds are fully decoupled. `dotnet build` never runs npm — build the frontend separately with `npm run build`.

## Testing

```bash
npm test                                                       # Frontend tests (vitest)
dotnet test src/backend/Jeffpardy.Tests                              # Backend tests (xUnit)
```

## Linting & Formatting

```bash
npm run lint           # ESLint check
npm run lint:fix       # ESLint auto-fix
npm run format:check   # Prettier check
npx prettier --write <files>   # Prettier auto-fix
```

## Pre-Push Checklist

Run all checks before pushing:

```bash
npm run lint
npm run format:check
npm test
dotnet test src/backend/Jeffpardy.Tests
```

## CI Pipeline

GitHub Actions runs on every push to `main` and on PRs targeting `main`. It runs three parallel jobs:

1. **Backend Build & Test** — restores, builds, and tests the .NET project
2. **Frontend Build & Test** — installs deps, builds with Vite, and runs vitest
3. **Lint & Format Check** — runs ESLint and Prettier checks

## Project Structure

```
src/
  web/                  # TypeScript/React frontend
    components/         # Reusable React components
    pages/              # Page-specific entry points
    utilities/          # Shared utilities and helpers
  backend/              # ASP.NET Core backend
    api/                # Web API controllers
    Hubs/               # SignalR hubs
    Pages/              # Razor Pages (views)
    Jeffpardy.Tests/    # xUnit backend tests
wwwroot/                # Static web assets (Vite output goes to wwwroot/js/dist/)
```

## PR Workflow

Always create a pull request to merge changes into `main`. PRs trigger the CI pipeline automatically.

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
| FakeTeams | 10 | 400 | Create 3 fake teams with 4 players each |

### Common Combinations

| Value | Flags | Description |
|-------|-------|-------------|
| `4` | SkipIntro | Skip lobby only |
| `6` | SkipIntro + LocalCategories | Skip lobby, fake categories |
| `1E` | SkipIntro + LocalCategories + DD + FixedGameCode | Full dev mode with category reveal |
| `46` | SkipIntro + LocalCategories + ShortTimers | Quick dev iteration |
| `21E` | SkipIntro + LocalCategories + DD + FixedGameCode + SkipCategoryReveal | Full dev mode, no reveal |
| `61E` | SkipIntro + LocalCategories + DD + FixedGameCode + FakeTeams + SkipCategoryReveal | Full dev mode with fake teams |

## Custom Game Data

You can paste your own game data JSON into the **Modify Game Data** dialog or load from a file. See [GameDataFormat.md](GameDataFormat.md) for the full format specification and examples. An Excel template is also available at `wwwroot/JeffpardyGameDataTemplate.xlsx`.

## Access Code

Category API endpoints are gated behind an access code. The code can be provided via:

- **`X-Access-Code` header** — used by the frontend automatically
- **`?accessCode=` query parameter** — useful for testing APIs directly in a browser

Example: `https://localhost:5001/api/Categories/GameData?accessCode=buzzer123`

### Configuration

| Environment | How to set |
|-------------|-----------|
| **Local dev** | `dotnet user-secrets --project src/backend set "AccessCode" "yourcode"` |
| **Azure App Service** | Add `AccessCode` app setting in Configuration |
| **GitHub Actions** | Stored as `ACCESS_CODE` repository secret |

If no `AccessCode` is configured on the server, only an empty string will be accepted (the header/param must still be present).

On the host page, the access code is stored in a session cookie so it persists across page refreshes until the browser is closed.
