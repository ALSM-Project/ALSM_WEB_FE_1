import React from 'react';
import { Outlet } from 'react-router-dom';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#091E42] flex flex-col font-sans">
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
};
export default PublicLayout;
