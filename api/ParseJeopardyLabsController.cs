using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using Microsoft.AspNetCore.Mvc;

namespace Jeffpardy.api
{
    [Route("api/parseJeopardyLabs")]
    [ApiController]
    public class ParseJeopardyLabsController : ControllerBase
    {
        [HttpGet]
        public Category[] Parse(string jeopardyLabsGame)
        {
            WebClient client = new WebClient();
            Stream stream = client.OpenRead("https://jeopardylabs.com/play/" + jeopardyLabsGame);
            StreamReader reader = new StreamReader(stream);
            String content = reader.ReadToEnd();

            return parseContent(content).ToArray();
        }

        private List<Category> parseContent(string fileContent)
        {
            string[] content = fileContent.Split('\n');

            List<Category> categoryList = new List<Category>();

            // Using Now as the airdate
            DateTime airDate = DateTime.Now;

            // Get all category names
            var categories = content.Where(c => c.Contains("cell-inner cat-cell")).Select(line =>
            {
                line = this.CleanUpString(line);

                return ExtractBetweenMarkers(line, "<div class=\"cell-inner cat-cell\">", "</div>");
            }).ToList();

            // Find all clues!
            var clues = content.Where(c => c.Contains("front answer")).Select(line =>
            {
                return ExtractBetweenMarkers(line, "<div class=\"front answer\">", "</div>");
            }).ToList();

            // Find all questions!
            var questions = content.Where(c => c.Contains("back question")).Select(line =>
            {
                return ExtractBetweenMarkers(line, "<div class=\"back question\">", "</div>");
            }).ToList();

            // We don't know how many clues we have for these boards...
            // Also, it's just one round.
            for (int categoryIndex = 0; categoryIndex < categories.Count; categoryIndex++)
            {
                Category category = new Category
                {
                    Title = categories[categoryIndex],
                    Comment = string.Empty,
                    AirDate = airDate,
                };

                int cluesInCategory = clues.Count / categories.Count;

                category.Clues = new CategoryQuestion[cluesInCategory];

                // In JeopardyLabs, the order in the file is by row, so we take all the 
                // 100 clues, then 200, etc...
                //
                // So to read a category, we increment by the number of categories each time.
                int overallClueIndex = categoryIndex;
                for (int clueIndex = 0; clueIndex < cluesInCategory; clueIndex++)
                {
                    category.Clues[clueIndex] = new CategoryQuestion
                    {
                        Clue = this.CleanUpString(clues[clueIndex]),
                        Question = this.CleanUpString(questions[clueIndex])
                    };

                    overallClueIndex += categories.Count;
                }

                // Extra check to make sure we have content in all clues in a category before writing.
                if (category.Clues.All(q => q.Clue.Length >= 1) &&
                    category.Clues.All(q => q.Question.Length >= 1))
                {
                    categoryList.Add(category);
                }
            }

            return categoryList;
        }

        private string ExtractBetweenMarkers(string line, string startMarker, string endMarker)
        {
            int index = line.IndexOf(startMarker) + startMarker.Length;
            int endIndex = line.IndexOf(endMarker, index);
            string content;

            if (endIndex > 0)
            {
                content = line.Substring(index, endIndex - index);
            }
            else
            {
                content = line.Substring(index);
            }

            return content.Replace("&amp;", "&")
                          .Replace("\\\\", "\\");
        }

        private string CleanUpString(string input)
        {
            return input.Replace("<br />", "\n")
                        .Replace("\\'", "'")
                        .Replace("&amp;", "&")
                        .Replace("<em class=\"underline\">", "")
                        .Replace("</em>", "")
                        .Replace("&lt;i&gt;", string.Empty)
                        .Replace("&lt;/i&gt;", string.Empty)
                        .Replace("&quot;", "\"")
                        .Replace("\\\\", "\\")
                        .Replace("&apos;", "'")
                        .Replace("\'", "'")
                        .Replace("<p>", "")
                        .Replace("</p>", "");
        }
    }
}