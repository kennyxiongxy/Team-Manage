import EmployeeReportSummary from '@/components/reports/EmployeeReportSummary';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';

export default function MyReports() {
  return (
    <Layout>
      <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 lg:px-8">
        <PageHeader title="我的日报" subtitle="查看您的日报历史和详细内容" />
        <EmployeeReportSummary />
      </div>
    </Layout>
  );
}
