# Jeffpardy Project Guidelines

## Architecture Overview

This is a trivia game application (Jeffpardy) built with:
- **Backend**: ASP.NET Core (.NET 10.0) with SignalR for real-time communication
- **Frontend**: TypeScript with React components, built via Vite
- **Storage**: Azure Blob Storage for game data and configuration
- **Structure**: Traditional ASP.NET Core MVC with Pages, API controllers, and SignalR hubs

## Code Style

### C# Backend Conventions

- **Namespace**: Use `Jeffpardy` as the root namespace
- **Controllers**: Place in `/api/` folder, inherit from `ControllerBase`, use `[ApiController]` attribute
- **Models**: Keep domain models at root level (e.g., `Game.cs`, `Player.cs`, `Team.cs`)
- **Services**: Implement interfaces for testability, use dependency injection
- **SignalR Hubs**: Place in `/Hubs/` folder, inherit from `Hub`
- **Configuration**: Use strongly-typed configuration classes (e.g., `FinalJeffpardySettings.cs`)

Example controller pattern:
```csharp
[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    // Implementation
}
```

### TypeScript Frontend Conventions

- **Interfaces**: Use `I` prefix for interfaces (e.g., `IPlayer`, `ITeam`, `IClue`)
- **Components**: Use `.tsx` extension for React components
- **Types**: Define shared types in `Types.tsx`
- **File organization**: Organize components in feature-based folders under `/src/web/`
- **Styling**: Use Sass/SCSS files alongside components

Example interface pattern:
```typescript
export interface IPlayer {
    team: string;
    name: string;
    connectionId: string;
}
```

## Build and Test

### Development Commands
```bash
# Install dependencies
npm install

# Development build
npm run build

# Production build  
npm run buildProd

# Run application with watch
dotnet watch run
```

### Pre-Push Checklist
Always run these checks locally before pushing:
```bash
npm run lint          # ESLint
npm run format:check  # Prettier (fix with: npx prettier --write <files>)
npm test              # Frontend tests (vitest)
dotnet test src/backend/Jeffpardy.Tests -p:SkipFrontendBuild=true  # Backend tests (xUnit)
```

### Build Tasks Available
- `dotnet build` - Build the project
- `dotnet publish` - Publish for deployment
- `dotnet watch run` - Run with auto-rebuild

## Project Structure Conventions

```
/                           # Root contains models and core files
/api/                      # Web API controllers
/Pages/                    # Razor Pages for views
/Hubs/                     # SignalR hubs
/src/web/                  # TypeScript/React frontend source
   /components/            # Reusable React components
   /pages/                 # Page-specific components
   /utilities/             # Shared utilities and helpers
/wwwroot/                  # Static web assets
```

## Key Dependencies

- **Azure.Storage.Blobs**: For game data storage
- **Azure.Identity**: For Azure authentication
- **Newtonsoft.Json**: For JSON serialization
- **SignalR**: Built into ASP.NET Core for real-time features

## Development Patterns

### Configuration Management
- Use `appsettings.json` for base configuration
- Use `appsettings.Development.json` for development overrides
- Use User Secrets for sensitive development data
- Implement strongly-typed configuration classes

### Real-time Communication
- Use SignalR hubs for game state synchronization
- Follow hub naming convention: `GameHub` for game-related real-time features

### Frontend State Management
- Keep game state synchronized via SignalR
- Use TypeScript interfaces for type safety
- Organize components by feature/page

## Testing Guidelines

### Frontend Tests (Vitest)
- Use `vitest` with `@testing-library/react` and `jsdom`
- Import from `"vitest"`: `describe`, `it`, `expect`, `vi`, `afterEach`
- Use `vi.mock()` for module mocks, `vi.spyOn()` for spies
- Always call `vi.restoreAllMocks()` in `afterEach`
- Place test files next to source files with `.test.ts` / `.test.tsx` extension

### Backend Tests (xUnit + Moq)
- Use `[Fact]` for single tests, `[Theory]` with `[InlineData]` for parameterized tests
- Use Moq for mocking dependencies
- Naming convention: `MethodName_Scenario_ExpectedBehavior`
- Place tests in `src/backend/Jeffpardy.Tests/`

## Azure Integration

When working with Azure features:
- Use dependency injection for Azure services
- Implement proper error handling for cloud operations
- Use Azure.Identity for authentication patterns
- Cache Azure resources appropriately (see `SeasonManifestCache.cs`)