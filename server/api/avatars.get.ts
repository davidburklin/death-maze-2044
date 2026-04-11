import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const AVATAR_FILE_PATTERN = /^avt-\d{3}\.svg$/

export default defineEventHandler(async () => {
  const avatarsDirectory = resolve(process.cwd(), 'public')
  const allFiles = await readdir(avatarsDirectory, { withFileTypes: true })

  const avatars = allFiles
    .filter(entry => entry.isFile() && AVATAR_FILE_PATTERN.test(entry.name))
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b))

  return {
    avatars,
  }
})
