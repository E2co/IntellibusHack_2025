import { useEffect, useState } from 'react';

export const useAdminAuth = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('adminAuth');
      const parsed = raw ? JSON.parse(raw) : null;
      setAdmin(parsed);
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    try {
      localStorage.removeItem('adminAuth');
      setAdmin(null);
    } catch {
      // ignore
    }
  };

  return { admin, loading, logout };
};

export default useAdminAuth;
