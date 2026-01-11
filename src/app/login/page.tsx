"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import Alert from "@/components/Alert";
import { LineOAuthService } from "@/services/lineOAuthService";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      <div className="relative z-10 w-full max-w-md">
        <Card>
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ยินดีต้อนรับ
            </h1>
            <p className="text-gray-600">กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</p>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <Alert
              type="error"
              message={errorMessage}
              onClose={() => setErrorMessage("")}
            />
          )}

          {/* Login Button */}
          <div className="space-y-4">
            <button
              onClick={handleLineLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังเชื่อมต่อ...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19.365 9.863c.356 0 .694.057 1.01.158a9.946 9.946 0 00-7.375-3.021c-5.539 0-10.082 4.543-10.082 10.082 0 2.332.804 4.468 2.143 6.151-.357-.033-.717-.05-1.08-.05C2.649 23.183 0 20.535 0 17.183c0-2.702 1.885-4.975 4.414-5.606C5.189 8.143 8.915 5.784 13.34 5.784c1.775 0 3.458.378 4.98 1.054-.02-.35-.031-.704-.031-1.062a3.624 3.624 0 017.248 0c0 1.037.358 1.99.957 2.744.599.754 1.54 1.237 2.562 1.237h1.309zm-6.555 6.915c0 1.464-1.187 2.651-2.651 2.651s-2.651-1.187-2.651-2.651 1.187-2.651 2.651-2.651 2.651 1.187 2.651 2.651zm6.368-1.326a1.326 1.326 0 110-2.651 1.326 1.326 0 010 2.651z" />
                  </svg>
                  <span>เข้าสู่ระบบด้วย LINE</span>
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-xs text-gray-600">
              สำหรับเจ้าหน้าที่และผู้แจ้งเรื่อง
            </p>
          </div>
        </Card>

        {/* Copyright */}
        <p className="text-center text-gray-500 text-sm mt-8">
          © 2025 Creat By Internship Project TRR .
        </p>
      </div>
    </div>
  );
}
