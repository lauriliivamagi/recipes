import '@recipe/ui/recipe/pds-recipe-shell.js';
import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      setInterval(() => { registration.update(); }, 60 * 60 * 1000);
    }
  },
});
