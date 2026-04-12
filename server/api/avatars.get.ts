import { access, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const AVATAR_FILE_PATTERN = /^avt-\d{3}\.svg$/

async function resolveAvatarsDirectory() {
  const candidateDirectories = [
    resolve(process.cwd(), 'public'),
    resolve(process.cwd(), '.output', 'public'),
  ]

  for (const directory of candidateDirectories) {
    try {
      await access(directory)
      return directory
    }
    catch {
      // Try the next candidate directory.
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
