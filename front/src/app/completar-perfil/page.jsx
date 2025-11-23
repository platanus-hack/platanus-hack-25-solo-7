"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { gsap } from "gsap";

export default function CompletarPerfilPage() {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(1); // 1 for next, -1 for back
    const containerRef = useRef(null);
    const stepRef = useRef(null);

    const [formData, setFormData] = useState({
        // Step 1
        dobDay: "", dobMonth: "", dobYear: "",
        gender: "",
        country: "",
        city: "",
        // Step 2
        workSituation: "",
        employer: "",
        seniorityYears: "", seniorityMonths: "",
        monthlyIncome: "",
        // Step 3
        hasDebts: "",
        totalDebts: "",
        hasCreditCard: "",
        housingType: "",
        // Step 4
        educationLevel: "",
        profession: "",
        // Step 5
        documentType: "",
        documentNumber: "",
        // Step 6: Loan Request
        loanAmount: "",
        loanTerm: "12",
        loanPurpose: "",
        wantsPool: false,
    });

    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [scoreResult, setScoreResult] = useState(null);

    const calculateFairScore = (data) => {
        let score = 500; // Base score
        const breakdown = [];

        // 1. INGRESOS (peso 30%)
        const income = parseFloat(data.monthlyIncome) || 0;
        let incomePoints = 0;
        if (income < 500) {
            incomePoints = 0;
        } else if (income >= 500 && income < 1000) {
            incomePoints = 50;
        } else if (income >= 1000 && income < 2000) {
            incomePoints = 100;
        } else if (income >= 2000 && income < 5000) {
            incomePoints = 150;
        } else {
            incomePoints = 200;
        }
        score += incomePoints;
        breakdown.push({
            factor: "Ingresos mensuales",
            points: incomePoints,
            detail: `$${income}`
        });

        // 2. RATIO DEUDA/INGRESO (peso 25%)
        const debt = parseFloat(data.totalDebts) || 0;
        const dti = income > 0 ? (debt / income) * 100 : 0;
        let dtiPoints = 0;
        if (dti > 60) {
            dtiPoints = -100;
        } else if (dti >= 40 && dti <= 60) {
            dtiPoints = -50;
        } else if (dti >= 20 && dti < 40) {
            dtiPoints = 50;
        } else {
            dtiPoints = 100;
        }
        score += dtiPoints;
        breakdown.push({
            factor: "Ratio deuda/ingreso",
            points: dtiPoints,
            detail: `${dti.toFixed(1)}% DTI`
        });

        // 3. ESTABILIDAD LABORAL (peso 20%)
        const years = parseInt(data.seniorityYears) || 0;
        const months = parseInt(data.seniorityMonths) || 0;
        const jobMonths = (years * 12) + months;
        let jobPoints = 0;
        if (jobMonths < 6) {
            jobPoints = 20;
        } else if (jobMonths >= 6 && jobMonths < 12) {
            jobPoints = 50;
        } else if (jobMonths >= 12 && jobMonths < 24) {
            jobPoints = 80;
        } else {
            jobPoints = 100;
        }
        score += jobPoints;
        breakdown.push({
            factor: "Estabilidad laboral",
            points: jobPoints,
            detail: `${jobMonths} meses en trabajo actual`
        });

        // 4. EDAD (peso 10%)
        const currentYear = new Date().getFullYear();
        const birthYear = parseInt(data.dobYear) || currentYear - 30;
        const age = currentYear - birthYear;
        let agePoints = 0;
        if (age >= 18 && age <= 25) {
            agePoints = 30;
        } else if (age >= 26 && age <= 35) {
            agePoints = 50;
        } else if (age >= 36 && age <= 50) {
            agePoints = 60;
        } else {
            agePoints = 40;
        }
        score += agePoints;
        breakdown.push({
            factor: "Edad",
            points: agePoints,
            detail: `${age} años`
        });

        // 5. EDUCACIÓN (peso 10%)
        let eduPoints = 0;
        switch (data.educationLevel) {
            case "Secundaria":
                eduPoints = 20;
                break;
            case "Técnica/Terciaria":
                eduPoints = 40;
                break;
            case "Universitaria":
                eduPoints = 60;
                break;
            case "Postgrado":
                eduPoints = 80;
                break;
            default:
                eduPoints = 20;
        }
        score += eduPoints;
        breakdown.push({
            factor: "Nivel educativo",
            points: eduPoints,
            detail: data.educationLevel
        });

        // 6. VIVIENDA PROPIA (peso 5%)
        const homeOwner = data.housingType === "Propia";
        const homePoints = homeOwner ? 50 : 0;
        score += homePoints;
        breakdown.push({
            factor: "Vivienda propia",
            points: homePoints,
            detail: homeOwner ? "Sí" : "No"
        });

        // 7. HISTORIAL CREDITICIO (penalización si no existe)
        const hasCreditHistory = data.hasCreditCard === "Sí" || data.hasDebts === "Sí";
        const historyPoints = hasCreditHistory ? 0 : -110;
        score += historyPoints;
        if (!hasCreditHistory) {
            breakdown.push({
                factor: "Sin historial crediticio largo",
                points: historyPoints,
                detail: "Se mejorará con tu primer préstamo"
            });
        }

        score = Math.max(300, Math.min(850, score));

        return {
            score: score,
            breakdown: breakdown,
            category: getScoreCategory(score)
        };
    };

    const getScoreCategory = (score) => {
        if (score < 500) return "Riesgo Alto";
        if (score < 600) return "Regular";
        if (score < 700) return "Bueno";
        if (score < 800) return "Muy Bueno";
        return "Excelente";
    };

    const startAnalysis = () => {
        setCurrentStep(6);
        let progress = 0;
        const interval = setInterval(() => {
            progress += 2;
            setAnalysisProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                const result = calculateFairScore(formData);
                setScoreResult(result);
                setCurrentStep(8);
            }
        }, 50);
    };

    const renderAnalyzing = () => (
        <div className="text-center space-y-8 py-12">
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-[#113522]">🔍 Analizando tu perfil...</h2>
                <p className="text-zinc-500">
                    {analysisProgress < 30 ? "Verificando información..." :
                        analysisProgress < 70 ? "⚙️ Calculando tu Score Justo..." :
                            "Evaluando capacidad de pago..."}
                </p>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-4 overflow-hidden">
                <div
                    className="bg-[#113522] h-full transition-all duration-100 ease-linear"
                    style={{ width: `${analysisProgress}%` }}
                ></div>
            </div>
            <p className="text-zinc-400 font-mono">{analysisProgress}%</p>
        </div>
    );

    const handlePublish = async () => {
        try {
            const payload = {
                dob_day: formData.dobDay,
                dob_month: formData.dobMonth,
                dob_year: formData.dobYear,
                gender: formData.gender,
                country: formData.country,
                city: formData.city,
                work_situation: formData.workSituation,
                employer: formData.employer,
                seniority_years: formData.seniorityYears,
                seniority_months: formData.seniorityMonths,
                monthly_income: formData.monthlyIncome,
                has_debts: formData.hasDebts,
                total_debts: formData.totalDebts,
                has_credit_card: formData.hasCreditCard,
                housing_type: formData.housingType,
                education_level: formData.educationLevel,
                profession: formData.profession,
                document_type: formData.documentType,
                document_number: formData.documentNumber,
                score: scoreResult?.score,
                score_category: scoreResult?.category
            };

            // Convert empty strings to null for optional fields if needed, 
            // or ensure backend handles them. Pydantic handles optional fields well.

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/profile`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // Create Loan Request
                const loanResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loans/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        amount: parseFloat(formData.loanAmount),
                        term_months: parseInt(formData.loanTerm),
                        wants_pool: formData.wantsPool,
                        purpose: formData.loanPurpose
                    }),
                });

                if (loanResponse.ok) {
                    alert("¡Perfil y solicitud creados con éxito!");
                    router.push("/dashboard");
                } else {
                    alert("Perfil guardado, pero error al crear solicitud.");
                    router.push("/dashboard");
                }
            } else {
                const error = await response.json();
                alert(`Error al publicar: ${error.detail || "Intente nuevamente"}`);
            }
        } catch (error) {
            console.error("Error publishing profile:", error);
            alert("Error de conexión. Intente nuevamente.");
        }
    };

    const renderScoreResult = () => {
        const score = scoreResult?.score || 0;
        const isBankEligible = score >= 700;
        const bankScore = Math.max(300, Math.round(score * 0.8)); // Simulating a lower bank score

        return (
            <div className="space-y-8 text-center">
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-[#113522]">🎉 ¡Tu Score Justo está listo!</h2>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-xl border border-zinc-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A6F096] to-[#113522]"></div>

                    <div className="flex flex-col items-center justify-center py-6">
                        <div className="relative h-40 w-40 flex items-center justify-center">
                            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#f4f4f5" strokeWidth="8" />
                                <circle
                                    cx="50" cy="50" r="45" fill="none" stroke="#113522" strokeWidth="8"
                                    strokeDasharray="283"
                                    strokeDashoffset={283 - (283 * score / 850)}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-bold text-[#113522]">{score}</span>
                                <span className="text-xs font-medium text-zinc-500 uppercase">Score Justo</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700">Motivo del Préstamo</label>
                            <textarea
                                value={formData.loanPurpose}
                                onChange={(e) => setFormData({ ...formData, loanPurpose: e.target.value })}
                                placeholder="Describe brevemente para qué utilizarás el dinero..."
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#A6F096] focus:border-transparent transition-all min-h-[100px]"
                                required
                            />
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-zinc-200">
                                <span className="text-zinc-500 text-sm">Score Bancario</span>
                                <span className={`font-medium flex items-center gap-1 ${isBankEligible ? "text-zinc-700" : "text-red-500"}`}>
                                    {bankScore} {isBankEligible ? "⚠️" : "❌"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#113522] font-medium text-sm">Score Justo</span>
                                <span className="font-bold text-[#113522] flex items-center gap-1">{score} ✅</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#A6F096]/10 p-4 rounded-xl border border-[#A6F096]/30 text-left">
                    <p className="text-sm text-[#113522] mb-3">
                        💡 {isBankEligible
                            ? "¡Tienes un buen perfil! Tu capacidad de pago es sólida."
                            : `Estás en el "Limbo del 70%". Pero tu capacidad real de pago es ${scoreResult?.category.toUpperCase()}.`}
                    </p>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-zinc-500">
                            <span>• Banco tradicional:</span>
                            <span className={`font-medium ${isBankEligible ? "text-zinc-700" : "text-red-500"}`}>
                                {isBankEligible ? "15-25% (Aprobado)" : "❌ NO APLICAS"}
                            </span>
                        </div>
                        <div className="flex justify-between text-zinc-500">
                            <span>• Prestamista informal:</span>
                            <span>{isBankEligible ? "No necesario" : "55%"}</span>
                        </div>
                        <div className="flex justify-between text-[#113522] font-medium bg-white/50 p-1 rounded">
                            <span>• En Eska:</span>
                            <span>{isBankEligible ? "10-15% (Mejor tasa)" : "12-18% (competitivo)"}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button className="flex-1 py-3 text-sm font-medium text-zinc-500 hover:text-zinc-800">
                        ¿Por qué este score?
                    </button>
                    <button
                        onClick={handlePublish}
                        className="flex-[2] rounded-lg bg-[#113522] py-3 text-sm font-bold text-white shadow-lg hover:bg-[#1a4d33] transition-all"
                    >
                        Publicar solicitud de préstamo →
                    </button>
                </div>
            </div>
        );
    };

    const handleNext = () => {
        if (currentStep === 6) {
            startAnalysis();
        } else {
            setDirection(1);
            setCurrentStep(prev => Math.min(prev + 1, 8));
        }
    };

    useEffect(() => {
        if (stepRef.current) {
            gsap.fromTo(stepRef.current,
                { opacity: 0, x: direction * 50 },
                { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }
            );
        }
    }, [currentStep]);

    if (isLoading) return null;
    if (!isAuthenticated || !user) return null;



    const handleBack = () => {
        setDirection(-1);
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const renderIntro = () => (
        <div className="text-center space-y-8 max-w-md mx-auto">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-[#113522]">¡Hola {user.first_name || "Usuario"}!</h1>
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-zinc-100 space-y-6 text-left">
                    <p className="text-zinc-600 text-lg text-center">
                        Para conectarte con prestamistas, necesitamos conocerte mejor.
                    </p>
                    <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-zinc-700">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#A6F096]/30 text-[#113522] font-bold text-sm">1</span>
                            Completa tu perfil (5 minutos)
                        </li>
                        <li className="flex items-center gap-3 text-zinc-700">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#A6F096]/30 text-[#113522] font-bold text-sm">2</span>
                            Obtén tu Score Justo
                        </li>
                        <li className="flex items-center gap-3 text-zinc-700">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#A6F096]/30 text-[#113522] font-bold text-sm">3</span>
                            Publica tu solicitud
                        </li>
                    </ul>
                    <button
                        onClick={handleNext}
                        className="w-full rounded-lg bg-[#113522] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#113522]/20 hover:bg-[#1a4d33] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                    >
                        Empezar ahora
                    </button>
                </div>
            </div>
        </div>
    );

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="space-y-4">
                <label className="block text-sm font-medium text-zinc-700">Fecha de nacimiento</label>
                <div className="flex gap-2">
                    <input
                        type="number" placeholder="DD"
                        className="w-full rounded-lg border border-zinc-300 p-3 text-center focus:border-[#285c40] focus:outline-none"
                        value={formData.dobDay} onChange={(e) => handleChange("dobDay", e.target.value)}
                    />
                    <input
                        type="number" placeholder="MM"
                        className="w-full rounded-lg border border-zinc-300 p-3 text-center focus:border-[#285c40] focus:outline-none"
                        value={formData.dobMonth} onChange={(e) => handleChange("dobMonth", e.target.value)}
                    />
                    <input
                        type="number" placeholder="AAAA"
                        className="w-full rounded-lg border border-zinc-300 p-3 text-center focus:border-[#285c40] focus:outline-none"
                        value={formData.dobYear} onChange={(e) => handleChange("dobYear", e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-700">Género</label>
                <div className="flex gap-4">
                    {["Masculino", "Femenino", "Otro"].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio" name="gender" value={opt}
                                checked={formData.gender === opt}
                                onChange={(e) => handleChange("gender", e.target.value)}
                                className="text-[#285c40] focus:ring-[#285c40]"
                            />
                            <span className="text-zinc-700">{opt}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700">País</label>
                <select
                    className="w-full rounded-lg border border-zinc-300 p-3 bg-white focus:border-[#285c40] focus:outline-none"
                    value={formData.country} onChange={(e) => handleChange("country", e.target.value)}
                >
                    <option value="">Selecciona...</option>
                    <option value="Chile">Chile</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Mexico">México</option>
                    <option value="Colombia">Colombia</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700">Ciudad</label>
                <input
                    type="text"
                    className="w-full rounded-lg border border-zinc-300 p-3 focus:border-[#285c40] focus:outline-none"
                    value={formData.city} onChange={(e) => handleChange("city", e.target.value)}
                />
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-700">¿Cuál es tu situación laboral?</label>
                <div className="space-y-2">
                    {["Empleado formal", "Independiente/Freelancer", "Emprendedor", "Otro"].map((opt) => (
                        <label key={opt} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formData.workSituation === opt ? "border-[#285c40] bg-[#285c40]/5" : "border-zinc-200 hover:border-zinc-300"}`}>
                            <input
                                type="radio" name="workSituation" value={opt}
                                checked={formData.workSituation === opt}
                                onChange={(e) => handleChange("workSituation", e.target.value)}
                                className="text-[#285c40] focus:ring-[#285c40]"
                            />
                            <span className="text-zinc-700">{opt}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700">Empresa/Empleador</label>
                <input
                    type="text"
                    className="w-full rounded-lg border border-zinc-300 p-3 focus:border-[#285c40] focus:outline-none"
                    value={formData.employer} onChange={(e) => handleChange("employer", e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700">Antigüedad en trabajo actual</label>
                <div className="flex gap-2 items-center">
                    <input
                        type="number" placeholder="0"
                        className="w-20 rounded-lg border border-zinc-300 p-3 text-center focus:border-[#285c40] focus:outline-none"
                        value={formData.seniorityYears} onChange={(e) => handleChange("seniorityYears", e.target.value)}
                    />
                    <span className="text-zinc-500 text-sm">años</span>
                    <input
                        type="number" placeholder="0"
                        className="w-20 rounded-lg border border-zinc-300 p-3 text-center focus:border-[#285c40] focus:outline-none"
                        value={formData.seniorityMonths} onChange={(e) => handleChange("seniorityMonths", e.target.value)}
                    />
                    <span className="text-zinc-500 text-sm">meses</span>
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700">Ingresos mensuales (antes de imp.)</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                    <input
                        type="number"
                        className="w-full rounded-lg border border-zinc-300 p-3 pl-8 focus:border-[#285c40] focus:outline-none"
                        value={formData.monthlyIncome} onChange={(e) => handleChange("monthlyIncome", e.target.value)}
                    />
                </div>
                <p className="text-xs text-zinc-500 flex items-center gap-1">
                    💡 Esta info es confidencial y solo prestamistas verificados la verán
                </p>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-700">¿Tienes deudas actuales?</label>
                <div className="flex gap-4">
                    {["No", "Sí"].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio" name="hasDebts" value={opt}
                                checked={formData.hasDebts === opt}
                                onChange={(e) => handleChange("hasDebts", e.target.value)}
                                className="text-[#285c40] focus:ring-[#285c40]"
                            />
                            <span className="text-zinc-700">{opt}</span>
                        </label>
                    ))}
                </div>
            </div>

            {formData.hasDebts === "Sí" && (
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-700">Total de deudas mensuales</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                        <input
                            type="number"
                            className="w-full rounded-lg border border-zinc-300 p-3 pl-8 focus:border-[#285c40] focus:outline-none"
                            value={formData.totalDebts} onChange={(e) => handleChange("totalDebts", e.target.value)}
                        />
                    </div>
                </div>
            )}

            <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-700">¿Tienes tarjeta de crédito?</label>
                <div className="flex gap-4">
                    {["Sí", "No"].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio" name="hasCreditCard" value={opt}
                                checked={formData.hasCreditCard === opt}
                                onChange={(e) => handleChange("hasCreditCard", e.target.value)}
                                className="text-[#285c40] focus:ring-[#285c40]"
                            />
                            <span className="text-zinc-700">{opt}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-700">¿Eres dueño de tu vivienda?</label>
                <div className="flex gap-4">
                    {["Propia", "Renta", "Familiar"].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio" name="housingType" value={opt}
                                checked={formData.housingType === opt}
                                onChange={(e) => handleChange("housingType", e.target.value)}
                                className="text-[#285c40] focus:ring-[#285c40]"
                            />
                            <span className="text-zinc-700">{opt}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6">
            <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-700">Nivel educativo</label>
                <div className="space-y-2">
                    {["Secundaria", "Técnica/Terciaria", "Universitaria", "Postgrado"].map((opt) => (
                        <label key={opt} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formData.educationLevel === opt ? "border-[#285c40] bg-[#285c40]/5" : "border-zinc-200 hover:border-zinc-300"}`}>
                            <input
                                type="radio" name="educationLevel" value={opt}
                                checked={formData.educationLevel === opt}
                                onChange={(e) => handleChange("educationLevel", e.target.value)}
                                className="text-[#285c40] focus:ring-[#285c40]"
                            />
                            <span className="text-zinc-700">{opt}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700">Profesión/Ocupación</label>
                <input
                    type="text"
                    className="w-full rounded-lg border border-zinc-300 p-3 focus:border-[#285c40] focus:outline-none"
                    value={formData.profession} onChange={(e) => handleChange("profession", e.target.value)}
                />
            </div>
        </div>
    );

    const renderStep5 = () => (
        <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 mb-4">
                Para protegerte, verificaremos tu identidad (requerido legalmente).
            </div>

            <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-700">Documento de identidad</label>
                <div className="flex gap-4">
                    {["DNI/Cédula", "Pasaporte"].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio" name="documentType" value={opt}
                                checked={formData.documentType === opt}
                                onChange={(e) => handleChange("documentType", e.target.value)}
                                className="text-[#285c40] focus:ring-[#285c40]"
                            />
                            <span className="text-zinc-700">{opt}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700">Número de documento</label>
                <input
                    type="text"
                    className="w-full rounded-lg border border-zinc-300 p-3 focus:border-[#285c40] focus:outline-none"
                    value={formData.documentNumber} onChange={(e) => handleChange("documentNumber", e.target.value)}
                />
            </div>

            <div className="space-y-4">
                <div className="border-2 border-dashed border-zinc-300 rounded-lg p-6 text-center hover:bg-zinc-50 transition-colors cursor-pointer">
                    <p className="font-medium text-zinc-700">📸 Foto de tu documento</p>
                    <p className="text-sm text-zinc-500 mt-1">[Subir foto] o [Tomar foto]</p>
                </div>
                <div className="border-2 border-dashed border-zinc-300 rounded-lg p-6 text-center hover:bg-zinc-50 transition-colors cursor-pointer">
                    <p className="font-medium text-zinc-700">📸 Selfie sosteniendo documento</p>
                    <p className="text-sm text-zinc-500 mt-1">[Subir foto] o [Tomar foto]</p>
                </div>
            </div>

            <p className="text-xs text-zinc-500 text-center flex items-center justify-center gap-1">
                🔒 Usamos encriptación de nivel bancario. Tu info está segura.
            </p>
        </div>
    );

    const renderStep6 = () => (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-[#113522]">Detalles del Préstamo</h3>
                <p className="text-sm text-zinc-500">Define cuánto necesitas y en cuánto tiempo quieres pagarlo.</p>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-700">Monto a solicitar</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                        <input
                            type="number"
                            className="w-full rounded-lg border border-zinc-300 p-3 pl-8 focus:border-[#285c40] focus:outline-none"
                            value={formData.loanAmount} onChange={(e) => handleChange("loanAmount", e.target.value)}
                            placeholder="Ej: 1000000"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="block text-sm font-medium text-zinc-700">Plazo de pago (meses)</label>
                    <div className="grid grid-cols-4 gap-2">
                        {[6, 12, 24, 36].map((months) => (
                            <label
                                key={months}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${formData.loanTerm == months
                                    ? "border-[#285c40] bg-[#285c40]/5 text-[#285c40]"
                                    : "border-zinc-200 hover:border-zinc-300 text-zinc-600"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="loanTerm"
                                    value={months}
                                    checked={formData.loanTerm == months}
                                    onChange={(e) => handleChange("loanTerm", e.target.value)}
                                    className="sr-only"
                                />
                                <span className="font-bold">{months}</span>
                                <span className="text-xs">meses</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const getStepContent = () => {
        switch (currentStep) {
            case 0: return renderIntro();
            case 1: return renderStep1();
            case 2: return renderStep2();
            case 3: return renderStep3();
            case 4: return renderStep4();
            case 5: return renderStep5();
            case 6: return renderStep6();
            case 7: return renderAnalyzing();
            case 8: return renderScoreResult();
            default: return null;
        }
    };

    const getStepTitle = () => {
        switch (currentStep) {
            case 1: return "Información básica";
            case 2: return "Tu trabajo";
            case 3: return "Tus finanzas";
            case 4: return "Perfil adicional";
            case 5: return "Verificación";
            case 6: return "Tu Solicitud";
            default: return "";
        }
    };

    const getProgress = () => {
        return (currentStep / 6) * 100;
    };

    return (
        <div className="min-h-screen bg-zinc-50 text-black">
            {/* Navigation */}
            <nav className="sticky top-0 z-40 w-full border-b border-[#285c40]/20 bg-white/70 backdrop-blur-xl">
                <div className="flex h-16 items-center justify-between px-6 md:px-12">
                    <Link href="/dashboard" className="text-xl font-bold tracking-tight text-[#86ca77]">Eska</Link>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[#285c40] flex items-center justify-center text-white text-sm font-medium">
                            {user.first_name?.[0] || user.email[0].toUpperCase()}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex flex-col items-center justify-center px-6 py-12 min-h-[calc(100vh-64px)]">
                {currentStep > 0 && (
                    <div className="w-full max-w-lg mb-8">
                        <div className="flex justify-between text-sm font-medium text-zinc-600 mb-2">
                            <span>Paso {currentStep} de 5: {getStepTitle()}</span>
                            <span>{getProgress()}%</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#113522] transition-all duration-500 ease-out"
                                style={{ width: `${getProgress()}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                <div ref={containerRef} className="w-full max-w-lg">
                    <div ref={stepRef}>
                        {currentStep > 0 && (
                            <div className="bg-white p-8 rounded-2xl shadow-xl border border-zinc-100">
                                {getStepContent()}

                                {currentStep < 7 && (
                                    <div className="flex justify-between mt-8 pt-6 border-t border-zinc-100">
                                        <button
                                            onClick={handleBack}
                                            className="text-zinc-500 hover:text-zinc-800 font-medium text-sm px-4 py-2"
                                        >
                                            ← Atrás
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            className="bg-[#113522] text-white rounded-lg px-6 py-2 text-sm font-bold shadow-md hover:bg-[#1a4d33] transition-all"
                                        >
                                            {currentStep === 6 ? "Analizar perfil" : "Siguiente →"}
                                        </button>
                                    </div>
                                )}
                                {currentStep === 6 && (
                                    <div className="mt-6 p-4 bg-[#A6F096]/10 rounded-lg border border-[#A6F096]/30">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.wantsPool}
                                                onChange={(e) => setFormData({ ...formData, wantsPool: e.target.checked })}
                                                className="mt-1 h-5 w-5 rounded border-[#285c40] text-[#285c40] focus:ring-[#285c40]"
                                            />
                                            <div>
                                                <p className="font-medium text-[#113522]">Unirme a una Bolsa de Préstamos</p>
                                                <p className="text-sm text-zinc-600 mt-1">
                                                    Aumenta tus posibilidades de financiamiento al agrupar tu solicitud con otras personas (máx. 5).
                                                    Los inversionistas diversifican su riesgo y tú obtienes mejores tasas.
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}
                        {currentStep === 0 && getStepContent()}
                    </div>
                </div>
            </main>
        </div>
    );
}
