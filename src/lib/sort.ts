export type SortValue = 'latest' | 'oldest' | 'last10days'

const TEN_DAYS = 10 * 86_400_000

/** "Latest" and "Last 10 days" are newest first; "Oldest" is oldest first. */
export function sortByDate<T extends { createdAt: string }>(
  items: T[],
  sort: SortValue,
  now: Date = new Date(),
): T[] {
  const time = (i: T) => new Date(i.createdAt).getTime()
  const kept = sort === 'last10days' ? items.filter((i) => now.getTime() - time(i) <= TEN_DAYS) : items
  return [...kept].sort((a, b) => (sort === 'oldest' ? time(a) - time(b) : time(b) - time(a)))
}
