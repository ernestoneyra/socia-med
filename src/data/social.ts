import * as api from './api.ts'
import { persist, updateData, type Core } from './store.ts'

/** Likes and follows. Both change on screen straight away and are saved in the background. */

const mapUpload = (core: Core, id: string, change: (u: Core['uploads'][number]) => Core['uploads'][number]): Core => ({
  ...core,
  uploads: core.uploads.map((u) => (u.id === id ? change(u) : u)),
})

export function setLiked(uploadId: string, liked: boolean) {
  let changed = false
  updateData((core) => {
    const upload = core.uploads.find((u) => u.id === uploadId)
    if (!upload || upload.likedByMe === liked) return core
    changed = true
    return mapUpload(core, uploadId, (u) => ({ ...u, likedByMe: liked, likes: Math.max(0, u.likes + (liked ? 1 : -1)) }))
  })
  if (!changed) return
  void persist(() => api.setLiked(uploadId, liked)).then((saved) => {
    if (!saved) return
    // Take the server's count, unless the person has pressed the button again since.
    updateData((core) =>
      core.uploads.find((u) => u.id === uploadId)?.likedByMe === saved.liked
        ? mapUpload(core, uploadId, (u) => ({ ...u, likes: saved.likes }))
        : core,
    )
  })
}

export function setFollowing(userId: string, following: boolean) {
  let changed = false
  updateData((core) => {
    const user = core.users.find((u) => u.id === userId)
    if (!user || userId === core.meId || user.followedByMe === following) return core
    changed = true
    const delta = following ? 1 : -1
    return {
      ...core,
      users: core.users.map((u) => {
        if (u.id === userId) return { ...u, followedByMe: following, followers: Math.max(0, u.followers + delta) }
        if (u.id === core.meId) return { ...u, following: Math.max(0, u.following + delta) }
        return u
      }),
    }
  })
  if (!changed) return
  void persist(() => api.setFollowing(userId, following)).then((saved) => {
    if (!saved) return
    updateData((core) =>
      core.users.find((u) => u.id === userId)?.followedByMe === saved.following
        ? { ...core, users: core.users.map((u) => (u.id === userId ? { ...u, followers: saved.followers } : u)) }
        : core,
    )
  })
}
