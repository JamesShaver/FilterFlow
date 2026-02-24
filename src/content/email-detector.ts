function extractEmailContext(): { sender: string; subject: string } | null {
  // Only extract when viewing an open email (subject heading visible)
  const subjectEl = document.querySelector<HTMLElement>(
    'h2.hP, .ha h2'
  );
  if (!subjectEl) return null;

  const subject = subjectEl.textContent?.trim() || '';

  // Find the sender from the currently visible email.
  // Gmail renders the sender as a span.gD with an `email` attribute inside
  // expanded message containers. We search broadly to avoid scoping issues
  // with Gmail's deeply nested .nH divs.
  let sender = '';

  // Primary: look for visible sender elements with email attribute anywhere
  // in the message view. Gmail uses .gD[email] on the sender name span.
  const senderEls = document.querySelectorAll<HTMLElement>('.gD[email]');
  if (senderEls.length > 0) {
    // Take the last visible (expanded) sender — Gmail expands the latest message
    for (let i = senderEls.length - 1; i >= 0; i--) {
      const el = senderEls[i];
      if (el.offsetParent !== null) {
        sender = el.getAttribute('email') || '';
        if (sender) break;
      }
    }
    // Fall back to first if none were visible
    if (!sender) {
      sender = senderEls[0].getAttribute('email') || '';
    }
  }

  // Fallback: data-hovercard-id on sender elements, or the "from" header
  if (!sender) {
    const fallback = document.querySelector<HTMLElement>(
      'span.gD[data-hovercard-id], span[email], .go .g2'
    );
    if (fallback) {
      sender = fallback.getAttribute('data-hovercard-id') ||
        fallback.getAttribute('email') ||
        fallback.textContent?.trim() || '';
    }
  }

  if (!sender && !subject) return null;
  return { sender, subject };
}

function sendContext(context: { sender: string; subject: string }) {
  // chrome.runtime can be undefined if the extension context was invalidated
  // (e.g., after extension reload/update)
  if (!chrome.runtime?.id) return;
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
    // Staggered checks to let Gmail render the email's DOM incrementally
    setTimeout(checkForEmailContext, 500);
    setTimeout(checkForEmailContext, 1200);
    setTimeout(checkForEmailContext, 2500);
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
