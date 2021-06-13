import { colorUtil } from "../utils";
import { CommandModule } from "./emitter";
import { pushErrorToLog, pushToLog } from "../components/Terminal"

export const Color: CommandModule = {
  command: "color",
  syntax: "color [key] [value]",

  callback ({ args }) {
    const [key, value] = args;
    
    if (key === undefined && value === undefined) {
      colorUtil.resetColors();
      pushToLog("Color theme reset");
      
      return;
    }

    try {
      colorUtil.setColor(key, value);
      pushToLog(`Updated color "${key}" to "${value}"`);
    } catch (e) {
      pushErrorToLog(e.message)
    }
  },
}
