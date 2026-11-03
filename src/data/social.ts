import * as api from './api.ts'
import type { PostInput } from './postRules.ts'
import { persist, updateData, type Core } from './store.ts'
import type { Upload } from './types.ts'

/** Likes, follows and new posts. Likes and follows change on screen straight away and are saved in the background. */

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

/**
 * Unlike a like, a new post is only shown once the server has saved it, so the form can stay
 * open with an error if saving fails. Resolves to the saved post, or undefined if it failed.
 */
export async function createPost(post: PostInput, file?: File): Promise<Upload | undefined> {
  const saved = await persist(async () => {
    // The file goes first; the post then points at where the server stored it.
    const media = file ? await api.uploadMedia(file) : undefined
    return api.createUpload({
      id: crypto.randomUUID(),
      seed: Math.floor(Math.random() * 1_000_000),
      kind: post.kind,
      title: post.title.trim(),
      caption: post.caption.trim(),
      tags: post.tags,
      ...(post.duration ? { duration: post.duration } : {}),
      ...(media ? { mediaUrl: media.url } : {}),
    })
  })
  if (saved) {
    updateData((core) =>
      core.uploads.some((u) => u.id === saved.id) ? core : { ...core, uploads: [saved, ...core.uploads] },
    )
  }
  return saved
}

/** Saves new text for one of your own posts. Resolves to true if the server kept it. */
export async function updatePost(id: string, change: Pick<PostInput, 'title' | 'caption' | 'tags'>): Promise<boolean> {
  const saved = await persist(() =>
    api.updateUpload(id, { title: change.title.trim(), caption: change.caption.trim(), tags: change.tags }),
  )
  if (!saved) return false
  updateData((core) =>
    mapUpload(core, id, (u) => ({ ...u, title: saved.title, caption: saved.caption, tags: saved.tags })),
  )
  return true
}

/** Removes one of your own posts, along with its likes and the notifications about it. */
export async function deletePost(id: string): Promise<boolean> {
  const done = await persist(async () => {
    await api.deleteUpload(id)
    return true
  })
  if (!done) return false
  updateData((core) => ({
    ...core,
    uploads: core.uploads.filter((u) => u.id !== id),
    notifications: core.notifications.filter((n) => n.uploadId !== id),
  }))
  return true
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
