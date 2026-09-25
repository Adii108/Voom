/**
 * API Client for interacting with the Voom FastAPI backend.
 *
 * In the browser: uses relative URLs ("") so requests automatically go
 * to the current origin (localhost:3000 or the public Cloudflare tunnel).
 * Next.js rewrites in next.config.ts reverse-proxy /api to FastAPI on port 8000.
 *
 * On the server (SSR): falls back to NEXT_PUBLIC_API_URL or http://127.0.0.1:8000.
 */

const rawBase =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? "" : "http://127.0.0.1:8000");
const API_BASE = rawBase.replace(/\/+$/, "");

export function generateUniqueRoomCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const getRandomPart = (len: number) => {
    let res = "";
    if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
      const bytes = new Uint8Array(len);
      window.crypto.getRandomValues(bytes);
      for (let i = 0; i < len; i++) {
        res += chars[bytes[i] % chars.length];
      }
    } else {
      for (let i = 0; i < len; i++) {
        res += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    return res;
  };
  return `vom-${getRandomPart(3)}-${getRandomPart(4)}-${getRandomPart(3)}`;
}

export interface Participant {
  id: number;
  display_name: string;
  joined_at: string;
}

export interface Meeting {
  id: number;
  meeting_code: string;
  title: string | None;
  description: string | None;
  meeting_type: "instant" | "scheduled";
  status: "waiting" | "active" | "ended";
  scheduled_at: string | None;
  duration: number | None;
  meeting_link: string;
  created_at: string;
  participants: Participant[];
}

export interface JoinMeetingResponse {
  meeting: Meeting;
  participant: Participant;
}

export interface SchedulePayload {
  title: string;
  description?: string;
  scheduled_at: string;
  duration: number;
}

export interface SignalMessagePayload {
  sender_id: string;
  sender_name: string;
  target_id?: string | null;
  type: string;
  data?: any;
}

type None = null;

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = `API Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        if (typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail
            .map((e: { msg: string; loc?: string[] }) => e.msg)
            .join(", ");
        }
      }
    } catch {
      // Fallback to HTTP error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  /** Create an instant meeting */
  createInstantMeeting: () =>
    request<Meeting>("/api/meetings/instant", { method: "POST" }),

  /** Schedule a meeting */
  scheduleMeeting: (data: SchedulePayload) =>
    request<Meeting>("/api/meetings/schedule", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** Get upcoming meetings list */
  getUpcomingMeetings: () => request<Meeting[]>("/api/meetings/upcoming"),

  /** Get recent meetings list */
  getRecentMeetings: () => request<Meeting[]>("/api/meetings/recent"),

  /** Lookup meeting details by code (normalized lowercase) */
  getMeetingByCode: (code: string) => {
    const clean = code.trim().toLowerCase();
    return request<Meeting>(`/api/meetings/${encodeURIComponent(clean)}`);
  },

  /** Join a meeting with a display name */
  joinMeeting: (code: string, displayName: string) => {
    const clean = code.trim().toLowerCase();
    return request<JoinMeetingResponse>(
      `/api/meetings/${encodeURIComponent(clean)}/join`,
      {
        method: "POST",
        body: JSON.stringify({ display_name: displayName }),
      }
    );
  },

  /** Post a WebRTC signaling message */
  sendSignal: (code: string, payload: SignalMessagePayload) => {
    const clean = code.trim().toLowerCase();
    return request<{ status: string; recipients: number; active_peers: Array<{ id: string; name: string }> }>(
      `/api/meetings/${encodeURIComponent(clean)}/signal`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  /** Poll for pending WebRTC signaling messages */
  getSignals: (code: string, participantId: string, participantName: string) => {
    const clean = code.trim().toLowerCase();
    return request<{
      messages: SignalMessagePayload[];
      active_peers: Array<{ id: string; name: string }>;
      server_time: number;
    }>(
      `/api/meetings/${encodeURIComponent(clean)}/signal?participant_id=${encodeURIComponent(
        participantId
      )}&participant_name=${encodeURIComponent(participantName)}`
    );
  },

  /** Leave meeting room signaling */
  leaveRoom: (code: string, participantId: string) => {
    const clean = code.trim().toLowerCase();
    return request<{ status: string }>(
      `/api/meetings/${encodeURIComponent(clean)}/leave?participant_id=${encodeURIComponent(
        participantId
      )}`,
      { method: "POST", keepalive: true }
    );
  },
};
