// src/app/page.tsx
import { permanentRedirect } from "next/navigation";

export default function Home() {
  // redireciona imediatamente (HTTP 308)
  permanentRedirect("/login");
}
