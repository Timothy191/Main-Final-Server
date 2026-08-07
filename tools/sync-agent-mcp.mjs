import fs from 'fs'
import path from 'path'

const ROOT_MCP_PATH = path.resolve('.mcp.json')
const GLOBAL_STORAGE_DIR = '/home/timothy/.config/Antigravity IDE/User/globalStorage'

const TARGET_FILENAMES = [
  'cline_mcp_settings.json',
  'mcp_settings.json',
  'blackbox_mcp_settings.json'
]

async function run() {
  if (!fs.existsSync(ROOT_MCP_PATH)) {
    console.error(`Error: Root .mcp.json not found at ${ROOT_MCP_PATH}`)
    process.exit(1)
  }

  // Load root MCP configurations
  const rootMcp = JSON.parse(fs.readFileSync(ROOT_MCP_PATH, 'utf8'))
  const workspaceServers = rootMcp.mcpServers || {}

  if (Object.keys(workspaceServers).length === 0) {
    console.log('No MCP servers defined in root .mcp.json. Exiting.')
    return
  }

  console.log(`Loaded ${Object.keys(workspaceServers).length} servers from workspace .mcp.json:`)
  for (const name of Object.keys(workspaceServers)) {
    console.log(` - ${name}`)
  }

  if (!fs.existsSync(GLOBAL_STORAGE_DIR)) {
    console.log(`Global storage directory not found: ${GLOBAL_STORAGE_DIR}. Skipping global settings sync.`)
    return
  }

  // Search recursively for target config files in globalStorage
  const filesToSync = []
  function findConfigs(dir) {
    let list
    try {
      list = fs.readdirSync(dir)
    } catch {
      return
    }

    for (const file of list) {
      const fullPath = path.join(dir, file)
      let stat
      try {
        stat = fs.statSync(fullPath)
      } catch {
        continue
      }

      if (stat.isDirectory()) {
        findConfigs(fullPath)
      } else if (TARGET_FILENAMES.includes(file)) {
        filesToSync.push(fullPath)
      }
    }
  }

  findConfigs(GLOBAL_STORAGE_DIR)

  if (filesToSync.length === 0) {
    console.log('No active agent settings files detected in global storage.')
    return
  }

  console.log(`Found ${filesToSync.length} agent settings files to synchronize:`)
  for (const file of filesToSync) {
    console.log(` - ${path.relative(GLOBAL_STORAGE_DIR, file)}`)
    try {
      const content = fs.readFileSync(file, 'utf8')
      const config = JSON.parse(content || '{}')
      config.mcpServers = config.mcpServers || {}

      // Merge workspace servers
      let mergedCount = 0
      for (const [name, value] of Object.entries(workspaceServers)) {
        config.mcpServers[name] = value
        mergedCount++
      }

      fs.writeFileSync(file, JSON.stringify(config, null, 2), 'utf8')
      console.log(`   ✓ Successfully merged ${mergedCount} servers into settings file.`)
    } catch (err) {
      console.error(`   ✗ Failed to sync settings file: ${err.message}`)
    }
  }

  console.log('✓ Synchronization complete.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
