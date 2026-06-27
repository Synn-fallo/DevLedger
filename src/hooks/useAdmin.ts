import { useAdmin as useAdminContext } from '../contexts/AdminContext';

export function useAdmin() {
  const { isAdmin, canAccessAdmin } = useAdminContext();
  return { isAdmin, canAccessAdmin };
}