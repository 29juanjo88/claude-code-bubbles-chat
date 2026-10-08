# bubbles

Claude Code plugin (hooks mod) that draws your prompts as right-aligned chat bubbles. Works on top of Glass.

## Install
Add to `~/.claude/settings.json`:

```json
"env": { "CLAUDE_CODE_PLUGIN_DIRS": "/absolute/path/to/claude-code-bubbles-chat" }
```

Options (userConfig): `background` (default `#3d5f86`), `textColor` (default `#ffffff`).

## Test
```
claude plugin validate .
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude plugin test .
```

## Install from the marketplace
```
/plugin marketplace add 29juanjo88/claude-code-bubbles-chat
/plugin install bubbles@bubbles
```
