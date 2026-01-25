# 🤖 Merge Assist CLI

AI-powered merge conflict resolver using GitHub Copilot CLI. Built for the GitHub Copilot Hackathon.

![Version](https://img.shields.io/badge/version-1.0.1-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)

## ✨ Features

- 🔍 **Smart Conflict Detection** - Automatically detect and parse merge conflicts
- 🤖 **AI-Powered Analysis** - Leverage GitHub Copilot for intelligent conflict resolution
- ⚡ **Auto-Resolve** - Automatically resolve conflicts with configurable strategies
- 🎯 **Interactive Mode** - User-friendly interactive CLI for step-by-step resolution
- 📊 **Detailed Analytics** - Confidence scores and risk assessment for each conflict
- 💾 **Safe Operations** - Automatic backups before applying changes
- 🎨 **Beautiful UI** - Colorful output with progress indicators

## 📋 Prerequisites

- Node.js >= 18.x
- Git repository with merge conflicts
- [GitHub CLI](https://cli.github.com/) with Copilot extension (for AI features)

```bash
# Install GitHub CLI and Copilot
gh extension install github/gh-copilot
```

## 🚀 Installation

### Global Installation

```bash
npm install -g merge-assist-cli
```

### Local Development

```bash
git clone https://github.com/ZarakiLancelot/merge-assist-cli.git
cd merge-assist-cli
npm install
npm run build
npm link
```

## 📖 Usage

### Interactive Mode (Recommended)

Simply run without arguments to enter interactive mode:

```bash
merge-assist
```

### Command Line Interface

#### Detect Conflicts

```bash
merge-assist detect [options]

Options:
  -p, --path <path>    Repository path (default: current directory)
  -v, --verbose        Verbose output
```

**Example:**
```bash
merge-assist detect
```

#### Analyze Conflicts

```bash
merge-assist analyze [options]

Options:
  -p, --path <path>    Repository path
  -f, --file <file>    Analyze specific file only
  -v, --verbose        Verbose output
```

**Example:**
```bash
merge-assist analyze --file src/app.ts
```

#### Resolve Conflicts Interactively

```bash
merge-assist resolve [options]

Options:
  -p, --path <path>           Repository path
  -s, --strategy <strategy>   Resolution strategy (current|incoming|both|ai)
  --dry-run                   Preview changes without applying
  --no-backup                 Skip creating backups
  -v, --verbose               Verbose output
```

**Example:**
```bash
merge-assist resolve --strategy ai
```

#### Auto-Resolve Conflicts

```bash
merge-assist auto-resolve [options]

Options:
  -p, --path <path>                Repository path
  -s, --strategy <strategy>        Resolution strategy (default: ai)
  -c, --min-confidence <number>    Minimum confidence threshold 0-100 (default: 70)
  --skip-low-confidence            Skip conflicts below confidence threshold
  --dry-run                        Preview changes without applying
  --no-backup                      Skip creating backups
  -v, --verbose                    Verbose output
```

**Example:**
```bash
merge-assist auto-resolve --strategy ai --min-confidence 80
```

#### Show Status

```bash
merge-assist status [options]

Options:
  -p, --path <path>    Repository path
  -v, --verbose        Verbose output
```

**Example:**
```bash
merge-assist status
```

#### Configuration

```bash
merge-assist config [options]

Options:
  --show              Show current configuration
  --reset             Reset to default configuration
  --set <key=value>   Set a configuration value
```

**Example:**
```bash
merge-assist config --show
merge-assist config --set defaultStrategy=ai
merge-assist config --reset
```

## 🎯 Resolution Strategies

### 1. **AI-Assisted** (Recommended)
Uses GitHub Copilot to intelligently merge both changes while preserving functionality.

```bash
merge-assist resolve --strategy ai
```

### 2. **Keep Current**
Keeps changes from your current branch (HEAD).

```bash
merge-assist resolve --strategy current
```

### 3. **Keep Incoming**
Accepts changes from the incoming branch being merged.

```bash
merge-assist resolve --strategy incoming
```

### 4. **Keep Both**
Combines both changes with a separator comment.

```bash
merge-assist resolve --strategy both
```

## 🏗️ Architecture

The project follows **Clean Architecture** and **SOLID principles**:

```
src/
├── core/
│   ├── domain/          # Entities and interfaces
│   ├── use-cases/       # Business logic
│   └── services/        # Service implementations
├── infrastructure/      # External integrations (Git, AI, Files)
├── lib/
│   ├── strategies/      # Resolution strategies (Strategy Pattern)
│   └── patterns/        # Design patterns (Factory)
├── cli/
│   ├── commands/        # CLI commands
│   ├── interactive/     # Interactive mode
│   └── ui/              # UI components (Logger, Spinner)
└── utils/               # Utilities (Config, Errors, Validators)
```

### Design Patterns Used

- ✅ **Strategy Pattern** - Resolution strategies
- ✅ **Factory Pattern** - Strategy creation
- ✅ **Dependency Injection** - All services
- ✅ **Repository Pattern** - Git data access
- ✅ **Singleton Pattern** - Configuration manager

## 🛠️ Development

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Link Locally

```bash
npm run link
```

### Run Tests

```bash
npm run test:detect
npm run test:analyze
npm run test:resolve
npm run test:status
```

## 📊 Example Output

### Detecting Conflicts

```
🔍 Detecting Merge Conflicts
─────────────────────────────────────────────────

✓ Repository scan complete

📊 Summary
  • Total conflicts: 3
  • Affected files: 2

📄 Conflicts by File
⚠ src/utils/helper.ts (1 conflict)
  45-52: 8 lines
⚠ src/components/Header.tsx (2 conflicts)
  12-18: 7 lines
  89-95: 7 lines

ℹ Run 'merge-assist analyze' to get AI-powered suggestions
```

### Auto-Resolving

```
⚡ Auto-Resolving Merge Conflicts
─────────────────────────────────────────────────

✓ Auto-resolution complete

📊 Resolution Summary
  • Total conflicts: 3
  • Resolved: 2
  • Skipped: 1
  • Failed: 0

✅ Successfully Resolved
✓ ai: Conflict 4f3b2a1c
  • Confidence: 85%
✓ ai: Conflict 7d8e9f0a
  • Confidence: 92%

⏭️  Skipped (Low Confidence)
⚠ src/utils/complex.ts (125-180)

✓ 2 conflicts resolved successfully!
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Edwin Einsen Vásquez Velásquez**

- GitHub: [@ZarakiLancelot](https://github.com/ZarakiLancelot)

## 🙏 Acknowledgments

- Built with [GitHub Copilot CLI](https://github.com/github/gh-copilot)
- Developed for the GitHub Copilot Hackathon
- Inspired by the need for intelligent merge conflict resolution

## 🐛 Known Issues

- AI resolution requires active GitHub Copilot subscription
- Large conflicts (>500 lines) may timeout with AI strategy
- Interactive mode requires terminal with TTY support

## 🔮 Future Improvements

- [ ] Machine learning from user preferences
- [ ] Integration with popular Git clients
- [ ] VSCode extension
- [ ] Conflict visualization dashboard
- [ ] Team collaboration features
- [ ] Advanced conflict pattern detection
- [ ] Multi-language syntax awareness

---

⭐ **Star this repo if you find it useful!**
