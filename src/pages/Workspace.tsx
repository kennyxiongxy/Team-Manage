import EmployeeHeader from '@/components/workspace/EmployeeHeader';
import PriorityHighlight from '@/components/workspace/PriorityHighlight';
import TaskOverview from '@/components/workspace/TaskOverview';
import TodayTimeline from '@/components/workspace/TodayTimeline';
import AiPersonalReminders from '@/components/workspace/AiPersonalReminders';
import QuickDailyReport from '@/components/workspace/QuickDailyReport';
import TeamQuickView from '@/components/workspace/TeamQuickView';
import PageHeader from '@/components/PageHeader';

export default function Workspace() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 lg:px-8">
        <PageHeader title="工作台" />

        {/* Page Header - Greeting & Progress */}
        <EmployeeHeader />

        {/* Main Content Grid */}
        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          {/* Left - Main Content (70%) */}
          <div className="flex-1 space-y-6 lg:max-w-[70%]">
            {/* Priority Highlight */}
            <PriorityHighlight />

            {/* Task Overview Cards */}
            <TaskOverview />

            {/* Today's Task Timeline */}
            <TodayTimeline />

            {/* AI Personal Reminders */}
            <AiPersonalReminders />

            {/* Quick Daily Report */}
            <QuickDailyReport />
          </div>

          {/* Right - Team Sidebar (30%) */}
          <aside className="w-full shrink-0 lg:w-[30%]">
            <div className="lg:sticky lg:top-6">
              <TeamQuickView />
            </div>
          </aside>
        </div>

        {/* Bottom spacing */}
        <div className="h-16" />
      </div>
    </div>
  );
}
