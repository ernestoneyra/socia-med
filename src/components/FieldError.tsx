import { ExclamationCircleIcon } from '@heroicons/react/24/outline'
import type { Msg } from '../i18n/core.ts'
import { useT } from '../i18n/useT.tsx'

/** Not just colour: the message has an icon and sits right under the field (SC 1.4.1, 3.3.1). */
export default function FieldError({ id, children }: { id: string; children?: Msg | string }) {
  const t = useT()
  if (!children) return null
  return (
    <p id={id} className="mt-1 flex items-start gap-1.5 text-sm font-medium">
      <ExclamationCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>
        <span className="sr-only">{t('common.errorPrefix')}</span>
        {t.msg(children)}
      </span>
    </p>
  )
}
