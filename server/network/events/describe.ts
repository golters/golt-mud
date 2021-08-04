import {
  networkEmitter, NetworkEventHandler,
} from "./emitter"
import {
  sendEvent,
} from ".."
import {
  ROOM_DESCRIBE_EVENT, ERROR_EVENT,
} from "../../../events"
import {
  Player,
} from "../../../@types"
import {
  ROOM_MAX_BIO,
} from "../../../constants"
import {
  getRoomById,
  editBio,
} from "../../services/room"

const handler: NetworkEventHandler = async (
  socket,
  bio: string,
  player: Player,
) => {
  try {
    const room = await getRoomById(player.roomId)
    const oldBio = room?.description

    if (bio.length > ROOM_MAX_BIO) {
      throw new Error(`Description must not be greater than ${ROOM_MAX_BIO} characters`)
    }

    if (oldBio === undefined) {
      return
    }

    const checked = new Array<number>()

    for (let i = 0; i < bio.length; i++) {
      for (let b = 0; b < oldBio?.length; b++) {
        if (!checked.includes(b)) {
          if (i <= oldBio?.length && i <= bio.length) {
            if (bio.charAt(i) === oldBio.charAt(b)) {
              checked.push(b)
              console.log(oldBio.charAt(b) + " " + b)
              break
            }
          }
        }
      }
    }

    const remainder = bio.length > oldBio?.length 
      ? (ROOM_MAX_BIO - oldBio?.length) - (ROOM_MAX_BIO - bio?.length)
      : 0

    const cost = (oldBio?.length - checked.length) + remainder

    if (cost > 50) {
      throw new Error("This edit is too much, try to change/add under 50 characters at a time")
    }

    await editBio(bio, room)
  } catch (error) {
    sendEvent<string>(socket, ERROR_EVENT, error.message)
    console.error(error)
  }
}

networkEmitter.on(ROOM_DESCRIBE_EVENT, handler)
