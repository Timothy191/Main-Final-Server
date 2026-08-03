import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = 3001
const INDEX_HTML_PATH = path.join(__dirname, 'index.html')

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(INDEX_HTML_PATH, (err, data) => {
      if (err) {
        res.writeHead(500)
        res.end('Error loading index.html')
        return
      }
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(data)
    })
  } else {
    res.writeHead(404)
    res.end('Not found')
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(
    `\x1b[36m[Monitor]\x1b[0m 3D Architecture Monitor running at http://127.0.0.1:${PORT}/`
  )

  // Open the browser automatically
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
