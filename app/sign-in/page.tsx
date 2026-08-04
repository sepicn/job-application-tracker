import SignInForm from "@/components/sign-in-form"
import { isGoogleAuthEnabled } from "@/lib/env"

export default function Page() {
  return <SignInForm googleEnabled={isGoogleAuthEnabled} />
}
