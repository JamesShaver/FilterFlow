export async function getAuthToken(interactive = true): Promise<string> {
  console.log('[FilterFlow Auth] getAuthToken called, interactive:', interactive);
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (result) => {
      if (chrome.runtime.lastError) {
        console.error('[FilterFlow Auth] Error:', chrome.runtime.lastError.message);
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      console.log('[FilterFlow Auth] Raw result type:', typeof result, result);
      // Newer @types/chrome returns { token: string } object
      const token = typeof result === 'string' ? result : result?.token;
      if (!token) {
        console.error('[FilterFlow Auth] No token in result');
        reject(new Error(chrome.i18n.getMessage('errorNoAuthToken')));
        return;
      }
      console.log('[FilterFlow Auth] Token obtained successfully');
      resolve(token);
    });
  });
}

export async function signOut(): Promise<void> {
  const token = await getAuthToken(false).catch(() => null);
  if (token) {
    await new Promise<void>((resolve) => {
      chrome.identity.removeCachedAuthToken({ token }, resolve);
    });
    await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`).catch(() => {});
  }
}

export async function getAuthTokenWithRetry(): Promise<string> {
  try {
    return await getAuthToken(false);
  } catch {
    return await getAuthToken(true);
  }
}
