using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Threading.Tasks;
using Microsoft.Azure; // Namespace for Azure Configuration Manager
using Microsoft.Azure.Storage; // Namespace for Storage Client Library
using Microsoft.Azure.Storage.File; // Namespace for Azure Files
using Microsoft.Azure.Services.AppAuthentication;
using Microsoft.Azure.Storage.Auth;

namespace Jeffpardy
{
    public class AzureFilesCategoryLoader
    {
        private static readonly Lazy<AzureFilesCategoryLoader> instance = new Lazy<AzureFilesCategoryLoader>(() => new AzureFilesCategoryLoader());

        public static AzureFilesCategoryLoader Instance
        {
            get
            {
                return instance.Value;
            }
        }

        private readonly CloudFileClient fileClient;

        private AzureFilesCategoryLoader()
        {
            // Old and new way to do this.  Dev box needs the old way still.
            // Need to find a way to store this securely.
            bool useMSI = true;

            if (useMSI)
            {
                var tokenProvider = new AzureServiceTokenProvider();
                string accessToken = tokenProvider.GetAccessTokenAsync("https://jeffpardy.file.core.windows.net").Result;
                var tokenCredentials = new TokenCredential(accessToken);
                var storageCredentials = new StorageCredentials(tokenCredentials);
              
                // Create a CloudFileClient object for credentialed access to Azure Files.
                this.fileClient = new CloudFileClient(new Uri("https://jeffpardy.file.core.windows.net"), storageCredentials);
            }
            else
            {
                CloudStorageAccount storageAccount =
                    CloudStorageAccount.Parse("BlobEndpoint=https://jeffpardy.blob.core.windows.net/;QueueEndpoint=https://jeffpardy.queue.core.windows.net/;FileEndpoint=https://jeffpardy.file.core.windows.net/;TableEndpoint=https://jeffpardy.table.core.windows.net/;SharedAccessSignature=sv=2019-02-02&ss=f&srt=co&sp=rl&se=2020-04-14T15:55:58Z&st=2020-04-10T07:55:58Z&spr=https&sig=MGFKiRXTQ%2FlT2iT4134KOnV7LPq00Ws1SsITagNeQzQ%3D");

                // Create a CloudFileClient object for credentialed access to Azure Files.
                this.fileClient = storageAccount.CreateCloudFileClient();
            }
        }

        public void PopulateSeasonManifest(ISeasonManifestCache seasonManifestCache)
        {
            // Get a reference to the file share we created previously.
            CloudFileShare share = fileClient.GetShareReference("configuration");

            // Ensure that the share exists.
            if (share.Exists())
            {
                // Get a reference to the root directory for the share.
                CloudFileDirectory rootDir = share.GetRootDirectoryReference();

                // Get a reference to the directory we created previously.
                CloudFileDirectory categoriesDir = rootDir.GetDirectoryReference("categories");

                // Ensure that the directory exists.
                if (categoriesDir.Exists())
                {
                    foreach (CloudFileDirectory seasonDirectory in categoriesDir.ListFilesAndDirectories())
                    {
                        CloudFile file = seasonDirectory.GetFileReference("seasonManifest.json");
                        string content = file.DownloadTextAsync().Result;

                        SeasonManifest seasonManifest = JsonConvert.DeserializeObject<SeasonManifest>(content);
                        seasonManifestCache.AddSeason(seasonManifest);

                        Debug.WriteLine("Loaded: {0}", file.Uri);
                    }
                }
            }
        }

        public Category LoadCategory(ManifestCategory manifestCategory)
        {
            Category ret = null;

            // Get a reference to the file share we created previously.
            CloudFileShare share = fileClient.GetShareReference("configuration");

            // Ensure that the share exists.
            if (share.Exists())
            {
                // Get a reference to the root directory for the share.
                CloudFileDirectory rootDir = share.GetRootDirectoryReference();

                // Get a reference to the directory we created previously.
                CloudFileDirectory categoriesDir = rootDir.GetDirectoryReference("categories");
                CloudFileDirectory seasonDir = categoriesDir.GetDirectoryReference(manifestCategory.Season.ToString("000"));
                CloudFile categoryFile = seasonDir.GetFileReference(manifestCategory.FileName);

                // Ensure that the directory exists.
                if (categoryFile.Exists())
                {
                    string content = categoryFile.DownloadTextAsync().Result;
                    ret = JsonConvert.DeserializeObject<Category>(content);
                    Debug.WriteLine("Loaded: {0}", categoryFile.Uri);
                }
            }
            return ret;
        }
    }
}
