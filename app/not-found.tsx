import Link from "next/link";
import { Header, Footer } from "@/components/ui";
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="not-found">
        <h1>This route is outside the map.</h1>
        <p>Head back to Accord or open the policy workbench.</p>
        <Link href="/" className="button">
          Back to Accord
        </Link>
      </main>
      <Footer />
    </>
  );
}
