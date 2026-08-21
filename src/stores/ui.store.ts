export interface UIStoreState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
}

export const initialUIState: UIStoreState = {
  sidebarOpen: true,
  theme: 'light',
};
