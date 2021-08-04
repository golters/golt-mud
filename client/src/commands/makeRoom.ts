import {
  MAKE_ROOM_EVENT,
} from "../../../events"
import {
  pushErrorToLog,
} from "../components/Terminal"
import {
  sendEvent, 
} from "../network"
import {
  CommandModule, 
} from "./emitter"

export const MakeRoom: CommandModule = {
  command: "makeroom",
  syntax: "makeroom [room name]",

  callback ({ args }) {
    const [name] = args

    if (!name) {
      pushErrorToLog(`Syntax: ${MakeRoom.syntax}`)

      return
    }

    sendEvent(MAKE_ROOM_EVENT, name.trim())
  },
}
