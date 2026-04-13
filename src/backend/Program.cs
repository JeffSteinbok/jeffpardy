using System;
using System.IO;
using Jeffpardy;
using Jeffpardy.Hubs;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

// wwwroot is at the repository root (two levels up from src/backend/)
var repoRoot = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", ".."));
var webRootPath = Path.Combine(repoRoot, "wwwroot");

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    WebRootPath = Directory.Exists(webRootPath) ? webRootPath : null
});

if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddUserSecrets<Program>();

    // Set DevMode before AzureBlobCategoryLoader.Instance is accessed,
    // so the singleton constructor uses the connection string instead of DefaultAzureCredential.
    AzureBlobCategoryLoader.DevMode = true;
    AzureBlobCategoryLoader.DevConnectionString = builder.Configuration["BlobConnectionString"];
}
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddSingleton<ISeasonManifestCache>(SeasonManifestCache.Instance);
builder.Services.AddSingleton<ICategoryLoader>(AzureBlobCategoryLoader.Instance);
builder.Services.AddSingleton<IUsedCategoryTracker>(AzureBlobUsedCategoryTracker.Instance);
builder.Services.AddSingleton<GameCache>();
builder.Services.AddScoped<AccessCodeFilter>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();

app.MapRazorPages();
app.MapControllers();
app.MapHub<GameHub>("/hub/game");

try
{
    AzureBlobCategoryLoader.Instance.PopulateSeasonManifest(SeasonManifestCache.Instance);
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Failed to populate season manifest from Azure Blob Storage. The server will start with no categories loaded.");
}

app.Run();
