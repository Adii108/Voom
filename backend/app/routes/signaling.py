"""Signaling router for WebRTC peer-to-peer negotiation.

Supports:
1. HTTP signaling (POST /api/meetings/{code}/signal and GET /api/meetings/{code}/signal)
   - Works through single-port HTTP tunnels and serverless/CDN setups
2. WebSocket signaling (/ws/meeting/{code}/{participant_id})
   - For direct connections and persistent duplex communication

All room codes are strictly normalized to lowercase to prevent room fragmentation.
Rooms are automatically garbage-collected when all participants disconnect.
"""

import asyncio
import time
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

router = APIRouter(tags=["signaling"])


class SignalMessage(BaseModel):
    sender_id: str
    sender_name: str
    target_id: str | None = None  # None means broadcast to all other peers in the room
    type: str  # 'join', 'offer', 'answer', 'ice-candidate', 'chat', 'media-state', 'leave'
    data: Any = None
    timestamp: float | None = None


# In-memory room store: normalized_room_code -> { participant_id: { "name": str, "joined_at": float, "last_seen": float, "queue": [SignalMessage] } }
rooms: Dict[str, Dict[str, Dict[str, Any]]] = {}

# Active WebSocket connections: { (normalized_room_code, participant_id): WebSocket }
active_websockets: Dict[tuple[str, str], WebSocket] = {}


def get_room(room_code: str) -> Dict[str, Dict[str, Any]]:
    clean = room_code.strip().lower()
    if clean not in rooms:
        rooms[clean] = {}
    return rooms[clean]


def cleanup_stale_participants(room_code: str):
    """Remove participants inactive for more than 120 seconds and clear empty rooms.
    
    120s timeout allows background tabs (which browser engines throttle) and
    temporary network blips to maintain their session without disconnecting.
    """
    clean = room_code.strip().lower()
    if clean not in rooms:
        return
    now = time.time()
    room = rooms[clean]
    stale_ids = [
        pid for pid, pdata in room.items()
        if now - pdata.get("last_seen", now) > 120
    ]
    for pid in stale_ids:
        del room[pid]
    if len(room) == 0:
        rooms.pop(clean, None)


@router.post("/api/meetings/{code}/signal")
async def send_signal(code: str, message: SignalMessage):
    """Post a signaling message to a meeting room."""
    clean_code = code.strip().lower()
    room = get_room(clean_code)
    cleanup_stale_participants(clean_code)

    now = time.time()
    message.timestamp = now

    # Ensure sender is registered and update heartbeat
    if message.sender_id not in room:
        room[message.sender_id] = {
            "name": message.sender_name,
            "joined_at": now,
            "last_seen": now,
            "queue": [],
        }
    else:
        room[message.sender_id]["last_seen"] = now

    # Route message to targets
    delivered_count = 0
    for pid, pdata in room.items():
        if pid == message.sender_id:
            continue
        if message.target_id is None or message.target_id == pid:
            # Deliver to in-memory queue
            pdata["queue"].append(message.model_dump())
            delivered_count += 1

            # Also push to WebSocket if this peer is connected via WS
            ws = active_websockets.get((clean_code, pid))
            if ws:
                try:
                    await ws.send_json(message.model_dump())
                except Exception:
                    pass

    return {
        "status": "delivered",
        "recipients": delivered_count,
        "active_peers": [
            {"id": pid, "name": pdata["name"]}
            for pid, pdata in room.items()
            if pid != message.sender_id
        ],
    }


@router.get("/api/meetings/{code}/signal")
async def get_signals(
    code: str,
    participant_id: str = Query(...),
    participant_name: str = Query("Guest"),
    since: float = Query(0.0),
):
    """Retrieve pending signaling messages for a participant."""
    clean_code = code.strip().lower()
    room = get_room(clean_code)
    cleanup_stale_participants(clean_code)
    now = time.time()

    if participant_id not in room:
        room[participant_id] = {
            "name": participant_name,
            "joined_at": now,
            "last_seen": now,
            "queue": [],
        }
        # Announce join to other participants in this specific room
        join_msg = {
            "sender_id": participant_id,
            "sender_name": participant_name,
            "target_id": None,
            "type": "peer-joined",
            "data": {"id": participant_id, "name": participant_name},
            "timestamp": now,
        }
        for pid, pdata in room.items():
            if pid != participant_id:
                pdata["queue"].append(join_msg)
                ws = active_websockets.get((clean_code, pid))
                if ws:
                    try:
                        await ws.send_json(join_msg)
                    except Exception:
                        pass
    else:
        room[participant_id]["last_seen"] = now
        room[participant_id]["name"] = participant_name

    pdata = room[participant_id]
    messages = pdata["queue"]
    pdata["queue"] = []  # Clear fetched messages

    active_peers = [
        {"id": pid, "name": pd["name"]}
        for pid, pd in room.items()
        if pid != participant_id
    ]

    return {
        "messages": messages,
        "active_peers": active_peers,
        "server_time": now,
    }


@router.post("/api/meetings/{code}/leave")
async def leave_room(code: str, participant_id: str = Query(...)):
    """Gracefully unregister a participant from the room."""
    clean_code = code.strip().lower()
    if clean_code in rooms:
        room = rooms[clean_code]
        if participant_id in room:
            name = room[participant_id]["name"]
            del room[participant_id]
            now = time.time()
            leave_msg = {
                "sender_id": participant_id,
                "sender_name": name,
                "target_id": None,
                "type": "leave",
                "data": {"id": participant_id},
                "timestamp": now,
            }
            for pid, pdata in room.items():
                pdata["queue"].append(leave_msg)
                ws = active_websockets.get((clean_code, pid))
                if ws:
                    try:
                        await ws.send_json(leave_msg)
                    except Exception:
                        pass
        if len(room) == 0:
            rooms.pop(clean_code, None)
    return {"status": "left"}


@router.websocket("/ws/meeting/{code}/{participant_id}")
async def websocket_signaling(websocket: WebSocket, code: str, participant_id: str):
    """Full-duplex WebSocket signaling connection."""
    await websocket.accept()
    clean_code = code.strip().lower()
    room = get_room(clean_code)
    active_websockets[(clean_code, participant_id)] = websocket

    now = time.time()
    name = f"Peer-{participant_id[:4]}"
    room[participant_id] = {
        "name": name,
        "joined_at": now,
        "last_seen": now,
        "queue": [],
    }

    join_notification = {
        "sender_id": participant_id,
        "sender_name": name,
        "target_id": None,
        "type": "peer-joined",
        "data": {"id": participant_id, "name": name},
        "timestamp": now,
    }
    for pid, pdata in room.items():
        if pid != participant_id:
            ws = active_websockets.get((clean_code, pid))
            if ws:
                try:
                    await ws.send_json(join_notification)
                except Exception:
                    pass

    try:
        while True:
            data = await websocket.receive_json()
            data["sender_id"] = participant_id
            data["timestamp"] = time.time()
            target = data.get("target_id")

            for pid in room:
                if pid == participant_id:
                    continue
                if target is None or target == pid:
                    ws = active_websockets.get((clean_code, pid))
                    if ws:
                        await ws.send_json(data)
                    else:
                        room[pid]["queue"].append(data)
    except WebSocketDisconnect:
        pass
    finally:
        active_websockets.pop((clean_code, participant_id), None)
        if participant_id in room:
            del room[participant_id]
        leave_notification = {
            "sender_id": participant_id,
            "sender_name": name,
            "target_id": None,
            "type": "leave",
            "data": {"id": participant_id},
            "timestamp": time.time(),
        }
        for pid in room:
            ws = active_websockets.get((clean_code, pid))
            if ws:
                try:
                    await ws.send_json(leave_notification)
                except Exception:
                    pass
        if len(room) == 0:
            rooms.pop(clean_code, None)
