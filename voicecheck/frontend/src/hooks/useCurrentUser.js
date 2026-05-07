import { useState, useEffect } from 'react';
import { getMe } from '../services/api';

export const useCurrentUser = () => {
  const [me, setMe] = useState(null);

  useEffect(() => {
    getMe().then(setMe).catch(() => {});
  }, []);

  return me;
};
