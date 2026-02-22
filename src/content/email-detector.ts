function extractEmailContext(): { sender: string; subject: string } | null {
  // Only extract when viewing an open email (subject heading visible)
  const subjectEl = document.querySelector<HTMLElement>(
    'h2.hP, .ha h2'
  );
  if (!subjectEl) return null;

  const subject = subjectEl.textContent?.trim() || '';

  // Find the sender from the currently visible email.
  // Gmail renders each expanded message inside a container with class "adn".
  // Within that, the sender is a span.gD with an `email` attribute.
  // When multiple messages exist in a thread, we want the most recently
  // expanded one (typically last in DOM order for replies, first for a single email).
  // Scope our search to the visible message view area to avoid picking up
  // stale sender elements from the email list.
  let sender = '';

  // Look within the main message view pane. Gmail wraps the conversation in
  // a container that includes the subject — walk up from it to scope our search.
  const conversationContainer = subjectEl.closest('.nH') || document.body;

  // Get all sender elements within the conversation view
  const senderEls = conversationContainer.querySelectorAll<HTMLElement>('.gD[email]');
  if (senderEls.length > 0) {
    // For a single email: there's one .gD[email]
    // For a thread: take the first (original sender) — this is the most useful
    // for creating a filter since it represents the conversation starter.
    // However, we check visibility: the last *expanded* message is most relevant.
    // In practice, Gmail expands the latest message, so we take the last visible one.
    for (let i = senderEls.length - 1; i >= 0; i--) {
      const el = senderEls[i];
      // Check the element is in an expanded (visible) message, not a collapsed stub
      if (el.offsetParent !== null) {
        sender = el.getAttribute('email') || '';
        if (sender) break;
      }
    }
    // If none were visible (shouldn't happen), fall back to first
    if (!sender && senderEls.length > 0) {
      sender = senderEls[0].getAttribute('email') || '';
    }
  }

  // Fallback selectors
  if (!sender) {
    const fallback = conversationContainer.querySelector<HTMLElement>(
      '[data-hovercard-id].gD, .go .g2'
    );
    if (fallback) {
      sender = fallback.getAttribute('data-hovercard-id') ||
        fallback.textContent?.trim() || '';
    }
  }

  if (!sender && !subject) return null;
  return { sender, subject };
}

function sendContext(context: { sender: string; subject: string }) {
  chrome.runtime.sendMessage({
    type: 'EMAIL_CONTEXT',
    sender: context.sender,
    subject: context.subject,
  }).catch(() => {}); // Side panel might not be open
}

let lastSender = '';
let lastSubject = '';

function checkForEmailContext() {
  const context = extractEmailContext();
  if (!context) {
    // If we had a previous context and now there's nothing, reset so
    // re-opening the same email will still trigger an update.
    if (lastSender || lastSubject) {
      lastSender = '';
      lastSubject = '';
    }
    return;
  }

  if (context.sender !== lastSender || context.subject !== lastSubject) {
    lastSender = context.sender;
    lastSubject = context.subject;
    sendContext(context);
  }
}

export function startEmailDetection() {
  // Check on URL hash changes (primary trigger for email navigation)
  window.addEventListener('hashchange', () => {
    // Reset cached values so the next check always sends fresh data.
    // Gmail's SPA navigation means the DOM may update incrementally.
    lastSender = '';
    lastSubject = '';
    // Delay to let Gmail render the new email's DOM
    setTimeout(checkForEmailContext, 500);
    // Second check in case sender element loads slower than subject
    setTimeout(checkForEmailContext, 1200);
  });

  // Debounced MutationObserver — wait for DOM to settle before extracting
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const observer = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(checkForEmailContext, 300);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial check
  setTimeout(checkForEmailContext, 1000);
}
