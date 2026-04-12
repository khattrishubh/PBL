import { toast } from "sonner";

const API_BASE = "http://localhost:5001/api";

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    // Prepare fetch options, handling FormData specially
    const fetchOptions: RequestInit = { ...options };
    // If body is FormData, let the browser set the correct multipart headers
    if (options.body instanceof FormData) {
      // Remove any manually set Content-Type to allow automatic boundary handling
      const { headers, ...rest } = fetchOptions;
      fetchOptions.headers = { ...(headers || {}) };
    } else {
      // Default to JSON for non-FormData bodies
      fetchOptions.headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      };
    }
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const text = await response.text();
      const error = text ? JSON.parse(text) : { error: "Something went wrong" };
      throw new Error(error.error || "Something went wrong");
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (err) {
    const message = (err as Error).message;
    toast.error(`API Error: ${message}`);
    throw err;
  }
}

// Log system activity automatically
export async function logActivity(data: {
  actionType: string;
  actionLabel: string;
  file: string;
  user: string;
  status: string;
  txId?: string;
  onChain?: boolean;
}) {
  try {
    await apiFetch("/activity", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
