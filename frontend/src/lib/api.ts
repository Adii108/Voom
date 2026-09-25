/**
 * API Client for interacting with the Voom FastAPI backend.
 *
 * In the browser: uses relative URLs ("") so requests automatically go
 * to the current origin (localhost:3000 or the public Cloudflare tunnel).
 * Next.js rewrites in next.config.ts reverse-proxy /api to FastAPI on port 8000.
 *
 * On the server (SSR): falls back to NEXT_PUBLIC_API_URL or http://127.0.0.1:8000.
 */

const API_BASE =
  typeof window !== "undefined"
    ? ""
    : process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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

  /** Lookup meeting details by code */
  getMeetingByCode: (code: string) =>
    request<Meeting>(`/api/meetings/${encodeURIComponent(code)}`),

  /** Join a meeting with a display name */
  joinMeeting: (code: string, displayName: string) =>
    request<JoinMeetingResponse>(
      `/api/meetings/${encodeURIComponent(code)}/join`,
      {
        method: "POST",
        body: JSON.stringify({ display_name: displayName }),
      }
    ),

  /** Post a WebRTC signaling message */
  sendSignal: (code: string, payload: SignalMessagePayload) =>
    request<{ status: string; recipients: number; active_peers: Array<{ id: string; name: string }> }>(
      `/api/meetings/${encodeURIComponent(code)}/signal`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ),

  /** Poll for pending WebRTC signaling messages */
  getSignals: (code: string, participantId: string, participantName: string) =>
    request<{
      messages: SignalMessagePayload[];
      active_peers: Array<{ id: string; name: string }>;
      server_time: number;
    }>(
      `/api/meetings/${encodeURIComponent(code)}/signal?participant_id=${encodeURIComponent(
        participantId
      )}&participant_name=${encodeURIComponent(participantName)}`
    ),

  /** Leave meeting room signaling */
  leaveRoom: (code: string, participantId: string) =>
    request<{ status: string }>(
      `/api/meetings/${encodeURIComponent(code)}/leave?participant_id=${encodeURIComponent(
        participantId
      )}`,
      { method: "POST" }
    ),
};
