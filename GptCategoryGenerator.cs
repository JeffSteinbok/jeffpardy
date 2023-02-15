using Microsoft.CodeAnalysis.Formatting;
using OpenAI.GPT3.Managers;
using OpenAI.GPT3.ObjectModels.RequestModels;
using OpenAI.GPT3.ObjectModels;
using System;
using OpenAI.GPT3;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.IO;

namespace Jeffpardy
{
    public class GptCategoryGenerator
    {
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

        public async Task<Category> GetCategoryAsync(string topic, string openAIKey)
        {
            string promptFormat = "Generate 5 trivia questions about the topic: {0}." +
                                  "Repsond with JSON in the following format:";

            string promptJsonFormat = @"  {
                                            ""title"": ""<topic>""
                                            ""clues"":
                                            [
                                              {
                                              ""clue"": ""<Question>"",
                                              ""question"": ""<Answer>""
                                              }
                                            ]
                                          }";

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
                parsedCategory = JsonConvert.DeserializeObject<Category>(completionResult.Choices[0].Text);
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
