import { isProd } from "./common";

export function getCookie(name) {
  const value = "; " + document.cookie;
  const parts = value.split("; " + name + "=");
  return parts.length < 2
    ? undefined
    : parts
        .pop()
        .split(";")
        .shift();
}

export function cookieExists(name) {
  return document.cookie
    .split(";")
    .filter(item => item.trim().startsWith(`${name}=`)).length;
}

export function setCookie(
  name = "",
  value = "",
  expiryDays = 365,
  domain = "",
  path = "/",
  secure = isProd()
) {
  // We mutate expiration date directly here
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + expiryDays);

  const cookie = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `expires=${expiry.toUTCString()}`,
    `path=${path}`
  ];

  // Only set domain value if enforced
  domain && cookie.push("domain=" + domain);
  // Only set secure value if enforced
  secure && cookie.push("secure");

  // Cookies can only be set 1 at a time
  document.cookie = cookie.join(";");
}
