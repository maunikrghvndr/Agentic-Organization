export function requireUser(req) {
  if (!req.user) throw new Error("unauthenticated");
  return req.user;
}
