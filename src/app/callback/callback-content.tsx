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
      // ✅ Prevent multiple calls - critical for avoiding duplicate code exchange
      if (hasCalled.current) {
        console.log("[LINE Callback] Already processing, skipping duplicate call");
        return;
      }
      hasCalled.current = true;

      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");

        if (!code) {
          setError("No authorization code received from LINE");
          setIsLoading(false);
          return;
        }

        console.log("[LINE Callback] 🔵 Processing authorization code:", code.substring(0, 10) + "...");

        // Send the code and state to your backend
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

        console.log("Authentication successful, received data:", {
          access_token: !!data.access_token,
          role: data.role,
        });

        // Store the token and redirect
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("role", data.role || "USER");
          localStorage.setItem("userId", data.userId || "");

          // Redirect based on role and context
          const userRole = data.role || "USER";

          // For LINE/LIFF users, redirect to the LIFF chat interface
          if (userRole === "USER") {
            // Redirect to repairs LIFF form where they came from
            router.replace("/repairs/liff/form");
          } else if (userRole === "ADMIN") {
            router.replace("/admin");
          } else if (userRole === "IT") {
            router.replace("/it/dashboard");
          } else {
            router.replace("/tickets");
          }
        } else {
          throw new Error("No access token received");
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An unknown error occurred during authentication";
        console.error("Callback error:", errorMessage);
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
