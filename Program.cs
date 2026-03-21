using Jeffpardy;
using Jeffpardy.Hubs;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment())
{
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
