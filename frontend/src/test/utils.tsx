import { configureStore } from '@reduxjs/toolkit';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import type { ComponentType, ReactElement, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import type { ReducersMapObject } from 'redux';
import { authReducer, type AuthState } from '@/features/auth/auth.slice';
import { notificationsReducer, type Notification } from '@/store/slices/notifications.slice';

type NotificationsState = { items: Notification[] };

type TestState = { auth: AuthState; notifications: NotificationsState };

const rootReducer: ReducersMapObject<TestState> = {
  auth: authReducer,
  notifications: notificationsReducer,
};

export function createTestStore(preloadedState?: Partial<TestState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState: preloadedState as TestState | undefined,
  });
}

export type TestStore = ReturnType<typeof createTestStore>;

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<TestState>;
  initialEntries?: string[];
}

export function renderWithProviders(
  ui: ReactElement,
  { preloadedState, initialEntries, ...renderOptions }: RenderWithProvidersOptions = {},
): RenderResult & { store: TestStore } {
  const store = createTestStore(preloadedState);

  const Wrapper: ComponentType<{ children: ReactNode }> = ({ children }) => {
    const content = initialEntries ? (
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    ) : (
      children
    );
    return <Provider store={store}>{content}</Provider>;
  };

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
