export default function Footer() {
  return (
    <footer className="border-t border-border bg-card py-4 px-6">
      <div className="flex items-center justify-between">
        <p className="text-caption text-muted-foreground">
          &copy; {new Date().getFullYear()} 统御 TONGYU. All rights reserved.
        </p>
        <p className="text-caption text-muted-foreground">
          AI 驱动的团队任务管理系统
        </p>
      </div>
    </footer>
  );
}
