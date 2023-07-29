import React, { createContext, useState } from 'react';

// Create the context
const ProfileContext = createContext();

// Create the provider component
const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export { ProfileContext, ProfileProvider };
