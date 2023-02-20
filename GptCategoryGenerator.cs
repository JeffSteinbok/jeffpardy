using Microsoft.CodeAnalysis.Formatting;
using OpenAI.GPT3.Managers;
using OpenAI.GPT3.ObjectModels.RequestModels;
using OpenAI.GPT3.ObjectModels;
using System;
using OpenAI.GPT3;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.IO;
using Newtonsoft.Json.Linq;
using System.Linq;

namespace Jeffpardy
{
    public class GptCategoryGenerator
    {
        class GptQuestionCompletion
        {
            public string Question {  get; set; }  
            public string Answer { get; set; }  
        };

        class GtpCategoryCompletion
        {
            public string Topic { get; set; }

            public GptQuestionCompletion[] Clues { get; set; }
        };

        private static readonly Lazy<GptCategoryGenerator> instance = new Lazy<GptCategoryGenerator>(() => new GptCategoryGenerator());
        public OpenAIService OpenAIServiceInstance { get; private set; }

        public static GptCategoryGenerator Instance
        {
            get
            {
                return instance.Value;
            }
        }

        private GptCategoryGenerator()
        {

        }

        public async Task<Category> GetCategoryFromTopicAsync(string topic, string openAIKey)
        {
            string promptFormat = "Generate 5 trivia questions about the topic: {0}\n" +
                                  "Repsond with JSON in the following format: ";

            string promptJsonFormat = @"[{""question"": ""<Question>"", ""answer"": ""<Answer>"" } ]";

            var openAIServiceInstance = new OpenAIService(new OpenAiOptions()
            {
                ApiKey = openAIKey
            });

            var completionResult = await openAIServiceInstance.Completions.CreateCompletion(new CompletionCreateRequest()
            {
                Prompt = string.Format(promptFormat, topic) + "\n" + promptJsonFormat,
                Model = Models.TextDavinciV3,
                MaxTokens = 1024,
                N = 1
            });

            Category parsedCategory = null;

            if (completionResult.Successful)
            {
                var parsedCompletion = JsonConvert.DeserializeObject<GptQuestionCompletion[]>(completionResult.Choices[0].Text);
                parsedCategory = new Category()
                {
                    Title = topic,
                    AirDate = DateTime.Now,
                    Clues = parsedCompletion.Select(q => new CategoryClue()
                    {
                        Clue = q.Question,
                        Question = q.Answer
                    }).ToArray()
                };
            }
            else
            {
                if (completionResult.Error == null)
                {
                    throw new Exception("Unknown Error");
                }
                Console.WriteLine($"{completionResult.Error.Code}: {completionResult.Error.Message}");
            }

            return parsedCategory;
        }

        public async Task<Category> GetCategoryFromTextBlockAsync(string textBlock, string openAIKey)
        {
            string promptFormat = "Generate 5 trivia questions about the following block of text \n" +
                                  "Repsond with JSON in the following format: ";

            string promptJsonFormat = @"{ ""topic"": ""<topic>"", ""clues"" : [{""question"": ""<Question>"", ""answer"": ""<Answer>"" } ]";

            var openAIServiceInstance = new OpenAIService(new OpenAiOptions()
            {
                ApiKey = openAIKey
            });

            var completionResult = await openAIServiceInstance.Completions.CreateCompletion(new CompletionCreateRequest()
            {
                Prompt = string.Format(promptFormat) + "\n" + promptJsonFormat + "\n" + textBlock,
                Model = Models.TextDavinciV3,
                MaxTokens = 1024,
                N = 1
            });

            Category parsedCategory = null;

            if (completionResult.Successful)
            {
                var parsedCompletion = JsonConvert.DeserializeObject<GtpCategoryCompletion>(completionResult.Choices[0].Text);
                parsedCategory = new Category()
                {
                    Title = parsedCompletion.Topic,
                    AirDate = DateTime.Now,
                    Clues = parsedCompletion.Clues.Select(q => new CategoryClue()
                    {
                        Clue = q.Question,
                        Question = q.Answer
                    }).ToArray()
                };
            }
            else
            {
                if (completionResult.Error == null)
                {
                    throw new Exception("Unknown Error");
                }
                Console.WriteLine($"{completionResult.Error.Code}: {completionResult.Error.Message}");
            }

            return parsedCategory;
        }
    }
}
