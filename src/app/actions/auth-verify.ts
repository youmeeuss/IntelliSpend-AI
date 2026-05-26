"use server"

/**
 * Validates a session token (JWT or mock token) on the server.
 * Returns the verified user's UID if successful, otherwise throws an error.
 */
export async function verifySessionToken(token: string): Promise<string> {
  const cleanToken = (token || "").trim()
  if (!cleanToken) {
    throw new Error("Unauthorized: Session token is missing.")
  }

  // 1. Check for High-Fidelity Mock Authentication tokens
  if (cleanToken.startsWith("mock_jwt_token_")) {
    try {
      // Format: mock_jwt_token_{uid}_{timestamp} or mock_jwt_token_google_{googleId}
      const parts = cleanToken.split("_")
      // Extract the email or user identifier
      const uid = parts[3] || parts[4] || "mock_default_user"
      
      if (!uid) {
        throw new Error("Unauthorized: Invalid mock token format.")
      }
      return `mock_${uid}`
    } catch (e) {
      throw new Error("Unauthorized: Failed to parse mock session token.")
    }
  }

  // 2. Real Firebase ID Token Verification
  const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!firebaseApiKey) {
    throw new Error("Unauthorized: Firebase credentials are not configured on the server.")
  }

  try {
    // Call the Google Identity Toolkit REST API to verify the ID token.
    // This API cryptographically checks the token signature, expiration, and issuer.
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ idToken: cleanToken })
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      const errMsg = errData?.error?.message || "Invalid session signature."
      throw new Error(`Unauthorized: ${errMsg}`)
    }

    const data = await response.json()
    const verifiedUid = data?.users?.[0]?.localId

    if (!verifiedUid) {
      throw new Error("Unauthorized: Token resolved to an empty account profile.")
    }

    return verifiedUid
  } catch (error: any) {
    console.error("Cryptographic token verification failed:", error.message)
    throw new Error(error.message || "Unauthorized: Cryptographic session token verification failed.")
  }
}
