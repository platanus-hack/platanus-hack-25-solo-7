"use client";

import { useRef } from "react";
import { gsap } from "gsap";

export default function AuctionCard({
    title,
    amount,
    rate,
    currentBid,
    timeLeft,
    riskScore,
    purpose,
    actionLabel = "Ofertar Ahora"
}) {
    const cardRef = useRef(null);

    return (
        <div className="group relative overflow-hidden rounded-2xl bg-white border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            {/* Purpose Section (replaces image) */}
            <div className="h-48 bg-[#113522] p-6 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#A6F096] rounded-full blur-3xl opacity-20"></div>

                <div className="relative z-10">
                    <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-[#A6F096] text-xs font-bold mb-3 border border-white/10">
                        {title}
                    </span>
                    <p className="text-white text-lg font-medium leading-snug line-clamp-3 italic">
                        "{purpose || "Propósito no especificado"}"
                    </p>
                </div>
            </div>

            <div className="p-5">
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">{title}</h3>

                <div className="mt-auto pt-4 flex items-end justify-between border-t border-zinc-100">
                    <div>
                        <p className="text-xs text-zinc-500">{rate ? "Tasa Actual" : "Monto Total"}</p>
                        <p className="text-xl font-bold text-zinc-900">{rate || currentBid || amount}</p>
                    </div>
                    <button className="rounded-lg bg-[#3e6734] px-4 py-2 text-sm font-semibold text-white hover:bg-[#285c40] transition-colors cursor-pointer">
                        {actionLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
