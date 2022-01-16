import {
  networkEmitter, NetworkEventHandler,
} from "./emitter"
import {
  ERROR_EVENT,
  TP_EVENT,
  ROOM_UPDATE_EVENT,
  SERVER_LOG_EVENT,
  LOG_EVENT,
} from "../../../events"
import {
  broadcastToRoom,
  sendEvent,
} from "../../network"
import {
  setPlayerRoomByName,
} from "../../services/player"
import {
  getRoomById,
  lookByID,
} from "../../services/room"
import { Room } from "@types"

const handler: NetworkEventHandler = async (socket, roomNameInput: string, player) => {
  try {
    const oldRoom = await getRoomById(player.roomId)

    if (!oldRoom) {
      sendEvent<string>(socket, ERROR_EVENT, "Room doesn't exist")

      return
    }

    const roomName = roomNameInput.replace(/\s/g, "_")

    if (oldRoom.name === roomName) {
      return
    }

    const room = await setPlayerRoomByName(player.id, roomName)

    const message = await lookByID(room.id)

    broadcastToRoom<Room>(ROOM_UPDATE_EVENT, oldRoom, oldRoom.id)
    broadcastToRoom<string>(SERVER_LOG_EVENT, `${player.username} has teleported from ${oldRoom.name}`, oldRoom.id)
    broadcastToRoom<Room>(ROOM_UPDATE_EVENT, room, room.id)
    broadcastToRoom<string>(SERVER_LOG_EVENT, `${player.username} has teleported into ${room.name}`, room.id)
    sendEvent<string>(socket, LOG_EVENT, message)    
  } catch (error) {
    sendEvent<string>(socket, ERROR_EVENT, error.message)
    console.error(error)
  }
}

networkEmitter.on(TP_EVENT, handler)
