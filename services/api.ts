// Use environment variable, or fallback to production URL, then localhost for dev
const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
    ? 'https://rp-trr-server-internship.vercel.app' 
    : 'http://localhost:3001');

export const API_BASE_URL = API_URL;

interface FetchOptions extends RequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

export async function apiFetch(url: string, options?: string | FetchOptions | "GET" | "POST" | "PUT" | "DELETE", body?: any) {
  // Support both 'access_token' (LINE Login) and 'token' (normal login)
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");

  let method = "GET";
  let requestBody: any = undefined;
  let headers: Record<string, string> = {
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  if (typeof options === "string") {
    method = options;
    requestBody = body ? JSON.stringify(body) : undefined;
    headers["Content-Type"] = "application/json";
  } else if (typeof options === "object" && options !== null) {
    method = options.method || "GET";
    headers = {
      ...headers,
      ...options.headers,
    };
    if (options.body) {
      if (options.body instanceof FormData) {
        requestBody = options.body;
        delete headers["Content-Type"];
      } else if (typeof options.body === "string") {
        requestBody = options.body;
        headers["Content-Type"] = "application/json";
      } else {
        requestBody = JSON.stringify(options.body);
        headers["Content-Type"] = "application/json";
      }
    } else if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
  } else {
    headers["Content-Type"] = "application/json";
  }

  try {
    const res = await fetch(API_URL + url, {
      method,
      headers,
      body: requestBody,
    });

    if (!res.ok) {
      try {
        const clonedRes = res.clone();
        const error = await clonedRes.json();
        throw new Error(error.message || `เกิดข้อผิดพลาด: ${res.status}`);
      } catch {
        throw new Error(`เกิดข้อผิดพลาด: ${res.status} ${res.statusText}`);
      }
    }

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }

    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    // Handle network errors (Failed to fetch)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    }
    throw error;
  }
}

