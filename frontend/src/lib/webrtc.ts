/**
 * WebRTC and ICE Configuration for Zoom Clone.
 *
 * Includes public STUN servers for NAT traversal across different
 * Wi-Fi networks and mobile carriers (Google + Cloudflare).
 * Supports optional production TURN server via environment variables:
 * NEXT_PUBLIC_TURN_URL, NEXT_PUBLIC_TURN_USERNAME, NEXT_PUBLIC_TURN_CREDENTIAL
 */

const baseIceServers: RTCIceServer[] = [
  // Google Public STUN
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
  // Cloudflare STUN
  { urls: "stun:stun.cloudflare.com:3478" },
  // Mozilla STUN
  { urls: "stun:stun.services.mozilla.com:3478" },
  // Public Metered free TURN relay (crucial for connecting mobile data to home Wi-Fi across symmetric NAT)
  {
    urls: [
      "turn:standard.relay.metered.ca:80",
      "turn:standard.relay.metered.ca:443",
      "turn:standard.relay.metered.ca:443?transport=tcp",
    ],
    username: "e229bbad56f8f5339d6756ee",
    credential: "V476WkWfE8k5N5z+",
  },
];

if (process.env.NEXT_PUBLIC_TURN_URL) {
  baseIceServers.push({
    urls: process.env.NEXT_PUBLIC_TURN_URL,
    username: process.env.NEXT_PUBLIC_TURN_USERNAME,
    credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
  });
}


export const RTC_CONFIG: RTCConfiguration = {
  iceServers: baseIceServers,
  iceCandidatePoolSize: 10,
};

export interface WebRTCPeerHandlers {
  onTrack: (stream: MediaStream) => void;
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
}

export function createPeerConnection(handlers: WebRTCPeerHandlers): RTCPeerConnection {
  const pc = new RTCPeerConnection(RTC_CONFIG);

  pc.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      handlers.onTrack(event.streams[0]);
    } else if (event.track) {
      const stream = new MediaStream([event.track]);
      handlers.onTrack(stream);
    }
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      handlers.onIceCandidate(event.candidate);
    }
  };

  if (handlers.onConnectionStateChange) {
    pc.onconnectionstatechange = () => {
      handlers.onConnectionStateChange?.(pc.connectionState);
    };
  }

  return pc;
}
