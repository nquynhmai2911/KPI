import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Toast } from './components/common/Toast';
import { QuickSearchModal } from './components/common/QuickSearchModal';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { Module1_OrgSystem } from './components/modules/Module1_OrgSystem';
import { Module2_KPILibraryPlanning } from './components/modules/Module2_KPILibraryPlanning';
import { Module3_TrackingExecution } from './components/modules/Module3_TrackingExecution';
import { Module4_EvaluationScoring } from './components/modules/Module4_EvaluationScoring';
import { Module5_DashboardsReports } from './components/modules/Module5_DashboardsReports';
import { Module6_SystemNonFunctional } from './components/modules/Module6_SystemNonFunctional';
import { UiKitPage } from './components/dev/UiKitPage';
import { LoginPage } from './components/auth/LoginPage';

export const AppContent = () => {
  const { activeModule, isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased">
        <LoginPage />
        <Toast />
      </div>
    );
  }

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboards':
        return <OverviewDashboard />;
      case 'org-system':
        return <Module1_OrgSystem />;
      case 'library':
        return <Module2_KPILibraryPlanning />;
      case 'my-kpi':
        return <Module3_TrackingExecution />;
      case 'team-kpi':
        return <Module4_EvaluationScoring />;
      case 'reports':
        return <Module5_DashboardsReports />;
      case 'non-functional':
        return <Module6_SystemNonFunctional />;
      case 'ui-kit':
        return <UiKitPage />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100">
      {/* Sidebar Layout 260px / 72px / Mobile Drawer (Yêu cầu Bước 2) */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Header 64px cao với Segmented Mode, Ctrl+K, Demo Tools, Profile (Yêu cầu Bước 2) */}
        <Header />

        {/* Content Body (max-width 1440px, padding 24px, gap 24px) (Yêu cầu Bước 2 & 4) */}
        <main className="flex-1 p-6 max-w-[1440px] w-full mx-auto space-y-6">
          {renderActiveModule()}
        </main>
      </div>

      {/* Global Quick Search Modal (Ctrl+K) */}
      <QuickSearchModal />

      {/* Toast Alert System */}
      <Toast />
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
