---
name: agy-plugin-installer
description: Workflow for installing remote plugins/extensions into the Antigravity (agy) CLI.
---

# Antigravity Plugin Installer Skill

Use this skill when tasked with installing plugins (such as `oh-my-antigravity`) into the `agy` CLI on the host environment.

## Installation Procedure

1. **Verify CLI Presence**: Check that the `agy` command is available and retrieve its version:
   ```bash
   which agy && agy --version
   ```

2. **Clone Remote Repository**: Since the `agy plugin install` command expects a local directory as its target, clone the plugin's Git repository to a local temporary path:
   ```bash
   git clone <repository-url> /tmp/<plugin-name-temp>
   ```

3. **Install the Plugin**: Execute the installation pointing to the cloned directory:
   ```bash
   agy plugin install /tmp/<plugin-name-temp>
   ```

4. **Verify Installation**:
   - Check registered plugins:
     ```bash
     agy plugin list
     ```
   - Check that new agents are active:
     ```bash
     agy agents
     ```
