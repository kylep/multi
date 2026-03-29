import { createDomTerminal } from "./ui/terminal";
import { createSoundPlayer } from "./ui/sound";
import { startGame } from "./ui/screens/game";

const root = document.getElementById("terminal");
if (!root) throw new Error("Missing #terminal element");

const terminal = createDomTerminal(root);
const sound = createSoundPlayer();
startGame(terminal, undefined, sound);
