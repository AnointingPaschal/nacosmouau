import { PortalOverview } from './PortalMisc';
import { RepHome } from './RepDesk';
import { useClassMe } from './classApi';

/** Reps (elected course rep and assistant) get a class dashboard above the normal overview. */
export function PortalHome() {
  const me = useClassMe();
  return <>{(me.data?.roles.length ?? 0) > 0 && <RepHome/>}<PortalOverview/></>;
}
