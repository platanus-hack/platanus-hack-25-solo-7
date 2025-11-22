"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap } from "gsap";

export default function AuctionCard({ title, currentBid, timeLeft, imageUrl }) {
    const cardRef = useRef(null);
    const imageRef = useRef(null);

    const handleMouseEnter = () => {
        gsap.to(cardRef.current, {
            y: -8,
            duration: 0.3,
            ease: "power2.out"
        });
        gsap.to(imageRef.current, {
            scale: 1.05,
            duration: 0.5,
            ease: "power2.out"
        });
    };

    const handleMouseLeave = () => {
        gsap.to(cardRef.current, {
            y: 0,
            duration: 0.3,
            ease: "power2.out"
        });
        gsap.to(imageRef.current, {
            scale: 1,
            duration: 0.5,
            ease: "power2.out"
        });
    };
    return (
        <div ref={cardRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-zinc-200 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="relative aspect-4/3 w-full overflow-hidden ">
                {/* Placeholder for image if not provided, or use next/image if URL is valid */}
                <div ref={imageRef} className="absolute inset-0 flex items-center justify-center text-zinc-400 bg-zinc-100">
                    {/* In a real app, we'd use Image component here. Using a colored div for now if no image. */}
                    <div className="w-full h-full bg-linear-to-br from-zinc-100 to-zinc-200" />
                </div>
                <div className="absolute top-3 right-3 rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-xs font-medium text-zinc-900 border border-zinc-200 shadow-sm">
                    {timeLeft}
                </div>
            </div>

            <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">{title}</h3>

                <div className="mt-auto pt-4 flex items-end justify-between border-t border-zinc-100">
                    <div>
                        <p className="text-xs text-zinc-500">Oferta Actual</p>
                        <p className="text-xl font-bold text-zinc-900">{currentBid}</p>
                    </div>
                    <button className="rounded-lg bg-[#3e6734] px-4 py-2 text-sm font-semibold text-white hover:bg-[#285c40] transition-colors cursor-pointer">
                        Ofertar Ahora
                    </button>
                </div>
            </div>
        </div>
    );
}
