import PageHeading from '../components/PageHeading.tsx'
import UploadCard from '../components/UploadCard.tsx'
import { uploads } from '../data/uploads.ts'
import { me } from '../data/users.ts'

export default function HomePage() {
  return (
    <>
      <PageHeading
        title={`Hello, ${me.name.split(' ')[0]}`}
        subtitle="Fresh work from the people you follow: photographs, recordings, rides and essays, newest first."
      />
      <div className="grid items-start gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {uploads.map((upload) => (
          <UploadCard key={upload.id} upload={upload} />
        ))}
      </div>
    </>
  )
}
