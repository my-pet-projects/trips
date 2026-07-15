const UNROUTABLE_ROUTE_MESSAGE_PATTERNS = [
  /could not find routable point/i,
  /route could not be found/i,
  /could not find a route between points/i,
];

export function isUnroutableRouteMessage(message: string): boolean {
  return UNROUTABLE_ROUTE_MESSAGE_PATTERNS.some((pattern) =>
    pattern.test(message),
  );
}
