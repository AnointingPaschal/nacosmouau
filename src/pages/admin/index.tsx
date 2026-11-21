import { useParams } from 'react-router-dom';
import { AdminResourcePage } from '../WorkspacePages';
import { AdminElections } from './AdminElections';
import { AdminMembers } from './AdminMembers';
import { AdminPayments } from './AdminPayments';
import { AdminAnalytics, AdminFinance, AdminRoles, AdminWelfare } from './AdminReports';
import { AdminSettings } from './AdminSettings';
import { AdminVisitors } from './AdminVisitors';
import { AdminAudit } from './AdminAudit';
import { AdminPaymentSettings } from './AdminPaymentSettings';
import { AdminDues } from './AdminDues';
import { AdminCourses } from './AdminCourses';
import { AdminClassReps } from './AdminClassReps';
import { AdminAttendance } from './AdminAttendance';

export { AdminOverview } from './AdminReports';

export function AdminRouter() {
  const { module = '' } = useParams();
  switch (module) {
    case 'attendance': return <AdminAttendance/>;
    case 'class-reps': return <AdminClassReps/>;
    case 'courses': return <AdminCourses/>;
    case 'members': return <AdminMembers/>;
    case 'payments': return <AdminPayments/>;
    case 'payment-settings': return <AdminPaymentSettings/>;
    case 'dues': return <AdminDues/>;
    case 'elections': return <AdminElections/>;
    case 'finance': return <AdminFinance/>;
    case 'analytics': return <AdminAnalytics/>;
    case 'visitors': return <AdminVisitors/>;
    case 'audit': return <AdminAudit/>;
    case 'welfare': return <AdminWelfare/>;
    case 'roles': return <AdminRoles/>;
    case 'settings': return <AdminSettings/>;
    default: return <AdminResourcePage/>;
  }
}
