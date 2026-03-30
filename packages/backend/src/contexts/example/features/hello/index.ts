import { HelloHandler } from "./HelloHandler.js";

export function createHelloHandler(): HelloHandler {
  return new HelloHandler();
}
