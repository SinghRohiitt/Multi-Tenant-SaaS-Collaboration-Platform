import { describe, expect, it } from 'vitest';
import { dismissNotification, notify, notificationsReducer } from './notifications.slice';

describe('notifications reducer', () => {
  it('keeps only the latest five notifications', () => {
    let state = notificationsReducer(undefined, notify({ tone: 'info', title: 'Notice 0' }));
    for (let index = 1; index < 6; index += 1) {
      state = notificationsReducer(state, notify({ tone: 'info', title: `Notice ${index}` }));
    }

    expect(state.items).toHaveLength(5);
    expect(state.items[0].title).toBe('Notice 1');
  });

  it('dismisses one notification without clearing the rest', () => {
    const state = notificationsReducer(undefined, notify({ tone: 'success', title: 'Saved' }));
    const notificationId = state.items[0].id;
    const next = notificationsReducer(state, dismissNotification(notificationId));

    expect(next.items).toHaveLength(0);
  });
});
