"use client";
import Image from "next/image";
import { useRef, useEffect } from "react";
import gsap from "gsap";
import DotGrid from "@/components/DotGrid";
import Link from "next/link";

export default function Home() {
  const paragraphRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      paragraphRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.5 }
    );
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <DotGrid
          dotSize={10}
          gap={15}
          baseColor="#F7FFF5"
          activeColor="#DBEED6"
          proximity={120}
          shockRadius={250}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
        />
      </div>
      <Image src="/eska.svg" height={150} width={150} alt="Logotipo de Eska" />
      <p ref={paragraphRef} className="text-5xl max-w-[60dvw] text-center opacity-0 font-medium text-[#113522]">
        Subasta inversa de credito que rescata a la clase media del limbo crediticio
      </p>
      <Link href="/login">
        <button className="bg-[#DBEED6] text-[#184d31] px-6 py-2 rounded-full font-bold cursor-pointer">Acceder</button>
      </Link>
    </div>
  );
}
