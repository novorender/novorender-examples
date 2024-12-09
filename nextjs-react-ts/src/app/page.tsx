"use client";

import dynamic from "next/dynamic";

/**
 * Novorender relies on browser-only APIs like window,
 * we need disable server-side rendering for our component.
 */
const Sphere = dynamic(
  () => import('./sphere'),
  { ssr: false }
)

export default function Home() {
  return (
    <main>
      <Sphere />
    </main>
  );
}
