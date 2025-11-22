import Image from "next/image";
import { F22Form } from "@/components/f22-form";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <F22Form />
    </main>
  );
}
