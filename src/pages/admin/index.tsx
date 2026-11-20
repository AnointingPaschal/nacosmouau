import { useParams } from 'react-router-dom';
import { AdminResourcePage } from '../WorkspacePages';
import { AdminElections } from './AdminElections';
import { AdminMembers } from './AdminMembers';
import { AdminPayments } from './AdminPayments';
import { AdminAnalytics, AdminAudit, AdminFinance, AdminRoles, AdminWelfare } from './AdminReports';
import { AdminSettings } from './AdminSettings';

export { AdminOverview } from './AdminReports';

export function AdminRouter() {
  const { module = '' } = useParams();
  switch (module) {
    case 'members': return <AdminMembers/>;
    case 'payments': return <AdminPayments/>;
    case 'elections': return <AdminElections/>;
    case 'finance': return <AdminFinance/>;
    case 'analytics': return <AdminAnalytics/>;
    case 'audit': return <AdminAudit/>;
    case 'welfare': return <AdminWelfare/>;
    case 'roles': return <AdminRoles/>;
    case 'settings': return <AdminSettings/>;
    default: return <AdminResourcePage/>;
  }
}
