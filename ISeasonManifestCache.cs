using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Jeffpardy
{
    public interface ISeasonManifestCache
    {
        IReadOnlyList<SeasonManifest> SeasonManifestList
        {
            get;
        }

        IReadOnlyList<ManifestCategory> JeopardyCategoryList
        {
            get;
        }

        IReadOnlyList<ManifestCategory> DoubleJeopardyCategoryList
        {
            get;
        }

        IReadOnlyList<ManifestCategory> FinalJeopardyCategoryList
        {
            get;
        }

        void AddSeason(SeasonManifest seasonManifest);
    }
}
