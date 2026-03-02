// src/db/events.ts

/**
 * A simple event emitter to notify of DB changes.
 * This is used to trigger background processes like sync.
 */
export const dataChangeNotifier = new EventTarget();

/**
 * Stores the timestamp of the last local data change.
 */
export let lastLocalChange = 0;

/**
 * Notifies that a change has occurred in the local database.
 * This will trigger the 'change' event on the notifier.
 */
export const notifyDataChange = () => {
    lastLocalChange = Date.now();
    dataChangeNotifier.dispatchEvent(new Event('change'));
}
