import { redirect } from "next/navigation";

export default function SignupRedirect() {
    redirect("/en/auth/signup");
}
