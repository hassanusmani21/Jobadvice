import { redirect } from "next/navigation";

export default function LoginPage() {
  redirect("/admin/login?callbackUrl=%2Fadmin");
}
