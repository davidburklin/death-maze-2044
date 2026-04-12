import { access, readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const AVATAR_FILE_PATTERN = /^avt-\d{3}\.svg$/

async function resolveAvatarsDirectory(): Promise<string | null> {
  const startDirectories = [
    dirname(fileURLToPath(import.meta.url)),
    process.cwd(),
  ]

  for (const startDir of startDirectories) {
    let dir = startDir
    for (let depth = 0; depth < 10; depth++) {
      const candidate = resolve(dir, 'public')
      try {
        await access(candidate)
        return candidate
      }
      catch {
        // Continue searching up the directory tree.
      }
      const parent = dirname(dir)
      if (parent === dir) break
      dir = parent
    }
  }

  return null
}

export default defineEventHandler(async () => {
  const avatarsDirectory = await resolveAvatarsDirectory()

  if (!avatarsDirectory) {
    return {
      avatars: [],
    }
  }
  const allFiles = await readdir(avatarsDirectory, { withFileTypes: true })

  const avatars = allFiles
    .filter(entry => entry.isFile() && AVATAR_FILE_PATTERN.test(entry.name))
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b))

  return {
    avatars,
  }
})
