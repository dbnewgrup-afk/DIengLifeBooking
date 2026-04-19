import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login"); // ← benar, tanpa (auth)
}
