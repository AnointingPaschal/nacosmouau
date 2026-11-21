import { useLocation, useParams } from 'react-router-dom';
import { DigitalId } from './DigitalId';
import { PortalBallot, PortalElections } from './PortalElections';
import { PortalDocuments, PortalEvents, PortalMembership, PortalSettings, PortalWelfare } from './PortalMisc';
import { PortalPayments } from './PortalPayments';
import { PortalCourses } from './Courses';
import { PortalResults } from './Results';

export { PortalOverview } from './PortalMisc';

export function PortalRouter() {
  const { module = '', id } = useParams(); useLocation();
  switch (module) {
    case 'profile': return <PortalMembership/>;
    case 'id-card': return <DigitalId/>;
    case 'courses': return <PortalCourses/>;
    case 'results': return <PortalResults/>;
    case 'payments': return <PortalPayments/>;
    case 'events': return <PortalEvents/>;
    case 'elections': return id ? <PortalBallot/> : <PortalElections/>;
    case 'welfare': return <PortalWelfare/>;
    case 'documents': return <PortalDocuments/>;
    case 'settings': return <PortalSettings/>;
    default: return <PortalMembership/>;
  }
}
