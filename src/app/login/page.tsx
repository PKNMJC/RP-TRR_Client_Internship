"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import Alert from "@/components/Alert";
import { LineOAuthService } from "@/services/lineOAuthService";
import Button from "@/components/Button";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEmailLogin, setIsEmailLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      const role = (localStorage.getItem("role") || "USER").toUpperCase();
      if (role === "ADMIN") {
        router.push("/admin");
      } else if (role === "IT") {
        router.push("/it/dashboard");
      } else {
        router.push("/repairs/liff/form");
      }
    }
  }, [router]);

  const handleLineLogin = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      await LineOAuthService.redirectToLineAuth();
    } catch (error: any) {
      setErrorMessage(
        error.message ||
          "Failed to initiate LINE authentication. Please try again."
      );
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const { AuthService } = await import("@/lib/authService");
      const response = await AuthService.login({ email, password });
      
      if (response.access_token) {
         const role = (response.role || "USER").toUpperCase();
         if (role === "ADMIN") {
           router.push("/admin");
         } else if (role === "IT") {
           router.push("/it/dashboard");
         } else {
           router.push("/repairs/liff/form");
         }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setErrorMessage(
        error.message || "Failed to login. Please check your credentials."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full bg-primary-400/20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="glass border-white/40 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 mb-4 shadow-lg shadow-primary-500/30">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 mb-2">
              Welcome Back
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              ระบบแจ้งซ่อมออนไลน์สำหรับพนักงาน
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6">
              <Alert
                type="error"
                message={errorMessage}
                onClose={() => setErrorMessage("")}
              />
            </div>
          )}

          <div className="space-y-6">
            {!isEmailLogin ? (
              <>
                <Button
                  onClick={handleLineLogin}
                  isLoading={isLoading}
                  fullWidth
                  size="lg"
                  className="bg-[#06C755] hover:bg-[#05b34c] active:bg-[#04a044] text-white shadow-lg shadow-green-500/20 items-center justify-center gap-3 group"
                >
                  {!isLoading && (
                    <svg
                      className="w-6 h-6 transition-transform group-hover:scale-110"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0C5.373 0 0 4.975 0 11.118c0 5.568 4.363 10.217 10.38 10.992.42.09.992.277 1.15.632.186.417.135 1.056.096 1.623-.044.636-.21 2.477.765 3.395.732.688 2.006.518 3.19.196 2.652-.72 7.82-4.104 7.82-9.697C23.385 5.55 18.28 0 12 0zm0 19.34c-4.99 0-9.215-3.665-9.215-8.21 0-4.545 4.225-8.21 9.215-8.21s9.215 3.665 9.215 8.21c0 4.545-4.225 8.21-9.215 8.21z" />
                    </svg>
                  )}
                  <span>เข้าสู่ระบบด้วย LINE</span>
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white/50 dark:bg-slate-800/50 text-slate-500">
                      หรือ
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => setIsEmailLogin(true)}
                  variant="secondary"
                  fullWidth
                  size="lg"
                  className="border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50"
                >
                  เข้าสู่ระบบด้วย Email (สำหรับเจ้าหน้าที่)
                </Button>
              </>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                    placeholder="name@trr.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <div className="pt-2">
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    fullWidth
                    size="lg"
                    className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/20"
                  >
                    เข้าสู่ระบบ
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEmailLogin(false)}
                  className="w-full text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 py-2"
                >
                  กลับไปหน้าเลือกวิธีการเข้าสู่ระบบ
                </button>
              </form>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/50 dark:bg-slate-800/50 text-slate-500">
                  Secure Access
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">
              © 2025 TRR Internship Project. All rights reserved.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
