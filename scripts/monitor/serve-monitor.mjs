import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = 3001
const INDEX_HTML_PATH = path.join(__dirname, 'index.html')
const REPO_ROOT = path.resolve(__dirname, '..', '..')

const REGISTRIES = {
  agents: [
    { root: '.qoder/agents', surface: 'qoder' },
    { root: '.cursor/agents', surface: 'cursor' },
  ],
  skills: [
    { root: '.qoder/skills', surface: 'qoder' },
    { root: '.cursor/skills', surface: 'cursor' },
  ],
  knowledge: { root: '.agents/knowledge' },
}

function listMarkdown(dir) {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => path.join(dir, e.name))
  } catch {
    return []
  }
}

function listSkillEntrypoints(dir) {
  const out = []
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    if (!e.isDirectory()) continue
    const full = path.join(dir, e.name)
    const skill = path.join(full, 'SKILL.md')
    const readme = path.join(full, 'README.md')
    if (fs.existsSync(skill)) out.push({ file: skill, name: e.name })
    else if (fs.existsSync(readme)) out.push({ file: readme, name: e.name })
  }
  return out
}

function walkKnowledge(dir, base = dir, out = []) {
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walkKnowledge(full, base, out)
    else if (e.isFile() && e.name.endsWith('.md')) {
      const rel = path.relative(base, full).replace(/\.md$/, '')
      if (rel.toLowerCase() === 'readme') continue
      out.push({ file: full, name: rel })
    }
  }
  return out
}

function nodeId(type, surface, name) {
  return surface ? `${type}:${surface}/${name}` : `${type}:${name}`
}

function buildGraph() {
  const nodes = []
  const nodeMap = new Map()
  const edges = []

  const kabs = path.join(REPO_ROOT, REGISTRIES.knowledge.root)
  for (const { file, name } of walkKnowledge(kabs)) {
    const id = nodeId('knowledge', null, name)
    if (nodeMap.has(id)) continue
    const rel = path.relative(REPO_ROOT, file)
    const node = { id, type: 'knowledge', surface: null, name, path: rel, size: 0 }
    try {
      node.size = fs.statSync(file).size
    } catch {
      /* noop */
    }
    nodeMap.set(id, node)
    nodes.push(node)
  }

  for (const { root, surface } of REGISTRIES.agents) {
    const abs = path.join(REPO_ROOT, root)
    for (const file of listMarkdown(abs)) {
      const name = path.basename(file, '.md')
      const id = nodeId('agent', surface, name)
      if (nodeMap.has(id)) continue
      const rel = path.relative(REPO_ROOT, file)
      const node = { id, type: 'agent', surface, name, path: rel, size: 0 }
      try {
        node.size = fs.statSync(file).size
      } catch {
        /* noop */
      }
      nodeMap.set(id, node)
      nodes.push(node)
    }
  }

  for (const { root, surface } of REGISTRIES.skills) {
    const abs = path.join(REPO_ROOT, root)
    for (const { file, name } of listSkillEntrypoints(abs)) {
      const id = nodeId('skill', surface, name)
      if (nodeMap.has(id)) continue
      const rel = path.relative(REPO_ROOT, file)
      const node = { id, type: 'skill', surface, name, path: rel, size: 0 }
      try {
        node.size = fs.statSync(file).size
      } catch {
        /* noop */
      }
      nodeMap.set(id, node)
      nodes.push(node)
    }
  }

  const knowledgeIndex = new Map()
  for (const n of nodes) {
    if (n.type === 'knowledge') knowledgeIndex.set(n.name, n.id)
  }

  for (const n of nodes) {
    if (n.type === 'knowledge') continue
    let body
    try {
      body = fs.readFileSync(path.join(REPO_ROOT, n.path), 'utf8')
    } catch {
      continue
    }
    for (const [kname, kid] of knowledgeIndex) {
      if (kid === n.id) continue
      if (body.includes(kname) || body.includes(`knowledge/${kname}`)) {
        edges.push({ from: n.id, to: kid, kind: 'references' })
      }
    }
    for (const other of nodes) {
      if (other.id === n.id) continue
      if (other.type === 'knowledge') continue
      const token = other.name
      if (token.length < 4) continue
      const re = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`)
      if (re.test(body)) {
        edges.push({ from: n.id, to: other.id, kind: 'invokes' })
      }
    }
  }

  const seen = new Set()
  const dedup = []
  for (const e of edges) {
    const k = `${e.from}|${e.to}|${e.kind}`
    if (seen.has(k)) continue
    seen.add(k)
    dedup.push(e)
  }

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      knowledge: nodes.filter((n) => n.type === 'knowledge').length,
      agents: nodes.filter((n) => n.type === 'agent').length,
      skills: nodes.filter((n) => n.type === 'skill').length,
      edges: dedup.length,
    },
    nodes,
    edges: dedup,
  }
}

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(INDEX_HTML_PATH, (err, data) => {
      if (err) {
        res.writeHead(500)
        res.end('Error loading index.html')
        return
      }
      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store',
      })
      res.end(data)
    })
    return
  }
  if (req.url === '/api/graph') {
    try {
      const graph = buildGraph()
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      })
      res.end(JSON.stringify(graph))
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: String(e?.message || e) }))
    }
    return
  }
  res.writeHead(404)
  res.end('Not found')
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(
    `\x1b[36m[Monitor]\x1b[0m 3D Architecture Monitor running at http://127.0.0.1:${PORT}/`
  )

  const startURL = `http://127.0.0.1:${PORT}`
  let command
  switch (process.platform) {
    case 'darwin':
      command = `open ${startURL}`
      break
    case 'win32':
      command = `start ${startURL}`
      break
    default:
      command = `xdg-open ${startURL}`
      break
  }

  exec(command, (err) => {
    if (err) {
      console.log(
        `\x1b[33m[Monitor]\x1b[0m Could not open browser automatically. Please open ${startURL} manually.`
      )
    }
  })
})
