import { analyticsId } from './config.js';
import { createAnalytics } from './analytics.js';

const analytics = createAnalytics({ window, document, id: analyticsId });
const consent = document.getElementById('consent');
consent.hidden = !analytics.needsChoice;
document.getElementById('privacy-settings').addEventListener('click', () => {
  if (analytics.available) {
    consent.hidden = false;
    document.getElementById('decline-analytics').focus();
  } else {
    document.getElementById('analytics-status').textContent = 'Analytics is inactive: no measurement ID, a preview environment, or a browser privacy preference.';
  }
});
for (const [id, choice] of [['accept-analytics', 'accepted'], ['decline-analytics', 'declined']]) {
  document.getElementById(id).addEventListener('click', () => {
    analytics.setChoice(choice);
    consent.hidden = true;
    document.getElementById('privacy-settings').focus();
  });
}
