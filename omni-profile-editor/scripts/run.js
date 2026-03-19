// Strips ELECTRON_RUN_AS_NODE before spawning electron-vite.
// Works on Windows (PowerShell/cmd) and Unix (bash/zsh).
const { spawnSync } = require('child_process')

delete process.env.ELECTRON_RUN_AS_NODE

const cmd  = process.argv[2]          // e.g. "dev", "build", "preview"
const result = spawnSync('npx', ['electron-vite', cmd], {
  stdio: 'inherit',
  env: process.env,
  shell: true,   // required on Windows for .cmd wrappers
})
process.exit(result.status ?? 1)
