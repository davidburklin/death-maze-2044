const AVATAR_COUNT = 18

export default defineEventHandler(() => {
  const avatars = Array.from(
    { length: AVATAR_COUNT },
    (_, i) => `avt-${String(i + 1).padStart(3, '0')}.svg`,
  )

  return { avatars }
})
