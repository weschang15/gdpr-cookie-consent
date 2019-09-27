// Environment varibles aren't true env vars, they are just replaced during build process and are
// really only used as a way to swap out values during development/production

export function isDev() {
  return process.env.UNDISCLOSED_FAKE_ENV === "development";
}

export function isProd() {
  return process.env.UNDISCLOSED_FAKE_ENV === "production";
}

export function getEnv() {
  return process.env.UNDISCLOSED_FAKE_ENV;
}
