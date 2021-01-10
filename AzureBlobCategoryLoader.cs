using Azure.Identity;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Newtonsoft.Json;
using System;
using System.IO;
using System.Threading.Tasks;

namespace Jeffpardy
{
    public class AzureBlobCategoryLoader
    {
        private static readonly Lazy<AzureBlobCategoryLoader> instance = new Lazy<AzureBlobCategoryLoader>(() => new AzureBlobCategoryLoader());

        public static bool DevMode { get; set; }

        public static string DevConnectionString { get; set; }

        public static AzureBlobCategoryLoader Instance
        {
            get
            {
                return instance.Value;
            }
        }

        private readonly BlobServiceClient blobServiceClient;

        private AzureBlobCategoryLoader()
        {
            if (AzureBlobCategoryLoader.DevMode)
            {
                this.blobServiceClient = new BlobServiceClient(AzureBlobCategoryLoader.DevConnectionString);
            }
            else
            {
                this.blobServiceClient = new BlobServiceClient(new Uri($"https://jeffpardy.blob.core.windows.net"),
                                                               new DefaultAzureCredential());
            }

        }

        public void PopulateSeasonManifest(ISeasonManifestCache seasonManifestCache)
        {
            var categoriesContainerClient = this.blobServiceClient.GetBlobContainerClient("categories");

            foreach (var blobItem in categoriesContainerClient.GetBlobsByHierarchy(BlobTraits.None, BlobStates.None, "/"))
            {
                // This should be the top-level directories...
                if (!blobItem.IsBlob)
                {
                    var seasonManifestClient = categoriesContainerClient.GetBlobClient(blobItem.Prefix + "seasonManifest.json");
                    var seasonManifestDownloadInfo = seasonManifestClient.Download();

                    using (StreamReader sr = new StreamReader(seasonManifestDownloadInfo.Value.Content))
                    {
                        SeasonManifest seasonManifest = JsonConvert.DeserializeObject<SeasonManifest>(sr.ReadToEnd());
                        seasonManifestCache.AddSeason(seasonManifest);
                    }
                }

            }
        }

        public async Task<Category> LoadCategoryAsync(ManifestCategory manifestCategory)
        {
            Category ret = null;

            var categoriesContainerClient = this.blobServiceClient.GetBlobContainerClient("categories");

            var categoryClient = categoriesContainerClient.GetBlobClient(manifestCategory.Season.ToString("000") + "/" + manifestCategory.FileName);
            var categoryDownloadInfo = await categoryClient.DownloadAsync();

            using (StreamReader sr = new StreamReader(categoryDownloadInfo.Value.Content))
            {
                ret = JsonConvert.DeserializeObject<Category>(sr.ReadToEnd());
            }

            return ret;
        }
    }
}
