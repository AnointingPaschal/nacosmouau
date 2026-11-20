import { useSettings } from './useApi';

/** The current academic session, set by an administrator in Settings. Use this anywhere a session is shown or needed. */
export function useSession() {
  const { data, isLoading } = useSettings();
  const fallback = `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`;
  const session = data?.academic_session?.trim() || fallback;
  return { session, isLoading, short: session.replace('/20', '/') };
}
