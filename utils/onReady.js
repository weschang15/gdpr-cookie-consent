export function onReady(callback = () => null) {
  if (document.readyState === "loading") {
    // loading yet, wait for the event
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    // DOM is ready!
    return callback();
  }
}
