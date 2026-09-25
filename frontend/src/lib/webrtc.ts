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
  onTrack: (event: RTCTrackEvent) => void;
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void;
  onSignalingStateChange?: (state: RTCSignalingState) => void;
}

export function createPeerConnection(handlers: WebRTCPeerHandlers): RTCPeerConnection {
  const pc = new RTCPeerConnection(RTC_CONFIG);

  pc.ontrack = (event) => {
    console.log(
      `[WebRTC] REMOTE TRACK RECEIVED: kind=${event.track.kind}, id=${event.track.id}, streams=${event.streams.length}`
    );
    handlers.onTrack(event);
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log(`[WebRTC] ICE CANDIDATE GENERATED: ${event.candidate.candidate.substring(0, 50)}...`);
      handlers.onIceCandidate(event.candidate);
    } else {
      console.log("[WebRTC] ICE candidate gathering complete (null candidate)");
    }
  };

  pc.onconnectionstatechange = () => {
    console.log(`[WebRTC] PEER CONNECTION STATE: ${pc.connectionState}`);
    handlers.onConnectionStateChange?.(pc.connectionState);
  };

  pc.oniceconnectionstatechange = () => {
    console.log(`[WebRTC] ICE CONNECTION STATE: ${pc.iceConnectionState}`);
    handlers.onIceConnectionStateChange?.(pc.iceConnectionState);
  };

  pc.onsignalingstatechange = () => {
    console.log(`[WebRTC] SIGNALING STATE: ${pc.signalingState}`);
    handlers.onSignalingStateChange?.(pc.signalingState);
  };

  return pc;
}

