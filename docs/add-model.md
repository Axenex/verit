# Add a model veritIDE doesn't know yet

veritIDE resolves model capabilities in this order:

1. **Per-model overrides** in Settings → Models → gear icon on a model
2. **User catalog** at `~/.veritide/capabilities/user-catalog.json`
3. **Remote capability pack** (opt-in in Settings → Privacy)
4. **Bundled catalog** shipped with veritIDE
5. **Heuristic defaults** (32k context, OpenAI-style tools, FIM enabled)

## Quick path: Settings UI

1. Open **veritIDE Settings** → **Models**
2. Add your model under the correct provider (or wait for local auto-detect)
3. Click the **gear** on the model row
4. Use **Chat**, **Coding**, or **Agent** presets, or tune form fields
5. Enable the model for **Chat** (or other features) in the dropdowns

## User catalog JSON

Create `~/.veritide/capabilities/user-catalog.json`:

```json
{
  "capabilitiesSchemaVersion": 1,
  "models": {
    "ollama": {
      "my-custom-model": {
        "contextWindow": 32768,
        "supportsFIM": true,
        "supportsSystemMessage": "system-role",
        "specialToolFormat": "openai-style"
      }
    },
    "openAICompatible": {
      "*": {
        "contextWindow": 32768,
        "supportsFIM": true,
        "specialToolFormat": "openai-style"
      }
    }
  }
}
```

Reload the window or click **Refresh capability catalog** in Settings → Privacy.

## Local Ollama models

1. Ensure Ollama is running (`http://127.0.0.1:11434` by default)
2. Settings → **Local Providers** → use **Pull** on a recommended model, or `ollama pull <name>` in a terminal
3. Models appear automatically when **Auto-detect local providers** is on

## Offline use

With privacy toggles off (default), veritIDE does not fetch capability packs or check for updates. Bundled + user catalog + per-model overrides work fully offline.
