// Use environment variable, or fallback to production URL, then localhost for dev
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Check if running on localhost or local network IP (IPv4)
    // 192.168.x.x is common for home/office networks
    // 10.x.x.x and 172.16-31.x.x are also private ranges
    const isLocalNetwork = 
      hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname.startsWith('192.168.') || 
      hostname.startsWith('10.') || 
      (hostname.startsWith('172.') && parseInt(hostname.split('.')[1], 10) >= 16 && parseInt(hostname.split('.')[1], 10) <= 31);

    if (isLocalNetwork) {
      // Use the same hostname but port 3001 (Backend)
      // Note: Backend default is usually 3000, but frontend was hardcoded to 3001. 
      // If connection fails, check if backend is running on 3000 or 3001.
      return `http://${hostname}:3001`;
    }
  }

  // Fallback to production
  return 'https://rp-trr-server-internship.vercel.app';
};

const API_URL = getBaseUrl();

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
      if (res.status === 401) {
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          localStorage.removeItem('token');
          localStorage.removeItem('access_token');
          localStorage.removeItem('role');
          window.location.href = '/login';
          throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        }
      }

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

