using System;
using System.Collections.Generic;
using Xunit;

namespace Jeffpardy.Tests
{
    public class PlayerTests
    {
        [Fact]
        public void Player_SetTeam_ReturnsCorrectTeam()
        {
            var player = new Player { Team = "TeamA" };
            Assert.Equal("TeamA", player.Team);
        }

        [Fact]
        public void Player_SetName_ReturnsCorrectName()
        {
            var player = new Player { Name = "Alice" };
            Assert.Equal("Alice", player.Name);
        }

        [Fact]
        public void Player_SetConnectionId_ReturnsCorrectConnectionId()
        {
            var player = new Player { ConnectionId = "conn-123" };
            Assert.Equal("conn-123", player.ConnectionId);
        }

        [Fact]
        public void Player_AllProperties_SetCorrectly()
        {
            var player = new Player
            {
                Team = "TeamB",
                Name = "Bob",
                ConnectionId = "conn-456"
            };

            Assert.Equal("TeamB", player.Team);
            Assert.Equal("Bob", player.Name);
            Assert.Equal("conn-456", player.ConnectionId);
        }
    }

    public class TeamTests
    {
        [Fact]
        public void Team_SetName_ReturnsCorrectName()
        {
            var team = new Team { Name = "TeamA" };
            Assert.Equal("TeamA", team.Name);
        }

        [Fact]
        public void Team_SetPlayers_ReturnsCorrectList()
        {
            var players = new List<Player>
            {
                new Player { Name = "Alice", Team = "TeamA" },
                new Player { Name = "Bob", Team = "TeamA" }
            };

            var team = new Team { Name = "TeamA", Players = players };

            Assert.Equal(2, team.Players.Count);
            Assert.Equal("Alice", team.Players[0].Name);
            Assert.Equal("Bob", team.Players[1].Name);
        }

        [Fact]
        public void Team_EmptyPlayers_ReturnsEmptyList()
        {
            var team = new Team { Name = "Empty", Players = new List<Player>() };
            Assert.Empty(team.Players);
        }
    }

    public class CategoryClueTests
    {
        [Fact]
        public void CategoryClue_SetClue_ReturnsCorrectClue()
        {
            var clue = new CategoryClue { Clue = "This is a clue" };
            Assert.Equal("This is a clue", clue.Clue);
        }

        [Fact]
        public void CategoryClue_SetQuestion_ReturnsCorrectQuestion()
        {
            var clue = new CategoryClue { Question = "What is a question?" };
            Assert.Equal("What is a question?", clue.Question);
        }
    }

    public class CategoryTests
    {
        [Fact]
        public void Category_SetTitle_ReturnsCorrectTitle()
        {
            var category = new Category { Title = "History" };
            Assert.Equal("History", category.Title);
        }

        [Fact]
        public void Category_SetAirDate_ReturnsCorrectDate()
        {
            var date = new DateTime(2024, 1, 15);
            var category = new Category { AirDate = date };
            Assert.Equal(date, category.AirDate);
        }

        [Fact]
        public void Category_SetComment_ReturnsCorrectComment()
        {
            var category = new Category { Comment = "A comment" };
            Assert.Equal("A comment", category.Comment);
        }

        [Fact]
        public void Category_SetClues_ReturnsCorrectArray()
        {
            var clues = new[]
            {
                new CategoryClue { Clue = "Clue 1", Question = "Q1" },
                new CategoryClue { Clue = "Clue 2", Question = "Q2" }
            };
            var category = new Category { Clues = clues };

            Assert.Equal(2, category.Clues.Length);
            Assert.Equal("Clue 1", category.Clues[0].Clue);
        }
    }

    public class CategoryMetadataTests
    {
        [Fact]
        public void CategoryMetadata_AllProperties_SetCorrectly()
        {
            var date = new DateTime(2024, 3, 10);
            var metadata = new CategoryMetadata
            {
                Title = "Science",
                AirDate = date,
                Season = 40,
                FileName = "science.json",
                Index = 3
            };

            Assert.Equal("Science", metadata.Title);
            Assert.Equal(date, metadata.AirDate);
            Assert.Equal(40, metadata.Season);
            Assert.Equal("science.json", metadata.FileName);
            Assert.Equal(3, metadata.Index);
        }
    }

    public class CategoryCollectionTests
    {
        [Fact]
        public void CategoryCollection_SetId_ReturnsCorrectId()
        {
            var collection = new CategoryCollection { Id = "col-1" };
            Assert.Equal("col-1", collection.Id);
        }

        [Fact]
        public void CategoryCollection_SetCategories_ReturnsCorrectList()
        {
            var categories = new List<Category>
            {
                new Category { Title = "History" },
                new Category { Title = "Science" }
            };

            var collection = new CategoryCollection { Id = "col-1", Categories = categories };

            Assert.Equal(2, collection.Categories.Count);
            Assert.Equal("History", collection.Categories[0].Title);
        }
    }

    public class GameRoundTests
    {
        [Fact]
        public void GameRound_SetId_ReturnsCorrectId()
        {
            var round = new GameRound { Id = 1 };
            Assert.Equal(1, round.Id);
        }

        [Fact]
        public void GameRound_SetCategories_ReturnsCorrectArray()
        {
            var categories = new[]
            {
                new Category { Title = "Round1Cat" }
            };
            var round = new GameRound { Id = 1, Categories = categories };

            Assert.Single(round.Categories);
            Assert.Equal("Round1Cat", round.Categories[0].Title);
        }
    }

    public class GameDataTests
    {
        [Fact]
        public void GameData_SetRounds_ReturnsCorrectArray()
        {
            var rounds = new[]
            {
                new GameRound { Id = 1 },
                new GameRound { Id = 2 }
            };

            var gameData = new GameData { Rounds = rounds };
            Assert.Equal(2, gameData.Rounds.Length);
        }

        [Fact]
        public void GameData_SetFinalJeffpardyCategory_ReturnsCorrectCategory()
        {
            var finalCategory = new Category { Title = "Final Round" };
            var gameData = new GameData { FinalJeffpardyCategory = finalCategory };

            Assert.Equal("Final Round", gameData.FinalJeffpardyCategory.Title);
        }
    }

    public class FinalJeffpardyTeamSettingsTests
    {
        [Fact]
        public void FinalJeffpardyTeamSettings_SetMaxWagerAmount_ReturnsCorrectValue()
        {
            var settings = new FinalJeffpardyTeamSettings { MaxWagerAmount = 5000 };
            Assert.Equal(5000, settings.MaxWagerAmount);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(1000)]
        [InlineData(int.MaxValue)]
        public void FinalJeffpardyTeamSettings_MaxWagerAmount_AcceptsVariousValues(int wager)
        {
            var settings = new FinalJeffpardyTeamSettings { MaxWagerAmount = wager };
            Assert.Equal(wager, settings.MaxWagerAmount);
        }
    }

    public class SeasonManifestTests
    {
        [Fact]
        public void SeasonManifest_SetSeason_ReturnsCorrectValue()
        {
            var manifest = new SeasonManifest { Season = 40 };
            Assert.Equal(40, manifest.Season);
        }

        [Fact]
        public void SeasonManifest_SetEarliestAirDate_ReturnsCorrectDate()
        {
            var date = new DateTime(2023, 9, 1);
            var manifest = new SeasonManifest { EarliestAirDate = date };
            Assert.Equal(date, manifest.EarliestAirDate);
        }

        [Fact]
        public void SeasonManifest_SetCategoryLists_ReturnsCorrectLists()
        {
            var jeopardyCats = new List<ManifestCategory>
            {
                new ManifestCategory { Title = "Cat1" }
            };
            var doubleJeopardyCats = new List<ManifestCategory>
            {
                new ManifestCategory { Title = "Cat2" },
                new ManifestCategory { Title = "Cat3" }
            };
            var finalCats = new List<ManifestCategory>
            {
                new ManifestCategory { Title = "FinalCat" }
            };

            var manifest = new SeasonManifest
            {
                Season = 1,
                JeopardyCategories = jeopardyCats,
                DoubleJeopardyCategories = doubleJeopardyCats,
                FinalJeopardyCategories = finalCats
            };

            Assert.Single(manifest.JeopardyCategories);
            Assert.Equal(2, manifest.DoubleJeopardyCategories.Count);
            Assert.Single(manifest.FinalJeopardyCategories);
        }
    }

    public class ManifestCategoryTests
    {
        [Fact]
        public void ManifestCategory_SetTitle_ReturnsCorrectTitle()
        {
            var cat = new ManifestCategory { Title = "History" };
            Assert.Equal("History", cat.Title);
        }

        [Fact]
        public void ManifestCategory_SetAirDate_ReturnsCorrectDate()
        {
            var date = new DateTime(2024, 5, 20);
            var cat = new ManifestCategory { AirDate = date };
            Assert.Equal(date, cat.AirDate);
        }

        [Fact]
        public void ManifestCategory_SetFileName_ReturnsCorrectFileName()
        {
            var cat = new ManifestCategory { FileName = "history.json" };
            Assert.Equal("history.json", cat.FileName);
        }

        [Fact]
        public void ManifestCategory_SetIndex_ReturnsCorrectIndex()
        {
            var cat = new ManifestCategory { Index = 5 };
            Assert.Equal(5, cat.Index);
        }

        [Fact]
        public void ManifestCategory_SetSeason_ReturnsCorrectSeason()
        {
            var cat = new ManifestCategory { Season = 38 };
            Assert.Equal(38, cat.Season);
        }

        [Fact]
        public void ManifestCategory_AllProperties_SetCorrectly()
        {
            var date = new DateTime(2024, 1, 1);
            var cat = new ManifestCategory
            {
                Title = "Geography",
                AirDate = date,
                FileName = "geo.json",
                Index = 2,
                Season = 35
            };

            Assert.Equal("Geography", cat.Title);
            Assert.Equal(date, cat.AirDate);
            Assert.Equal("geo.json", cat.FileName);
            Assert.Equal(2, cat.Index);
            Assert.Equal(35, cat.Season);
        }
    }

    public class RoundDescriptorTests
    {
        [Fact]
        public void RoundDescriptor_HasJeffpardyValue()
        {
            Assert.Equal(0, (int)RoundDescriptor.Jeffpardy);
        }

        [Fact]
        public void RoundDescriptor_HasSuperJeffpardyValue()
        {
            Assert.Equal(1, (int)RoundDescriptor.SuperJeffpardy);
        }

        [Fact]
        public void RoundDescriptor_HasFinalJeffpardyValue()
        {
            Assert.Equal(2, (int)RoundDescriptor.FinalJeffpardy);
        }

        [Theory]
        [InlineData(RoundDescriptor.Jeffpardy, "Jeffpardy")]
        [InlineData(RoundDescriptor.SuperJeffpardy, "SuperJeffpardy")]
        [InlineData(RoundDescriptor.FinalJeffpardy, "FinalJeffpardy")]
        public void RoundDescriptor_ToString_ReturnsCorrectName(RoundDescriptor value, string expectedName)
        {
            Assert.Equal(expectedName, value.ToString());
        }

        [Fact]
        public void RoundDescriptor_HasExactlyThreeValues()
        {
            var values = Enum.GetValues<RoundDescriptor>();
            Assert.Equal(3, values.Length);
        }
    }
}
