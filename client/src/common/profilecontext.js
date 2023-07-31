import React, { createContext, useState } from 'react';

// Create the context
const ProfileContext = createContext();

// Create the provider component
const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [usedGoogleLogin, setUsedGoogleLogin] = useState(null);

  return (
    <ProfileContext.Provider value={{ profile, setProfile, usedGoogleLogin, setUsedGoogleLogin }}>
      {children}
    </ProfileContext.Provider>
  );
};

export { ProfileContext, ProfileProvider };
