"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LineOAuthService } from "@/services/lineOAuthService";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  // ✅ Prevent multiple LINE auth calls (React Strict Mode double mount)
  const hasInitiatedLineLogin = useRef(false);

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
  // ✅ GUARD: Prevent infinite redirect loops and repeated auth calls
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

    // ✅ CRITICAL GUARD 1: Prevent React Strict Mode double-mount
    // Without this, redirectToLineAuth might be called twice, causing double redirect
    if (hasInitiatedLineLogin.current) {
      console.log(
        "[Login] Already initiating LINE login, skipping duplicate call..."
      );
      return;
    }

    // ✅ CRITICAL GUARD 2: If code exists in URL, redirect to /callback
    // This prevents LINE authorization from being triggered again
    // because we already HAVE the authorization code from LINE
    const code = searchParams.get("code");
    if (code) {
      console.log(
        "[Login] Authorization code found in URL, redirecting to /callback for token exchange"
      );
      router.replace("/callback");
      return;
    }

    // ✅ CRITICAL GUARD 3: If access_token exists in localStorage, user is already authenticated
    // Skip LINE login and redirect based on user role
    const token = localStorage.getItem("access_token");
    if (token) {
      console.log(
        "[Login] User already authenticated, skipping LINE authorization"
      );
      const role = localStorage.getItem("role");
      if (role === "ADMIN") {
        router.replace("/admin");
      } else if (role === "IT") {
        router.replace("/it/dashboard");
      } else {
        router.replace("/repairs/liff/form");
      }
      return;
    }

    // ✅ Safe to initiate LINE login only when all guards pass
    hasInitiatedLineLogin.current = true;
    initiateLineLogin();
  }, [searchParams, router]);

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

function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="text-center">
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
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
}
