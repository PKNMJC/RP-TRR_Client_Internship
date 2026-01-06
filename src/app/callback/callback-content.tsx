"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const hasCalled = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // ✅ CRITICAL GUARD: Prevent duplicate code exchange
      // React Strict Mode will mount components twice in dev mode
      // Without this guard, we'd send the same code twice, causing LINE to reject the second attempt
      if (hasCalled.current) {
        console.log(
          "[Callback] Code exchange already in progress, skipping duplicate processing"
        );
        return;
      }
      hasCalled.current = true;

      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");

        // ✅ GUARD: Ensure authorization code exists
        if (!code) {
          setError(
            "No authorization code received from LINE. Please try logging in again."
          );
          setIsLoading(false);
          return;
        }

        console.log(
          "[Callback] 🔵 Processing LINE authorization code:",
          code.substring(0, 10) + "..."
        );

        // ✅ Step 1: Send authorization code to backend for token exchange
        // Backend will exchange the code with LINE and create/update the user
        console.log(
          "[Callback] Sending authorization code to backend for token exchange"
        );
        const response = await fetch("/api/auth/line-callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            state,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to authenticate with LINE"
          );
        }

        const data = await response.json();

        console.log("[Callback] ✅ Authentication successful", {
          access_token: !!data.access_token,
          role: data.role,
        });

        // ✅ Step 2: Store token and user info in localStorage
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("role", data.role || "USER");
          localStorage.setItem("userId", data.userId || "");

          // ✅ Step 3: Redirect based on user role
          const userRole = data.role || "USER";
          console.log("[Callback] Redirecting user based on role:", userRole);

          // For LINE/LIFF users, redirect to repairs form
          if (userRole === "USER") {
            router.replace("/repairs/liff/form");
          } else if (userRole === "ADMIN") {
            router.replace("/admin");
          } else if (userRole === "IT") {
            router.replace("/it/dashboard");
          } else {
            router.replace("/tickets");
          }
        } else {
          throw new Error("No access token received from backend");
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An unknown error occurred during authentication";
        console.error("[Callback] ❌ Authentication error:", errorMessage);
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
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
          <p className="text-gray-600">Processing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Error
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return null;
}
