import { useLocation, useParams } from 'react-router-dom';
import { DigitalId } from './DigitalId';
import { PortalBallot, PortalElections } from './PortalElections';
import { PortalDocuments, PortalEvents, PortalMembership, PortalSettings, PortalWelfare } from './PortalMisc';
import { PortalPayments } from './PortalPayments';
import { PortalCourses } from './Courses';
import { PortalResults } from './Results';
import { PortalLevelMates } from './LevelMates';
import { PortalClassElection } from './ClassElection';
import { PortalRepDesk } from './RepDesk';
import { PortalAttendance } from './Attendance';
import { PortalAttendanceDesk } from './AttendanceDesk';
import { PortalAttendanceRecords } from './AttendanceRecords';

export { PortalHome as PortalOverview } from './Home';

export function PortalRouter() {
  const { module = '', id } = useParams(); useLocation();
  switch (module) {
    case 'profile': return <PortalMembership/>;
    case 'id-card': return <DigitalId/>;
    case 'level-mates': return <PortalLevelMates/>;
    case 'class-election': return <PortalClassElection/>;
    case 'rep-desk': return <PortalRepDesk/>;
    case 'attendance': return <PortalAttendance/>;
    case 'attendance-records': return <PortalAttendanceRecords/>;
    case 'attendance-desk': return <PortalAttendanceDesk/>;
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
