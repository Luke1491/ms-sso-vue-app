<template>
  <div style="padding: 2rem">
    <h1>Microsoft login</h1>
    <button @click="login">login</button>
    <div v-if="authSuccess" style="margin-top: 1rem; color: green">
      auth success -> check your local storage
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const authSuccess = ref(false);

async () => {
  const accessToken = await login();
};

const login = async () => {
  try {
    const code = await loginWithPopupForCode();
    if (code) {
      localStorage.setItem("auth_code", code);

      // await axios.post('/api/token', { code, codeVerifier: localStorage.getItem("pkce_code_verifier") });

      if (code) {
        authSuccess.value = true;
      }
      return code;
    }
  } catch (error) {
    console.error("Login failed:", error);
    return null;
  }
};

async function loginWithPopupForCode() {
  const { codeVerifier, codeChallenge } = await generatePKCECodes();
  localStorage.setItem("pkce_code_verifier", codeVerifier);

  const clientId = import.meta.env.VITE_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_REDIRECT_URI;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: "openid offline_access Files.ReadWrite",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state: crypto.randomUUID(),
  });

  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  const popup = window.open(authUrl, "oauthPopup", "width=600,height=600");

  if (!popup) {
    throw new Error("Popup blocked");
  }

  return new Promise((resolve, reject) => {
    const listener = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "oauth-code") {
        window.removeEventListener("message", listener);
        resolve(event.data.code);
      }
    };
    window.addEventListener("message", listener);
  });
}

function base64URLEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function generatePKCECodes() {
  const codeVerifier = base64URLEncode(
    crypto.getRandomValues(new Uint8Array(32)).buffer
  );

  const encoder = new TextEncoder();
  const encodedVerifier = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", encodedVerifier);
  const codeChallenge = base64URLEncode(digest);

  return { codeVerifier, codeChallenge };
}
</script>
