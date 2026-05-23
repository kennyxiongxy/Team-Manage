import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Link to="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <Home size={14} />
          仪表盘
        </Link>
        <ChevronRight size={14} />
        <span className="text-foreground">{title}</span>
      </div>
      <h1 className="text-h1 font-bold text-foreground">{title}</h1>
      {subtitle && <p className="text-body text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}
