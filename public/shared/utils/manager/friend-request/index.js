import { initialize } from "./controller.js";
export {
  startFriendRequestSimulation,
  stopFriendRequestSimulation,
  startSimulation,
  stopSimulation,
} from "./controller.js";

document.addEventListener("navigation:ready", () => {
  initialize();
});

document.addEventListener("DOMContentLoaded", () => {
  initialize();
});
