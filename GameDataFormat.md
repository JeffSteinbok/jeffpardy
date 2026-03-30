# Jeffpardy Game Data Format

Custom games use a JSON format describing rounds, categories, clues, and a Final Jeffpardy category.

## Structure

```
{
  "rounds": [ ... ],
  "finalJeffpardyCategory": { ... }
}
```

### Rounds

Each round has an `id` (0-based index) and an array of `categories`.

| Field        | Type         | Description                    |
|------------- |------------- |-------------------------------|
| `id`         | number       | Round index (0 = Jeffpardy, 1 = Super Jeffpardy) |
| `categories` | ICategory[]  | Array of category objects      |

### Categories

| Field     | Type     | Description                                  |
|---------- |--------- |--------------------------------------------- |
| `title`   | string   | Category title shown on the board            |
| `comment` | string   | Optional subtitle / note (can be `""`)       |
| `airDate` | string   | Optional air date (can be `""`)              |
| `clues`   | IClue[]  | Array of clue objects (typically 5 per round)|

### Clues

| Field      | Type   | Description                              |
|----------- |------- |----------------------------------------- |
| `clue`     | string | The clue text (the "answer" shown to players) |
| `question` | string | The correct response ("What is ...?")    |

> **Note:** Fields like `value`, `isAsked`, `isDailyDouble`, and `hasDailyDouble` are managed by the game engine at runtime. Do not include them in custom game data.

### Final Jeffpardy Category

Same shape as a regular category, but typically contains a single clue.

## Example

```json
{
    "rounds": [
        {
            "id": 0,
            "categories": [
                {
                    "title": "World Capitals",
                    "comment": "",
                    "airDate": "",
                    "clues": [
                        { "clue": "This city is the capital of France", "question": "What is Paris?" },
                        { "clue": "This city is the capital of Japan", "question": "What is Tokyo?" },
                        { "clue": "This city is the capital of Australia", "question": "What is Canberra?" },
                        { "clue": "This city is the capital of Brazil", "question": "What is Brasilia?" },
                        { "clue": "This city is the capital of Canada", "question": "What is Ottawa?" }
                    ]
                },
                {
                    "title": "Famous Scientists",
                    "comment": "",
                    "airDate": "",
                    "clues": [
                        { "clue": "He developed the theory of general relativity", "question": "Who is Albert Einstein?" },
                        { "clue": "She discovered radium and polonium", "question": "Who is Marie Curie?" },
                        { "clue": "He formulated the laws of motion and gravity", "question": "Who is Isaac Newton?" },
                        { "clue": "He is known as the father of modern genetics", "question": "Who is Gregor Mendel?" },
                        { "clue": "She was a pioneering computer scientist and Navy admiral", "question": "Who is Grace Hopper?" }
                    ]
                }
            ]
        },
        {
            "id": 1,
            "categories": [
                {
                    "title": "Classic Movies",
                    "comment": "",
                    "airDate": "",
                    "clues": [
                        { "clue": "This 1994 film follows a man on a bench telling his life story", "question": "What is Forrest Gump?" },
                        { "clue": "This Spielberg film features a theme park of cloned dinosaurs", "question": "What is Jurassic Park?" },
                        { "clue": "Rosebud is the famous last word in this 1941 film", "question": "What is Citizen Kane?" },
                        { "clue": "This 1972 film begins with 'I'm gonna make him an offer he can't refuse'", "question": "What is The Godfather?" },
                        { "clue": "This 1985 film features a DeLorean time machine", "question": "What is Back to the Future?" }
                    ]
                },
                {
                    "title": "Space Exploration",
                    "comment": "",
                    "airDate": "",
                    "clues": [
                        { "clue": "This was the first artificial satellite launched into orbit", "question": "What is Sputnik?" },
                        { "clue": "He was the first human to walk on the Moon", "question": "Who is Neil Armstrong?" },
                        { "clue": "This NASA rover landed on Mars in February 2021", "question": "What is Perseverance?" },
                        { "clue": "This space telescope launched in 1990 orbits Earth", "question": "What is the Hubble Space Telescope?" },
                        { "clue": "This is the closest planet to the Sun", "question": "What is Mercury?" }
                    ]
                }
            ]
        }
    ],
    "finalJeffpardyCategory": {
        "title": "Literary Characters",
        "comment": "",
        "airDate": "",
        "clues": [
            {
                "clue": "This character created by Mary Shelley is often confused with his creator",
                "question": "Who is Frankenstein's monster?"
            }
        ]
    }
}
```

## Tips

- Each round typically has **6 categories** with **5 clues** each, but fewer works fine.
- Round 0 is "Jeffpardy" and Round 1 is "Super Jeffpardy" (double values).
- You can paste JSON directly in the **Modify Game Data** dialog or load from a file.
- An Excel template is also available: `wwwroot/JeffpardyGameDataTemplate.xlsx`.
