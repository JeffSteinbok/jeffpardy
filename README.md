# Jeffpardy

You'll need to contact Jeff for some keys for this to work.  Right now, the app won't load without a connection to the blob store.

To work on the service:

1. Make sure you have a key for the Azure blob store for the questions.
1. Store the secret in the local cache:
    ```
    dotnet user-secrets set "BlobConnectionString" "[string from Azure Portal]"
    ```

To work on the web UX:

1. open the project in VS and start in debug mode.
1. npm run build

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
