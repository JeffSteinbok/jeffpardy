using System.IO;
using Jeffpardy;
using Jeffpardy.Hubs;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

// In development, wwwroot is at the repository root (two levels up from src/be/)
if (builder.Environment.IsDevelopment())
{
    builder.Environment.WebRootPath = Path.GetFullPath(
        Path.Combine(builder.Environment.ContentRootPath, "..", "..", "wwwroot"));
    builder.Configuration.AddUserSecrets<Program>();
}

builder.Services.AddRazorPages();
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddSingleton<GameCache>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    AzureBlobCategoryLoader.DevMode = true;
    AzureBlobCategoryLoader.DevConnectionString = app.Configuration["BlobConnectionString"];
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

AzureBlobCategoryLoader.Instance.PopulateSeasonManifest(SeasonManifestCache.Instance);

app.Run();
