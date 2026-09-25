/**
 * WebRTC and ICE Configuration for Voom.
 *
 * Includes public STUN servers for NAT traversal across different
 * Wi-Fi networks and mobile carriers (Google + Cloudflare).
 */

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
  ],
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
