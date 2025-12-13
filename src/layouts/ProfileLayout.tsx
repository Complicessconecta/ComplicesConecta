// src/layouts/ProfileLayout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ParentalControl } from '@/components/profiles/shared/ParentalControl';

export const ProfileLayout: React.FC = () => {
  const [isLocked, setIsLocked] = useState(true);

  return (
    <>
      {isLocked ? (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-xl">
            <ParentalControl isLocked={isLocked} onToggle={setIsLocked} />
          </div>
        </div>
      ) : (
        <Outlet />
      )}
    </>
  );
};

export default ProfileLayout;
