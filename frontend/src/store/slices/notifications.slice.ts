import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type NotificationTone = 'success' | 'error' | 'warning' | 'info';

export type Notification = {
  id: string;
  tone: NotificationTone;
  title: string;
  message?: string;
  duration?: number;
};

type NotificationState = {
  items: Notification[];
};

const initialState: NotificationState = { items: [] };

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    notify: {
      reducer(state, action: PayloadAction<Notification>) {
        state.items.push(action.payload);
        if (state.items.length > 5) state.items.shift();
      },
      prepare(notification: Omit<Notification, 'id'>) {
        return { payload: { ...notification, id: crypto.randomUUID() } };
      },
    },
    dismissNotification(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    clearNotifications(state) {
      state.items = [];
    },
  },
});

export const { clearNotifications, dismissNotification, notify } = notificationsSlice.actions;
export const notificationsReducer = notificationsSlice.reducer;
