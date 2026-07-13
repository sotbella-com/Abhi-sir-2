import React from 'react';
import { useAuth } from '../../context/AuthContext';
const HiddenUserData = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) {
    return null;
  }
  return (
     <div id="user-details" style={{display:"none"}}>
      <div id="user-name">
        {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`}
      </div>
      <div id="user-email">
        {user.email || ''}
      </div>
      <div id="user-phoneno">
        {user.phone || user.phoneMobile || user.phoneHome || ''}
      </div>
    </div>
  );
};
export default HiddenUserData;