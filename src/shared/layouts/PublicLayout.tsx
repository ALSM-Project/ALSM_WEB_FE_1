import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicNavbar } from '@/components/PublicNavbar/PublicNavbar';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#091E42] flex flex-col font-sans">
      <PublicNavbar />
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
};
export default PublicLayout;
