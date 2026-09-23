// ==========================================
// Bondhu - WebRTC Voice/Video Call
// Firebase Realtime DB as signaling server
// ==========================================

import { rtdb, auth } from "./firebase-config.js";
import {
  ref, set, push, onValue, onChildAdded, remove, get, off, serverTimestamp, onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" }
  ]
};

let peerConnection = null;
let localStream = null;
let currentCallId = null;
let currentRole = null; // "caller" | "callee"
let remoteStream = null;
let callListeners = [];

// ==========================================
// Helpers
// ==========================================
function genCallId() {
  return "call_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
}

async function getMedia(type) {
  const constraints = type === "video"
    ? { audio: true, video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } }
    : { audio: true, video: false };
  return await navigator.mediaDevices.getUserMedia(constraints);
}

function createPC(onRemoteStream, onICEConnectionChange) {
  const pc = new RTCPeerConnection(ICE_SERVERS);

  pc.ontrack = (event) => {
    if (!remoteStream) remoteStream = new MediaStream();
    event.streams[0].getTracks().forEach(track => {
      remoteStream.addTrack(track);
    });
    if (onRemoteStream) onRemoteStream(remoteStream);
  };

  pc.oniceconnectionstatechange = () => {
    if (onICEConnectionChange) onICEConnectionChange(pc.iceConnectionState);
    if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
      // Attempt ICE restart on failed
      if (pc.iceConnectionState === "failed") {
        pc.restartIce();
      }
    }
  };

  return pc;
}

// ==========================================
// START CALL (Caller side)
// ==========================================
export async function startCall(calleeUid, type, callbacks = {}) {
  const me = auth.currentUser;
  if (!me) throw new Error("লগইন করুন");

  const {
    onRemoteStream,
    onICEConnectionChange,
    onError,
    onEnded
  } = callbacks;

  try {
    callListeners.forEach(l => { try { l(); } catch (e) {} });
    callListeners = [];

    const callId = genCallId();
    currentCallId = callId;
    currentRole = "caller";
    remoteStream = null;

    // Get local media
    localStream = await getMedia(type);

    // Create PC
    peerConnection = createPC(onRemoteStream, (state) => {
      if (onICEConnectionChange) onICEConnectionChange(state);
      if (state === "connected" && onError) {
        // Notify success
      }
    });

    // Add local tracks
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    // Save call metadata to RTDB
    const callData = {
      callerId: me.uid,
      callerName: me.displayName || "User",
      callerUsername: (me.email || "").split("@")[0],
      calleeId: calleeUid,
      type: type,
      status: "ringing",
      createdAt: Date.now()
    };
    await set(ref(rtdb, `calls/${callId}`), callData);

    // Auto-cleanup if caller disconnects
    onDisconnect(ref(rtdb, `calls/${callId}/callerOnline`)).set(false);
    set(ref(rtdb, `calls/${callId}/callerOnline`), true);

    // Create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    await set(ref(rtdb, `calls/${callId}/offer`), {
      type: offer.type,
      sdp: offer.sdp
    });

    // Send ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        push(ref(rtdb, `calls/${callId}/callerCandidates`), event.candidate.toJSON());
      }
    };

    // Listen for answer
    const answerRef = ref(rtdb, `calls/${callId}/answer`);
    const unsubAnswer = onValue(answerRef, async (snapshot) => {
      const answer = snapshot.val();
      if (answer && peerConnection && peerConnection.signalingState !== "stable") {
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (e) {
          console.warn("setRemoteDescription fail:", e);
        }
      }
    });

    // Listen for callee ICE
    const calleeCandRef = ref(rtdb, `calls/${callId}/calleeCandidates`);
    const unsubCand = onChildAdded(calleeCandRef, async (snapshot) => {
      const cand = snapshot.val();
      if (cand && peerConnection) {
        try { await peerConnection.addIceCandidate(new RTCIceCandidate(cand)); }
        catch (e) { console.warn("addIceCandidate fail:", e); }
      }
    });

    // Listen for call end (callee deleted or status changed)
    const callRef = ref(rtdb, `calls/${callId}`);
    const unsubEnd = onValue(callRef, (snap) => {
      const val = snap.val();
      if (!val || val.status === "ended" || val.status === "rejected") {
        if (onEnded) onEnded();
        cleanupCall();
      }
    });

    callListeners.push(unsubAnswer, unsubCand, unsubEnd);

    return { callId, localStream };
  } catch (e) {
    cleanupCall();
    if (onError) onError(e);
    throw e;
  }
}

// ==========================================
// LISTEN FOR INCOMING CALLS (Callee side)
// ==========================================
export function listenIncomingCalls(uid, onIncoming) {
  if (!uid) return () => {};

  const callsRef = ref(rtdb, "calls");
  let lastNotifiedCallId = null;

  const unsub = onValue(callsRef, (snapshot) => {
    const calls = snapshot.val() || {};
    for (const [callId, call] of Object.entries(calls)) {
      if (call.calleeId === uid && call.status === "ringing" && callId !== lastNotifiedCallId) {
        lastNotifiedCallId = callId;
        onIncoming(callId, call);
        break;
      }
    }
  });

  return () => off(callsRef, "value", unsub);
}

// ==========================================
// ACCEPT CALL (Callee side)
// ==========================================
export async function acceptCall(callId, callbacks = {}) {
  const me = auth.currentUser;
  if (!me) throw new Error("লগইন করুন");

  const {
    onRemoteStream,
    onICEConnectionChange,
    onError,
    onEnded
  } = callbacks;

  try {
    callListeners.forEach(l => { try { l(); } catch (e) {} });
    callListeners = [];

    currentCallId = callId;
    currentRole = "callee";
    remoteStream = null;

    // Get call data
    const callSnap = await get(ref(rtdb, `calls/${callId}`));
    const callData = callSnap.val();
    if (!callData) throw new Error("কল পাওয়া যায়নি");

    // Get local media
    localStream = await getMedia(callData.type);

    // Create PC
    peerConnection = createPC(onRemoteStream, onICEConnectionChange);
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    // Get offer, set remote description
    const offer = callData.offer;
    if (!offer) throw new Error("Offer পাওয়া যায়নি");
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    // Create answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    await set(ref(rtdb, `calls/${callId}/answer`), {
      type: answer.type,
      sdp: answer.sdp
    });

    // Update status
    await set(ref(rtdb, `calls/${callId}/status`), "active");
    await set(ref(rtdb, `calls/${callId}/acceptedAt`), Date.now());
    onDisconnect(ref(rtdb, `calls/${callId}/calleeOnline`)).set(false);
    set(ref(rtdb, `calls/${callId}/calleeOnline`), true);

    // Send ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        push(ref(rtdb, `calls/${callId}/calleeCandidates`), event.candidate.toJSON());
      }
    };

    // Listen for caller ICE
    const callerCandRef = ref(rtdb, `calls/${callId}/callerCandidates`);
    const unsubCand = onChildAdded(callerCandRef, async (snapshot) => {
      const cand = snapshot.val();
      if (cand && peerConnection) {
        try { await peerConnection.addIceCandidate(new RTCIceCandidate(cand)); }
        catch (e) { console.warn("addIceCandidate fail:", e); }
      }
    });

    // Listen for call end
    const callRef = ref(rtdb, `calls/${callId}`);
    const unsubEnd = onValue(callRef, (snap) => {
      const val = snap.val();
      if (!val || val.status === "ended") {
        if (onEnded) onEnded();
        cleanupCall();
      }
    });

    callListeners.push(unsubCand, unsubEnd);

    return { callId, localStream };
  } catch (e) {
    cleanupCall();
    if (onError) onError(e);
    throw e;
  }
}

// ==========================================
// REJECT CALL
// ==========================================
export async function rejectCall(callId) {
  try {
    await set(ref(rtdb, `calls/${callId}/status`), "rejected");
    await remove(ref(rtdb, `calls/${callId}`));
  } catch (e) {}
  cleanupCall();
}

// ==========================================
// END CALL
// ==========================================
export async function endCall() {
  if (currentCallId) {
    try {
      await set(ref(rtdb, `calls/${currentCallId}/status`), "ended");
      await remove(ref(rtdb, `calls/${currentCallId}`));
    } catch (e) {}
  }
  cleanupCall();
}

// ==========================================
// CLEANUP
// ==========================================
export function cleanupCall() {
  try {
    if (peerConnection) {
      peerConnection.onicecandidate = null;
      peerConnection.ontrack = null;
      peerConnection.oniceconnectionstatechange = null;
      peerConnection.close();
      peerConnection = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      localStream = null;
    }
    remoteStream = null;
    currentCallId = null;
    currentRole = null;
    callListeners.forEach(l => { try { l(); } catch (e) {} });
    callListeners = [];
  } catch (e) {
    console.warn("cleanup error:", e);
  }
}

// ==========================================
// TOGGLE MUTE / VIDEO
// ==========================================
export function toggleMute() {
  if (!localStream) return false;
  const audioTrack = localStream.getAudioTracks()[0];
  if (!audioTrack) return false;
  audioTrack.enabled = !audioTrack.enabled;
  return !audioTrack.enabled; // returns true if muted
}

export function toggleVideo() {
  if (!localStream) return false;
  const videoTrack = localStream.getVideoTracks()[0];
  if (!videoTrack) return false;
  videoTrack.enabled = !videoTrack.enabled;
  return !videoTrack.enabled; // returns true if video off
}

export function getLocalStream() { return localStream; }
export function getRemoteStream() { return remoteStream; }
export function getCurrentCallId() { return currentCallId; }
export function getCurrentRole() { return currentRole; }
