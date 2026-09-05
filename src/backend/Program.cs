using System;
using System.IO;
using Jeffpardy;
using Jeffpardy.Hubs;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Extensions;
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

builder.Services.AddRazorPages();
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddSingleton<ISeasonManifestCache>(SeasonManifestCache.Instance);
builder.Services.AddSingleton<ICategoryLoader>(AzureBlobCategoryLoader.Instance);
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

// Redirect www to the apex domain before anything else runs. Player invitation
// links are built from window.location.origin, so the host must land on the
// canonical host first: iOS universal links don't follow redirects, and only the
// apex is listed in the app's associated domains.
app.Use(async (context, next) =>
{
    var host = context.Request.Host;
    if (host.Host.StartsWith("www.", StringComparison.OrdinalIgnoreCase))
    {
        var apexName = host.Host["www.".Length..];
        var apex = host.Port.HasValue ? new HostString(apexName, host.Port.Value) : new HostString(apexName);
        context.Response.Redirect(
            UriHelper.BuildAbsolute(
                "https",
                apex,
                context.Request.PathBase,
                context.Request.Path,
                context.Request.QueryString),
            permanent: true);
        return;
    }

    await next();
});

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();

app.MapGet(
    "/.well-known/apple-app-site-association",
    () => Results.Text(
        """
        {
          "applinks": {
            "details": [
              {
                "appIDs": ["Y7KVX7666P.net.steinbok.Jeffpardy"],
                "components": [
                  {
                    "/": "/player",
                    "comment": "Open Jeffpardy player invitation links in the iOS app"
                  }
                ]
              }
            ]
          }
        }
        """,
        "application/json"));

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
