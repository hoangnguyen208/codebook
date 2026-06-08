using CodeBook.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CodeBook.Api.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(CodeBookDbContext dbContext, string? userId = null)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return;
        }

        var hasExistingData = await dbContext.ItemTypes.AnyAsync()
            || await dbContext.Collections.AnyAsync(c => c.UserId == userId)
            || await dbContext.Items.AnyAsync(i => i.UserId == userId);

        if (hasExistingData)
        {
            return;
        }

        var now = DateTime.UtcNow;

        var itemTypes = new[]
        {
            CreateType("snippet", "Code", "#3b82f6"),
            CreateType("prompt", "Sparkles", "#8b5cf6"),
            CreateType("command", "Terminal", "#f97316"),
            CreateType("note", "StickyNote", "#fde047"),
            CreateType("file", "File", "#6b7280"),
            CreateType("image", "Image", "#ec4899"),
            CreateType("link", "Link", "#10b981")
        };

        var typesByName = itemTypes.ToDictionary(t => t.Name, StringComparer.OrdinalIgnoreCase);

        var collections = new[]
        {
            CreateCollection(userId, "React Patterns", "Reusable React patterns and hooks", now, isFavorite: true),
            CreateCollection(userId, "AI Workflows", "AI prompts and workflow automations", now),
            CreateCollection(userId, "DevOps", "Infrastructure and deployment resources", now, isFavorite: true),
            CreateCollection(userId, "Terminal Commands", "Useful shell commands for everyday development", now),
            CreateCollection(userId, "Design Resources", "UI/UX resources and references", now)
        };

        var collectionsByName = collections.ToDictionary(c => c.Name, StringComparer.OrdinalIgnoreCase);

        var items = new List<Item>
        {
            // React Patterns (3 snippets)
            CreateTextItem(userId,
                typesByName["snippet"].Id,
                collectionsByName["React Patterns"].Id,
                "useDebounce Hook",
                "export function useDebounce<T>(value: T, delay = 300) {\n  const [debounced, setDebounced] = useState(value);\n  useEffect(() => {\n    const id = setTimeout(() => setDebounced(value), delay);\n    return () => clearTimeout(id);\n  }, [value, delay]);\n  return debounced;\n}",
                "typescript",
                now,
                isFavorite: true,
                isPinned: true),
            CreateTextItem(userId,
                typesByName["snippet"].Id,
                collectionsByName["React Patterns"].Id,
                "Context Provider Pattern",
                "type Theme = \"light\" | \"dark\";\nconst ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null);\n\nexport function ThemeProvider({ children }: { children: React.ReactNode }) {\n  const [theme, setTheme] = useState<Theme>(\"light\");\n  const toggle = () => setTheme((t) => (t === \"light\" ? \"dark\" : \"light\"));\n  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;\n}",
                "typescript",
                now),
            CreateTextItem(userId,
                typesByName["snippet"].Id,
                collectionsByName["React Patterns"].Id,
                "Class Name Utility",
                "export function cn(...classes: Array<string | false | null | undefined>) {\n  return classes.filter(Boolean).join(\" \");\n}",
                "typescript",
                now),

            // AI Workflows (3 prompts)
            CreateTextItem(userId,
                typesByName["prompt"].Id,
                collectionsByName["AI Workflows"].Id,
                "Code Review Prompt",
                "Review this pull request for correctness, security, and edge cases. Prioritize actionable feedback and include concrete fixes when possible.",
                null,
                now),
            CreateTextItem(userId,
                typesByName["prompt"].Id,
                collectionsByName["AI Workflows"].Id,
                "Documentation Prompt",
                "Generate developer-facing documentation for this module: purpose, public API, usage examples, and known limitations.",
                null,
                now),
            CreateTextItem(userId,
                typesByName["prompt"].Id,
                collectionsByName["AI Workflows"].Id,
                "Refactoring Prompt",
                "Refactor this code to improve readability and maintainability without changing behavior. Explain major tradeoffs.",
                null,
                now),

            // DevOps (1 snippet, 1 command, 2 links)
            CreateTextItem(userId,
                typesByName["snippet"].Id,
                collectionsByName["DevOps"].Id,
                "GitHub Actions .NET Build",
                "name: ci\non: [push, pull_request]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-dotnet@v4\n        with:\n          dotnet-version: \"10.0.x\"\n      - run: dotnet restore\n      - run: dotnet build --no-restore",
                "yaml",
                now),
            CreateTextItem(userId,
                typesByName["command"].Id,
                collectionsByName["DevOps"].Id,
                "Docker Compose Deploy",
                "docker compose pull && docker compose up -d --remove-orphans",
                "bash",
                now,
                isFavorite: true,
                isPinned: true),
            CreateLinkItem(userId,
                typesByName["link"].Id,
                collectionsByName["DevOps"].Id,
                "Docker Compose docs",
                "https://docs.docker.com/compose/",
                now),
            CreateLinkItem(userId,
                typesByName["link"].Id,
                collectionsByName["DevOps"].Id,
                "GitHub Actions docs",
                "https://docs.github.com/actions",
                now),

            // Terminal Commands (4 commands)
            CreateTextItem(userId,
                typesByName["command"].Id,
                collectionsByName["Terminal Commands"].Id,
                "Git Branch Cleanup",
                "git fetch --prune && git branch --merged | grep -v \"\\*\\|main\\|master\" | xargs -n 1 git branch -d",
                "bash",
                now),
            CreateTextItem(userId,
                typesByName["command"].Id,
                collectionsByName["Terminal Commands"].Id,
                "Docker Log Tail",
                "docker compose logs -f --tail=200 api",
                "bash",
                now),
            CreateTextItem(userId,
                typesByName["command"].Id,
                collectionsByName["Terminal Commands"].Id,
                "Kill Process on Port 3000",
                "lsof -ti :3000 | xargs kill -9",
                "bash",
                now),
            CreateTextItem(userId,
                typesByName["command"].Id,
                collectionsByName["Terminal Commands"].Id,
                "NPM Clean Install",
                "rm -rf node_modules package-lock.json && npm ci",
                "bash",
                now),

            // Design Resources (4 links)
            CreateLinkItem(userId,
                typesByName["link"].Id,
                collectionsByName["Design Resources"].Id,
                "Tailwind CSS",
                "https://tailwindcss.com/docs",
                now,
                isFavorite: true),
            CreateLinkItem(userId,
                typesByName["link"].Id,
                collectionsByName["Design Resources"].Id,
                "shadcn/ui",
                "https://ui.shadcn.com/",
                now),
            CreateLinkItem(userId,
                typesByName["link"].Id,
                collectionsByName["Design Resources"].Id,
                "Material Design",
                "https://m3.material.io/",
                now),
            CreateLinkItem(userId,
                typesByName["link"].Id,
                collectionsByName["Design Resources"].Id,
                "Lucide Icons",
                "https://lucide.dev/icons/",
                now)
        };

        dbContext.ItemTypes.AddRange(itemTypes);
        dbContext.Collections.AddRange(collections);
        dbContext.Items.AddRange(items);

        await dbContext.SaveChangesAsync();
    }

    private static ItemType CreateType(string name, string icon, string color) => new()
    {
        Id = Guid.NewGuid().ToString(),
        Name = name,
        Icon = icon,
        Color = color,
        IsSystem = true
    };

    private static Collection CreateCollection(
        string userId,
        string name,
        string description,
        DateTime now,
        bool isFavorite = false) => new()
    {
        Id = Guid.NewGuid().ToString(),
        UserId = userId,
        Name = name,
        Description = description,
        IsFavorite = isFavorite,
        CreatedAt = now,
        UpdatedAt = now
    };

    private static Item CreateTextItem(
        string userId,
        string typeId,
        string collectionId,
        string title,
        string content,
        string? language,
        DateTime now,
        bool isFavorite = false,
        bool isPinned = false) => new()
    {
        Id = Guid.NewGuid().ToString(),
        Title = title,
        ContentType = "text",
        Content = content,
        Language = language,
        IsFavorite = isFavorite,
        IsPinned = isPinned,
        UserId = userId,
        TypeId = typeId,
        CollectionId = collectionId,
        CreatedAt = now,
        UpdatedAt = now
    };

    private static Item CreateLinkItem(
        string userId,
        string typeId,
        string collectionId,
        string title,
        string url,
        DateTime now,
        bool isFavorite = false,
        bool isPinned = false) => new()
    {
        Id = Guid.NewGuid().ToString(),
        Title = title,
        ContentType = "text",
        Url = url,
        Description = url,
        IsFavorite = isFavorite,
        IsPinned = isPinned,
        UserId = userId,
        TypeId = typeId,
        CollectionId = collectionId,
        CreatedAt = now,
        UpdatedAt = now
    };

}
