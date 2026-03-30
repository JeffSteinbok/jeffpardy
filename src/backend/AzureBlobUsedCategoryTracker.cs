using Azure.Identity;
using Azure.Storage.Blobs;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Jeffpardy
{
    public class AzureBlobUsedCategoryTracker : IUsedCategoryTracker
    {
        private static readonly Lazy<AzureBlobUsedCategoryTracker> instance =
            new Lazy<AzureBlobUsedCategoryTracker>(() => new AzureBlobUsedCategoryTracker());

        public static AzureBlobUsedCategoryTracker Instance => instance.Value;

        private readonly BlobServiceClient blobServiceClient;

        private HashSet<string> cachedKeys;
        private readonly SemaphoreSlim _lock = new SemaphoreSlim(1, 1);

        private const string ContainerName = "categories-v2";
        private const string BlobName = "usedCategories.json";

        private AzureBlobUsedCategoryTracker()
        {
            if (AzureBlobCategoryLoader.DevMode)
            {
                this.blobServiceClient = new BlobServiceClient(AzureBlobCategoryLoader.DevConnectionString);
            }
            else
            {
                this.blobServiceClient = new BlobServiceClient(
                    new Uri("https://jeffpardy.blob.core.windows.net"),
                    new DefaultAzureCredential());
            }
        }

        public async Task<IReadOnlySet<string>> GetUsedCategoryKeysAsync()
        {
            if (cachedKeys != null)
            {
                return cachedKeys;
            }

            await _lock.WaitAsync();
            try
            {
                if (cachedKeys == null)
                {
                    cachedKeys = await LoadFromBlobAsync();
                }

                return cachedKeys;
            }
            finally
            {
                _lock.Release();
            }
        }

        public async Task RecordUsedCategoriesAsync(IEnumerable<string> categoryKeys)
        {
            await _lock.WaitAsync();
            try
            {
                if (cachedKeys == null)
                {
                    cachedKeys = await LoadFromBlobAsync();
                }

                foreach (var key in categoryKeys)
                {
                    cachedKeys.Add(key);
                }

                await SaveToBlobAsync(cachedKeys);
            }
            finally
            {
                _lock.Release();
            }
        }

        private async Task<HashSet<string>> LoadFromBlobAsync()
        {
            var containerClient = blobServiceClient.GetBlobContainerClient(ContainerName);
            var blobClient = containerClient.GetBlobClient(BlobName);

            if (!await blobClient.ExistsAsync())
            {
                return new HashSet<string>();
            }

            var downloadInfo = await blobClient.DownloadAsync();
            using var sr = new StreamReader(downloadInfo.Value.Content);
            var json = await sr.ReadToEndAsync();
            var keys = JsonConvert.DeserializeObject<List<string>>(json) ?? new List<string>();
            return new HashSet<string>(keys);
        }

        private async Task SaveToBlobAsync(HashSet<string> keys)
        {
            var containerClient = blobServiceClient.GetBlobContainerClient(ContainerName);
            var blobClient = containerClient.GetBlobClient(BlobName);

            var json = JsonConvert.SerializeObject(keys.ToList());
            using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(json));
            await blobClient.UploadAsync(stream, overwrite: true);
        }
    }
}
