"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { gsap } from "gsap";

export default function SolicitarCreditoPage() {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const [amount, setAmount] = useState("");
    const [rawAmount, setRawAmount] = useState("");
    const [term, setTerm] = useState("24");
    const [estimatedRate, setEstimatedRate] = useState(0);
    const [bankRate, setBankRate] = useState(0);
    const [totalEska, setTotalEska] = useState(0);
    const [totalBank, setTotalBank] = useState(0);
    const [savings, setSavings] = useState(0);

    // Helper to format numbers with commas and currency symbol
    const formatCurrency = (value) => {
        const num = Number(value);
        if (isNaN(num)) return "";
        return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
    };
    const termsRef = useRef(null);
    const containerRef = useRef(null);

    const [showModal, setShowModal] = useState(false);
    const modalRef = useRef(null);
    const modalContentRef = useRef(null);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (containerRef.current) {
            gsap.fromTo(containerRef.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
            );
        }

        if (termsRef.current && termsRef.current.children) {
            gsap.fromTo(termsRef.current.children,
                { opacity: 0, y: 20, scale: 0.9 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.5,
                    stagger: 0.1,
                    ease: "back.out(1.7)",
                    delay: 0.3
                }
            );
        }
    }, [isLoading]);

    useEffect(() => {
        if (showModal && modalRef.current && modalContentRef.current) {
            gsap.fromTo(modalRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.3 }
            );
            gsap.fromTo(modalContentRef.current,
                { opacity: 0, scale: 0.9, y: 20 },
                { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.2)", delay: 0.1 }
            );
        }
    }, [showModal]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-black">
                <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#285c40] border-t-transparent mx-auto"></div>
                    <p className="text-zinc-400">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return null;
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const principal = parseFloat(rawAmount) || 0;
        const months = parseInt(term);
        const eskaRate = 0.15; // 15% annual
        const bankRateVal = 0.40; // 40% annual
        const monthlyRateEska = eskaRate / 12;
        const monthlyRateBank = bankRateVal / 12;
        const paymentEska = principal * monthlyRateEska / (1 - Math.pow(1 + monthlyRateEska, -months));
        const paymentBank = principal * monthlyRateBank / (1 - Math.pow(1 + monthlyRateBank, -months));
        const totalEskaVal = paymentEska * months;
        const totalBankVal = paymentBank * months;
        const savingsVal = totalBankVal - totalEskaVal;
        setEstimatedRate(eskaRate);
        setBankRate(bankRateVal);
        setTotalEska(totalEskaVal);
        setTotalBank(totalBankVal);
        setSavings(savingsVal);
        setShowModal(true);
    };

    const handleCreateRequest = () => {
        setShowModal(false);
        router.push("/completar-perfil");
    };

    return (
        <div className="min-h-screen bg-zinc-50 text-black relative">
            {/* Navigation */}
            <nav className="sticky top-0 z-40 w-full border-b border-[#285c40]/20 bg-white/70 backdrop-blur-xl">
                <div className="flex h-16 items-center justify-between px-6 md:px-12">
                    <Link href="/dashboard" className="text-xl font-bold tracking-tight text-[#86ca77]">Eska</Link>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-[#285c40] flex items-center justify-center text-white text-sm font-medium">
                                {user.first_name?.[0] || user.email[0].toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex flex-col items-center justify-center px-6 py-12">
                <div ref={containerRef} className="w-full max-w-lg space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-zinc-100">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-[#113522]">Solicitar Crédito</h1>
                        <p className="mt-2 text-zinc-500">Completa los datos para calcular tu tasa estimada.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Amount Input */}
                        <div className="space-y-2">
                            <label htmlFor="amount" className="block text-sm font-medium text-zinc-700">
                                ¿Cuánto necesitas?
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                                <input
                                    type="text"
                                    id="amount"
                                    value={amount}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/[^0-9]/g, "");
                                        setRawAmount(raw);
                                        setAmount(formatCurrency(raw));
                                    }}
                                    placeholder="Monto estimado"
                                    className="block w-full rounded-lg border border-zinc-300 bg-white py-3 pl-8 pr-4 text-zinc-900 placeholder-zinc-400 focus:border-[#285c40] focus:outline-none focus:ring-1 focus:ring-[#285c40] transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Term Selection */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-zinc-700">
                                ¿En cuánto tiempo pagarí    as?
                            </label>
                            <div ref={termsRef} className="flex justify-between gap-2">
                                {[6, 12, 24, 36].map((months) => (
                                    <label
                                        key={months}
                                        className={`flex-1 cursor-pointer rounded-lg border p-3 text-center transition-all ${term === months.toString()
                                            ? "border-[#285c40] bg-[#285c40]/5 text-[#285c40] ring-1 ring-[#285c40]"
                                            : "border-zinc-200 hover:border-zinc-300 text-zinc-600"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="term"
                                            value={months}
                                            checked={term === months.toString()}
                                            onChange={(e) => setTerm(e.target.value)}
                                            className="sr-only"
                                        />
                                        <span className="text-sm font-semibold">{months}</span>
                                        <span className="block text-xs text-zinc-500">meses</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full rounded-lg bg-[#113522] py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1a4d33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#113522] transition-all active:scale-[0.98]"
                        >
                            Calcular mi tasa estimada
                        </button>
                    </form>
                </div>
            </main>

            {/* Estimation Modal */}
            {showModal && (
                <div ref={modalRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div ref={modalContentRef} className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-zinc-200">
                        <div className="bg-[#113522] px-6 py-4 text-center">
                            <h3 className="text-lg font-semibold text-white">💡 ESTIMACIÓN PARA TI</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                                    <span className="text-zinc-600 text-sm">Tasa banco tradicional</span>
                                    <span className="font-semibold text-zinc-900">{`${(bankRate * 100).toFixed(0)}%`}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-lg bg-[#A6F096]/20 border border-[#A6F096]/50">
                                    <span className="text-[#113522] font-medium text-sm">Tasa estimada Eska</span>
                                    <span className="font-bold text-[#113522] text-lg">{`${(estimatedRate * 100).toFixed(0)}%`}</span>
                                </div>
                            </div>

                            <div className="text-center py-2">
                                <p className="text-xs text-zinc-500 uppercase tracking-wider">Tu ahorro estimado</p>
                                <p className="text-3xl font-bold text-[#113522] mt-1">${formatCurrency(savings)}</p>
                            </div>

                            <button
                                onClick={handleCreateRequest}
                                className="w-full rounded-lg bg-[#113522] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#113522]/20 hover:bg-[#1a4d33] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                            >
                                👉 Crear mi solicitud GRATIS
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
