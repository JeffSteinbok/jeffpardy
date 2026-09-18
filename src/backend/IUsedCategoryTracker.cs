using System.Collections.Generic;
using System.Threading.Tasks;

namespace Jeffpardy
{
    public interface IUsedCategoryTracker
    {
        /// <summary>
        /// Returns the set of unique keys for categories that have been used in completed games.
        /// Keys are in the format "{season}/{fileName}/{index}".
        /// </summary>
        Task<IReadOnlySet<string>> GetUsedCategoryKeysAsync();

        /// <summary>
        /// Records the given category keys as used after a completed game.
        /// Keys are in the format "{season}/{fileName}/{index}".
        /// </summary>
        Task RecordUsedCategoriesAsync(IEnumerable<string> categoryKeys);
    }
}
