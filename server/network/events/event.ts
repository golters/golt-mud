import {
  networkEmitter, NetworkEventHandler,
} from "./emitter"
import {
  broadcastToUser,
  broadcastToRoom,
  broadcast,
  sendEvent,
  online,
} from ".."
import {
  EVENT_EVENT,
  SERVER_LOG_EVENT,
  ERROR_EVENT,
  LOG_EVENT,
  NOTIFICATION_EVENT,
  GAME_UPDATE_EVENT,
  BANNER_UPDATE_EVENT,
  ROOM_UPDATE_EVENT,
  CHAT_EVENT,
  EVENT_UPDATE_EVENT,
} from "../../../events"
import {
  Player,
  Room,
  Chat,
} from "../../../@types"
import {
  clearOldEvents,
  createEvent, createEventTag, createRandomEvent, fishWinner, getCurrentEvent, getUpcomingEvents, givePoints, moveZombies,
  getEventTag,
  bitePlayer,
  endEvent,
} from "../../services/event"
import {
  insertRoomChat,
} from "../../services/chat"
import { getRoomById } from "../../services/room"
import { createItem, setItemBio } from "../../services/item"

const fishTypes =[
  "trout",
  "carp",
  "bass",
  "cod",
  "herring",
  "eel",
  "tuna",
  "haddock",
  "fish",
  "shark",
  "dolphin",
  "whale",
  "crab",
  "lobster",
  "shrimp",
  "squid",
  "mermaid",
  "kraken",
  "seagul",
  "ray",
]

const handler: NetworkEventHandler = async (
  socket,
  input: string,
  player: Player,
) => {
  try {   
    const args = input.split(" ")

    const {
      username,
    } = player

    const chat: Chat = {
      player: {
        username,
      },
      message: input,
      date: Date.now(),
      recipiant: null,
      type: "chat",
    }
  
    const now = new Date();
    
    const event = await getCurrentEvent(Date.now())
    switch(args[0]){
      case "/event":
        switch(args[1]){
          case "list":
            const events = await getUpcomingEvents(Date.now());
            let list = ""
            for (let i = 0; i < events.length; i++) {
              list = list + events[i].type + " starting:" + new Date(events[i].start) + " ending:" + new Date(events[i].end) + " , "
            }
            if(events.length === 0){
              list = "there are no upcoming events"
            }
            broadcastToUser<string>(SERVER_LOG_EVENT, list, player.username); 
  
            return;
          case "check":
            await clearOldEvents(Date.now())
            const event = await getCurrentEvent(Date.now())
            if(event){
              sendEvent<Event>(socket, EVENT_UPDATE_EVENT, event)
            }else{
              const events = await getUpcomingEvents(Date.now());
              if(events.length === 0){
                await createRandomEvent(Date.now())

              }else{         
                sendEvent<Event>(socket, EVENT_UPDATE_EVENT, events[0])
              }
            }
            
            return;
        }

        return;
      case "/fish":
        if(event && event.type === "Fishing_Tournament"){
          const fishSucess = Math.random() * 100
          if(fishSucess > 99-((Number(String(player.roomId).slice(-1))/2)*10)){
            const room = await (await getRoomById(player.roomId)).name
            const roomarray = room.split(/(?:-|_| )+/)
            for(let i = 0; i < roomarray.length; i++){
              if(Number.isNaN(roomarray[i])){
                delete roomarray[i]
              }
              if(roomarray[i].length === 1){
                delete roomarray[i]
              }
              if(roomarray[i] === "left" || roomarray[i] === "right"
              || roomarray[i] === "north"|| roomarray[i] === "east"|| roomarray[i] === "south"|| roomarray[i] === "west"){
                delete roomarray[i]
              }
            }
            const areaNameNum = Math.round(Math.random() * (roomarray.length-1))+1

            const areaName = roomarray[areaNameNum]
            const fishtype = fishTypes[Math.round(Math.random() * (fishTypes.length-1))+1]
            const fishName = areaName + "_" + fishtype
  
            broadcastToUser<string>(SERVER_LOG_EVENT, "you caught a " + fishName, player.username); 
            const fish = await createItem(player.id,fishName) 
            const fishSize = Math.random() * 10
            await setItemBio(fish.id, "A " + Math.round(fishSize).toString() + " inch " + fishtype + " caught in " + room)
            await givePoints(player.id, Math.round(fishSize).toString(), event.id)
          }else{
            broadcastToUser<string>(SERVER_LOG_EVENT, "you caught nothing, try again", player.username); 
          }
          broadcastToUser<string>(NOTIFICATION_EVENT, "fish", player.username); 
          
        }else{
          broadcastToRoom<Chat>(CHAT_EVENT, chat, player.roomId)  
          await insertRoomChat(player.roomId, player.id, input, chat.date)
          broadcastToRoom<string>(NOTIFICATION_EVENT, "chat", player.roomId);
        }

        return;
      case "/bite":
        if(event && event.type === "Zombie_Invasion"){
          const tag = await getEventTag(player.id, "player", event.id)
          if(tag){
            if(args.length === 2){
              await bitePlayer(event.id, args[1], player.id)
            }else{
              broadcastToUser<string>(ERROR_EVENT,"bite who?", player.username); 
            }
          }
        }
        break;
      case "/campaign":
        if(event && event.type === "Election_Day"){
          broadcast<string>(CHAT_EVENT, args.join())

        }

        break;
      case "/vote":
        if(event && event.type === "Election_Day"){

        }
  
        break;
      case "/poll":
        if(event && event.type === "Election_Day"){

        }
    
        break;
    }    
  } catch (error) {
    sendEvent<string>(socket, ERROR_EVENT, error.message)
    console.error(error)
  }
}

networkEmitter.on(EVENT_EVENT, handler)
