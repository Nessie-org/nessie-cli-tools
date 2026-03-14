# @nessie-org/cli

> 🐉 Nessie — Python platform project manager

## Requirements

- Node.js 18+
- Python 3.10+
- Git

## Installation

```bash
npm install -g @nessie-org/cli
```

To uninstall:

```bash
npm uninstall -g @nessie-org/cli
```

---

## Commands

### `nessie setup <folder>`

Initializes a new Nessie project in the specified folder.

- Creates project directories (`core/`, `nessie_plugins/`, `my_plugins/`, `.venv/`)
- Creates a Python virtual environment
- Clones and installs `nessie-api` and `nessie-platform` from GitHub into `core/`
- TUI to select which plugins to clone and install into `nessie_plugins/` (all selected by default)

```bash
nessie setup my-project
```

Generated structure:

```
my-project/
├── .nessie/
│   └── meta.json
├── .venv/
├── core/
│   ├── nessie-api/
│   └── nessie-platform/
├── nessie_plugins/
├── my_plugins/
└── .gitignore
```

---

### `nessie start [server]`

Clones the server project (if it doesn't already exist) and starts it. If no server is specified, an interactive TUI selector is shown.

```bash
nessie start           # TUI selector
nessie start fastapi   # skip TUI
```

---

### `nessie new <plugin_name>`

Scaffolds a new plugin in `my_plugins/` using templates fetched from `github.com/Nessie-org/nessie-templates`. Templates are cached in `~/.nessie/templates` and auto-updated on each run. An interactive TUI lets you select the plugin type.

```bash
nessie new my-auth-plugin
```

Generated structure:

```
my_plugins/
└── my-auth-plugin/
    ├── my_auth_plugin/
    │   ├── __init__.py
    │   └── plugin.py
    ├── setup.py
    └── README.md
```

Template placeholders replaced at scaffold time:

| Placeholder | Example |
|---|---|
| `{{plugin_name}}` | `my-auth-plugin` |
| `{{python_plugin_name}}` | `my_auth_plugin` |

---

### `nessie list`

Lists all plugins — both available on disk and installed in the venv.

```bash
nessie list
```

```
🔌 Nessie Plugins

nessie_plugins/
  nessie-auth      [installed]
  nessie-cache     [not installed]

my_plugins/
  my-auth-plugin   [not installed]
```

---

### `nessie install <plugin_name>`

Installs a plugin using `pip install -e`. Checks `my_plugins/` first, then `nessie_plugins/`.

```bash
nessie install my-auth-plugin
nessie install nessie-auth
```

---

### `nessie remove <plugin_name>`

Uninstalls an installed plugin from the venv.

```bash
nessie remove my-auth-plugin
```

---

### `nessie download <github_repo_url>`

Downloads a plugin from GitHub. URLs from `github.com/Nessie-org` go into `nessie_plugins/`, everything else goes into `my_plugins/`.

```bash
# Official plugin → nessie_plugins/
nessie download https://github.com/Nessie-org/nessie-auth

# Third-party plugin → my_plugins/
nessie download https://github.com/someone/cool-plugin
```

---

### `nessie help`

Prints all available commands, servers, and plugin types.

```bash
nessie help
```