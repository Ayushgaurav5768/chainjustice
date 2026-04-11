import { redirect } from "next/navigation"

export default function LegacyCaseRoute({ params }: { params: { id: string } }) {
  redirect(`/case/${params.id}`)
}
