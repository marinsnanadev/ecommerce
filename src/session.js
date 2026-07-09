export function getSessionId() {
  let sessionId = localStorage.getItem('violet_session_id');
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('violet_session_id', sessionId);
  }
  return sessionId;
}