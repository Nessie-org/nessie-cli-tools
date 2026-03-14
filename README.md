# @nessie/cli

> 🐉 Nessie project management CLI — TypeScript, Node.js 18+

## Installation

```bash
npm install -g @nessie/cli
```

Or with npx (no install):

```bash
npx @nessie/cli <command>
```

---

## Commands

### `nessie setup <folder>`

Initializes a new Nessie project in the specified folder.

- Creates the project folder and subdirectories (`nessie_plugins/`, `my_plugins/`, `.venv/`)
- Creates a Python virtual environment
- Installs `nessie-api` and `nessie-platform` into the venv
- Launches an interactive TUI to select which official plugins to clone into `nessie_plugins/`
- Writes a `.nessie/meta.json` marker file and a `.gitignore`

```bash
nessie setup my-project
```

---

### `nessie start <server>`

Clones the server project (if it doesn't already exist) and starts it.

Available servers are defined in `src/config/nessie.config.json`.

```bash
nessie start fastapi
nessie start flask
nessie start django
```

---

### `nessie plugin new <plugin_name>`

Scaffolds a new plugin in the `my_plugins/` folder with an interactive TUI to select the plugin type.

**Plugin types:** `service`, `middleware`, `handler`, `storage`, `auth`

```bash
nessie plugin new my-awesome-plugin
```

Generated structure:

```
my_plugins/
└── my-awesome-plugin/
    ├── my_awesome_plugin/
    │   ├── __init__.py
    │   └── plugin.py
    ├── setup.py
    └── README.md
```

---

### `nessie plugin list`

Lists all plugins — both available (on disk) and installed (in the venv).

```bash
nessie plugin list
```

Output example:

```
🔌 Nessie Plugins

nessie_plugins/
  nessie-auth      [installed]
  nessie-cache     [not installed]

my_plugins/
  my-awesome-plugin  [not installed]
```

---

### `nessie plugin install <plugin_name>`

Installs a plugin using `pip install -e <path>`.

1. Checks `my_plugins/` first
2. Falls back to `nessie_plugins/`
3. Errors if not found in either

```bash
nessie plugin install my-awesome-plugin
nessie plugin install nessie-auth
```

---

### `nessie plugin remove <plugin_name>`

Uninstalls an installed plugin from the venv.

```bash
nessie plugin remove my-awesome-plugin
```

---

### `nessie plugin download <github_repo_url>`

Clones a plugin from GitHub.

- URLs from `github.com/Nessie-org` → cloned into `nessie_plugins/`
- All other URLs → cloned into `my_plugins/`

```bash
# Official plugin → goes to nessie_plugins/
nessie plugin download https://github.com/Nessie-org/nessie-auth

# Third-party plugin → goes to my_plugins/
nessie plugin download https://github.com/someone/cool-plugin
```

---

## Development

```bash
# Install dependencies
npm install

# Run in dev mode (no build required)
npm run dev -- setup my-project

# Build
npm run build

# Run built CLI
node dist/index.js setup my-project
```

---

## Configuration

All plugins, servers, and plugin types are defined in:

```
src/config/nessie.config.json
```

You can add new plugins, servers, or plugin types by editing this file and rebuilding.

---

## Project Structure

```
src/
├── index.ts                  # CLI entry point (Commander wiring)
├── config/
│   └── nessie.config.json    # Plugins, servers, plugin types registry
├── commands/
│   ├── setup.ts              # nessie setup
│   ├── start.ts              # nessie start
│   └── plugin/
│       ├── new.ts            # nessie plugin new
│       ├── list.ts           # nessie plugin list
│       ├── install.ts        # nessie plugin install
│       ├── remove.ts         # nessie plugin remove
│       └── download.ts       # nessie plugin download
├── utils/
│   ├── config.ts             # Config loader
│   ├── git.ts                # Git clone helpers
│   ├── logger.ts             # Chalk-based logger
│   ├── project.ts            # Project root detection
│   └── python.ts             # Venv / pip / python helpers
└── types/
    └── index.ts              # Shared TypeScript types
```
