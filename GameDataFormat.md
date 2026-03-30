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
                    "title": "THE ENVIRONMENT",
                    "airDate": "1992-11-27T00:00:00",
                    "comment": "",
                    "clues": [
                        { "clue": "On November 6, 1991 the last of more than 700 oil well fires in this country was doused", "question": "Kuwait" },
                        { "clue": "Since 1985 the amount of this heavy metal in U.S. gasoline has been reduced by over 90%", "question": "lead" },
                        { "clue": "Burning 1 gallon of gasoline in your car can produce some 20 pounds of this \"greenhouse gas\"", "question": "carbon dioxide" },
                        { "clue": "Since 1985 American farmers have reduced the loss of this to about 1 billion tons per year", "question": "topsoil" },
                        { "clue": "In 1978 this Niagara Falls, N.Y. community was evacuated due to chemical pollution", "question": "Love Canal" }
                    ]
                },
                {
                    "title": "THE BIBLE",
                    "airDate": "1992-11-27T00:00:00",
                    "comment": "",
                    "clues": [
                        { "clue": "Some Bibles say Lot's wife was turned into \"a statue\" made of this; others say it was \"a pillar\"", "question": "salt" },
                        { "clue": "\"He loved a woman in the valley of Sorek whose name was Delilah\"", "question": "Samson" },
                        { "clue": "\"Watch and pray that ye enter not into temptation:\" this \"indeed is willing, but the flesh is weak\"", "question": "the spirit" },
                        { "clue": "\"The wolf also shall dwell with\" this animal, \"and the leopard shall lie down with the kid\"", "question": "the lamb" },
                        { "clue": "These \"dead\" insects \"cause the ointment of the apothecary to send forth a stinking savour\"", "question": "flies" }
                    ]
                },
                {
                    "title": "\"FOR\" WORDS",
                    "airDate": "1992-11-27T00:00:00",
                    "comment": "",
                    "clues": [
                        { "clue": "Often used by surgeons, it's a pair of tongs or pincers for grasping & pulling", "question": "forceps" },
                        { "clue": "It's a period equal to 2 weeks", "question": "a fortnight" },
                        { "clue": "It's the Portuguese name for Taiwan", "question": "Formosa" },
                        { "clue": "In music, it's the opposite of pianissimo", "question": "fortissimo" },
                        { "clue": "This computer programming language similar to algebra was developed in the 1950s", "question": "Fortran" }
                    ]
                },
                {
                    "title": "PIONEER LIFE",
                    "airDate": "1993-01-29T00:00:00",
                    "comment": "",
                    "clues": [
                        { "clue": "At quilting bees women sewed patchwork together; at these they stripped ears of corn", "question": "husking bees" },
                        { "clue": "Before slates came into use, kids used pieces of this to write on writing boards", "question": "charcoal" },
                        { "clue": "What the Pioneers called \"the shakes\" was actually this insect-transmitted disease", "question": "malaria" },
                        { "clue": "Pioneer women molded tallow into candles & sifted wood ash to make this", "question": "soap" },
                        { "clue": "2-word term for a visiting preacher who traveled to various churchless communities", "question": "circuit rider" }
                    ]
                },
                {
                    "title": "SPORTS",
                    "airDate": "1993-01-29T00:00:00",
                    "comment": "",
                    "clues": [
                        { "clue": "Sadaharu Oh has been called \"the Babe Ruth of\" this country", "question": "Japan" },
                        { "clue": "In the Celtic style of this, holds are allowed above the waist or on the jacket competitors wear", "question": "wrestling" },
                        { "clue": "Most golfers carry 1 of these clubs for sand & 1 for pitching", "question": "a wedge" },
                        { "clue": "In 1952 Dick Button won his second Olympic figure skating gold medal in this Norwegian city", "question": "Oslo" },
                        { "clue": "This Dodger lefty won a second straight Cy Young Award on November 1 & retired on November 18, 1966", "question": "Sandy Koufax" }
                    ]
                },
                {
                    "title": "THEATRES",
                    "airDate": "1993-01-29T00:00:00",
                    "comment": "",
                    "clues": [
                        { "clue": "In 1927 actress Norma Talmadge became the 1st to leave her footprints in cement at this Hollywood theatre", "question": "Grauman's Chinese" },
                        { "clue": "With a seating capacity of 5,874, this New York City theatre is the world's largest indoor movie theatre", "question": "Radio City" },
                        { "clue": "When this Harlem theatre opened in 1913, it was a burlesque hall for whites only", "question": "the Apollo" },
                        { "clue": "On July 22, 1934 this gangster was killed by the FBI in front of Chicago's Biograph Theatre", "question": "Dillinger" },
                        { "clue": "This Nashville auditorium was the site of the first network telecast of the CMA Show in 1968", "question": "Ryman Auditorium" }
                    ]
                }
            ]
        },
        {
            "id": 1,
            "categories": [
                {
                    "title": "ANAGRAMMED DANCERS",
                    "airDate": "2001-10-10T00:00:00",
                    "comment": "",
                    "clues": [
                        { "clue": "An elegant master:\nSEDATE FRIAR", "question": "Fred Astaire" },
                        { "clue": "Former Soviet:\nHI KIROV ASHY INK BALM", "question": "Mikhail Baryshnikov" },
                        { "clue": "Dame seen in Ashton's \"Ondine\":\nMANY FORGOTTEN", "question": "Margot Fonteyn" },
                        { "clue": "He charged in with \"Da Funk\":\nVISA LONG OVER", "question": "Savion Glover" },
                        { "clue": "\"Modern\" choreographer of \"Clytemnestra\":\nRAG AT HARM HAM", "question": "Martha Graham" }
                    ]
                },
                {
                    "title": "DICKENS' WORKS",
                    "airDate": "2001-10-11T00:00:00",
                    "comment": "",
                    "clues": [
                        { "clue": "Character who is \"A squeezing, wrenching, scraping, clutching, covetous old sinner!\"", "question": "Ebenezer Scrooge" },
                        { "clue": "This novel was based in part on Thomas Carlyle's history of the French Revolution", "question": "<i>A Tale of Two Cities</i>" },
                        { "clue": "Dickens' 13th novel, it made its world debut in the USA's Harper's Weekly, which had high hopes for it", "question": "<i>Great Expectations</i>" },
                        { "clue": "Dickens' first installment of this novel was published in April 1870; he died while working on part 6", "question": "<i>The Mystery of Edwin Drood</i>" },
                        { "clue": "The first play from this book, done while the story was still a serial, had a happy ending with Nell still alive", "question": "<i>The Old Curiosity Shop</i>" }
                    ]
                },
                {
                    "title": "BIG SCREEN BOXERS",
                    "airDate": "2001-10-11T00:00:00",
                    "comment": "You have to name the boxer portrayed.",
                    "clues": [
                        { "clue": "Robert De Niro,\n1980", "question": "Jake LaMotta" },
                        { "clue": "Sly Stallone,\n1976", "question": "Rocky Balboa" },
                        { "clue": "Mr. T,\n1982", "question": "Clubber Lang" },
                        { "clue": "Paul Newman,\n1956", "question": "Rocky Graziano" },
                        { "clue": "Marlon Brando,\n1954", "question": "Terry Malloy" }
                    ]
                },
                {
                    "title": "NEWER WORDS & PHRASES",
                    "airDate": "2001-10-11T00:00:00",
                    "comment": "",
                    "clues": [
                        { "clue": "It's a 2-word alliterative term for the aggressive behavior displayed by angry drivers", "question": "road rage" },
                        { "clue": "Often applied to Howard Stern, this rhyming term describes a DJ who's often offensive & controversial", "question": "shock jock" },
                        { "clue": "7-letter synonym listed by the American Heritage Dictionary for African American vernacular English", "question": "ebonics" },
                        { "clue": "This verb meaning to die was further popularized by a 1990 Julia Roberts-Kiefer Sutherland film", "question": "flatline" },
                        { "clue": "From the Latin for \"hear\" & the Greek for \"loving\", it's a CD & stereo equipment buff", "question": "audiophile" }
                    ]
                },
                {
                    "title": "AMERICAN PLAYWRIGHTS",
                    "airDate": "2001-10-12T00:00:00",
                    "comment": "",
                    "clues": [
                        { "clue": "He won a 1991 Pulitzer for his comedy \"Lost in Yonkers\"", "question": "Neil Simon" },
                        { "clue": "\"Our Teeth\" & \"Our Town\" have been subjects for this Wisconsin-born playwright", "question": "Thornton Wilder" },
                        { "clue": "Ira Levin, author of the creepy \"Rosemary's Baby\", wrote the jocular play \"No Time for\" these", "question": "Sergeants" },
                        { "clue": "He wrote \"To the Ladies\" with Marc Connelly & \"The Man Who Came to Dinner\" with Moss Hart", "question": "George S. Kaufman" },
                        { "clue": "David Rabe's next play after his 1982 \"Goose and Tomtom\" was this 1984 chaotic concoction", "question": "<i>Hurlyburly</i>" }
                    ]
                },
                {
                    "title": "AUDREY HEPBURN FILM ROLES",
                    "airDate": "2001-10-12T00:00:00",
                    "comment": "You have to identify the film.",
                    "clues": [
                        { "clue": "Flower girl Eliza Doolittle", "question": "<i>My Fair Lady</i>" },
                        { "clue": "The \"Maid\" of Sherwood Forest", "question": "<i>Robin and Marian</i>" },
                        { "clue": "Sister Luke", "question": "<i>The Nun's Story</i>" },
                        { "clue": "Susy Hendrix, a blind woman", "question": "<i>Wait Until Dark</i>" },
                        { "clue": "Karen Wright, the co-headmistress at a girls' school", "question": "<i>The Children's Hour</i>" }
                    ]
                }
            ]
        }
    ],
    "finalJeffpardyCategory": {
        "title": "OFFICIAL STATE STUFF",
        "airDate": "2018-02-02T00:00:00",
        "comment": "",
        "clues": [
            {
                "clue": "Composers of this state's various official songs include Richard Rodgers & Woody Guthrie",
                "question": "Oklahoma"
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
