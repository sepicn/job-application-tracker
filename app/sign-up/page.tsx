import SignUpForm from "@/components/sign-up-form"
import { isGoogleAuthEnabled } from "@/lib/env"

export default function Page() {
  return <SignUpForm googleEnabled={isGoogleAuthEnabled} />
}
