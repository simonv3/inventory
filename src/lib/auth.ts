export interface CustomerTokenPayload {
  customerId: number;
  email: string;
  timestamp: number;
}

// Decodes the base64-encoded JSON `customerToken` cookie.
// Throws if the token is malformed; callers decide how to handle it.
export function decodeCustomerToken(token: string): CustomerTokenPayload {
  return JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
}
