using System.Threading.Tasks;

namespace Jeffpardy
{
    public interface ICategoryLoader
    {
        Task<Category> LoadCategoryAsync(ManifestCategory manifestCategory);
        Task<Category> LoadCategoryAsync(int season, string fileName, int index);
    }
}
