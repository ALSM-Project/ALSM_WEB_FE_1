import React from 'react';
import { Outlet } from 'react-router-dom';

export const AccountSettingsLayout: React.FC = () => {
  return (
    <main className="w-full min-w-0">
      <Outlet />
    </main>
  );
};

export default AccountSettingsLayout;
