const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const API_BASE_URL = API_URL;

interface FetchOptions extends RequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

export async function apiFetch(url: string, options?: string | FetchOptions | "GET" | "POST" | "PUT" | "DELETE", body?: any) {
  // Support both 'access_token' (LINE Login) and 'token' (normal login)
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");

  // Support both old style: apiFetch(url, method, body) and new style: apiFetch(url, options)
  let method = "GET";
  let requestBody: any = undefined;
  let headers: Record<string, string> = {
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  if (!token) {
    console.warn('[apiFetch] ⚠️ No token found in localStorage');
  } else {
    console.log('[apiFetch] ✅ Token found. Length:', token.length);
    console.log('[apiFetch] ✅ Authorization header will be sent:', `Bearer ${token.substring(0, 30)}...`);
  }

  if (typeof options === "string") {
    // Old style: apiFetch(url, method, body)
    method = options;
    requestBody = body ? JSON.stringify(body) : undefined;
    headers["Content-Type"] = "application/json";
  } else if (typeof options === "object" && options !== null) {
    // New style: apiFetch(url, { method, body, headers, ... })
    method = options.method || "GET";
    headers = {
      ...headers,
      ...options.headers,
    };
    // Handle body - can be string, object, or FormData
    if (options.body) {
      if (options.body instanceof FormData) {
        // FormData - let browser set Content-Type automatically with boundary
        requestBody = options.body;
        // Don't set Content-Type header for FormData
        delete headers["Content-Type"];
      } else if (typeof options.body === "string") {
        requestBody = options.body;
        headers["Content-Type"] = "application/json";
      } else {
        // Object - convert to JSON
        requestBody = JSON.stringify(options.body);
        headers["Content-Type"] = "application/json";
      }
    } else if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
  } else {
    headers["Content-Type"] = "application/json";
  }

  console.log(`[apiFetch] 📤 ${method} ${API_URL}${url}`);
  console.log('[apiFetch] 📋 Headers:', {
    'Authorization': headers['Authorization'] ? 'SET' : 'NOT SET',
    'Content-Type': headers['Content-Type'] || 'default'
  });

  const res = await fetch(API_URL + url, {
    method,
    headers,
    body: requestBody,
  });

  console.log(`[apiFetch] 📥 Response status: ${res.status} ${res.statusText}`);

  // Handle error responses
  if (!res.ok) {
    try {
      // Clone the response to read it multiple times
      const clonedRes = res.clone();
      const error = await clonedRes.json();
      console.error(`[apiFetch] ❌ Error response body:`, error);
      throw new Error(error.message || `API Error: ${res.status}`);
    } catch (parseError) {
      // If response isn't JSON, use status text
      const text = await res.text();
      console.error(`[apiFetch] ❌ Error response text:`, text);
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }
  }

  // Handle successful responses
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = await res.json();
    console.log(`[apiFetch] ✅ Success response received`);
    return data;
  }

  // If no content-type or not JSON, return null (for 204 No Content, etc.)
  const text = await res.text();
  const result = text ? JSON.parse(text) : null;
  console.log(`[apiFetch] ✅ Text response received`);
  return result;
}

