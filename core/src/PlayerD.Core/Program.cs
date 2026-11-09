var builder = WebApplication.CreateBuilder(args);

var port = builder.Configuration["PLAYERD_HTTP_PORT"] ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

var app = builder.Build();

var version = app.Configuration["PLAYERD_VERSION"] ?? "dev";

app.MapGet("/api/health", () => Results.Ok(new { status = "ok", version }));

// The WebGUI (built React app in wwwroot); unknown paths fall back to
// index.html so client-side routes such as /z/<zone> work.
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapFallbackToFile("index.html");

app.Logger.LogInformation("Player-d core {Version} listening on port {Port}", version, port);

app.Run();

public partial class Program;
