import React, { Suspense, lazy } from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Toast } from './components/common/Toast';
import { QuickSearchModal } from './components/common/QuickSearchModal';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';

const lazyNamed = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));
const Module1_OrgSystem = lazyNamed(() => import('./components/modules/Module1_OrgSystem'), 'Module1_OrgSystem');
const Module2_KPILibraryPlanning = lazyNamed(() => import('./components/modules/Module2_KPILibraryPlanning'), 'Module2_KPILibraryPlanning');
const Module3_TrackingExecution = lazyNamed(() => import('./components/modules/Module3_TrackingExecution'), 'Module3_TrackingExecution');
const Module4_EvaluationScoring = lazyNamed(() => import('./components/modules/Module4_EvaluationScoring'), 'Module4_EvaluationScoring');
const Module5_DashboardsReports = lazyNamed(() => import('./components/modules/Module5_DashboardsReports'), 'Module5_DashboardsReports');
const Module6_SystemNonFunctional = lazyNamed(() => import('./components/modules/Module6_SystemNonFunctional'), 'Module6_SystemNonFunctional');
const PeriodManagement = lazyNamed(() => import('./components/modules/PeriodManagement'), 'PeriodManagement');
const UiKitPage = lazyNamed(() => import('./components/dev/UiKitPage'), 'UiKitPage');

import { LoginPage } from './components/auth/LoginPage';

export const AppContent = () => {
  const { activeModule, isAuthenticated, activeRole } = useApp();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        <LoginPage />
        <Toast />
      </div>
    );
  }

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboards':
        return <OverviewDashboard />;
      case 'periods':
        return <PeriodManagement />;
      case 'org-system':
        return <Module1_OrgSystem />;
      case 'library':
      case 'planning':
        return <Module2_KPILibraryPlanning />;
      case 'my-kpi':
      case 'tracking':
        return <Module3_TrackingExecution />;
      case 'team-kpi':
      case 'evaluation':
        return <Module4_EvaluationScoring />;
      case 'reports':
        return <Module5_DashboardsReports />;
      case 'non-functional':
        return ['SYSTEM_ADMIN', 'AUDITOR', 'HR_OFFICER'].includes(activeRole) ? <Module6_SystemNonFunctional /> : <OverviewDashboard />;
      case 'ui-kit':
        return <UiKitPage />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header />
        <main key={activeModule} className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-[1400px] w-full mx-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-24">
                <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            }
          >
            {renderActiveModule()}
          </Suspense>
        </main>
      </div>

      <QuickSearchModal />
      <Toast />
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
