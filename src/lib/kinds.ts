import type { KindFilterValue } from '../components/KindFilter.tsx'
import type { UploadKind } from '../data/types.ts'

/** Keeps the items of the selected types. An empty selection means "All". */
export const filterByKinds = <T extends { kind: UploadKind }>(items: T[], kinds: KindFilterValue): T[] =>
  kinds.length ? items.filter((i) => kinds.includes(i.kind)) : items
