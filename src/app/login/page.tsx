"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LineOAuthService } from "@/services/lineOAuthService";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      const role = localStorage.getItem("role");
      if (role === "ADMIN") {
        router.push("/admin");
      } else if (role === "IT") {
        router.push("/it/dashboard");
      } else {
        // For regular users, redirect to repairs LIFF
        router.push("/repairs/liff/form");
      }
    }
  }, [router]);

  // If "admin" param is passed, redirect to admin login
  useEffect(() => {
    const isAdmin = searchParams.get("admin");
    if (isAdmin === "true") {
      router.push("/login/admin");
    }
  }, [searchParams, router]);

  // Auto-initiate LINE login for guest/user login
  useEffect(() => {
    const initiateLineLogin = async () => {
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

    const token = localStorage.getItem("access_token");
    if (!token) {
      initiateLineLogin();
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="text-center">
        {errorMessage ? (
          <div className="max-w-md">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Error
            </h1>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="flex gap-4">
              <button
                onClick={() => (window.location.href = "/login")}
                className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
              <button
                onClick={() => router.push("/login?admin=true")}
                className="flex-1 bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
              >
                Admin Login
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="animate-spin mb-4">
              <svg
                className="w-12 h-12 text-blue-600 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4a8 8 0 018 8m0 0a8 8 0 11-16 0 8 8 0 0116 0z"
                />
              </svg>
            </div>
            <p className="text-gray-600">
              {isLoading ? "Redirecting to LINE..." : "Loading..."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
