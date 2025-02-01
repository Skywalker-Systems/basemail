import { EmailInterface } from "@/components/email.interface"
import { getMail } from "@/utils/schema"

export default async function Page() {
  const emails = await getMail()

  return (
    <section className="h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
      <EmailInterface emails={emails} />
    </section>
  )
}

