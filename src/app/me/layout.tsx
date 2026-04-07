import { redirect } from "next/navigation";

export default function MeDisabledLayout() {
  redirect("/jobs");
}
