import type { SystemReport } from "@/app/(admin)/hooks/useAdminDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/useToast";

interface ReportsPanelProps {
  reports: SystemReport[];
  setSystemReports: React.Dispatch<React.SetStateAction<SystemReport[]>>;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const ReportsPanel = ({ reports, setSystemReports }: ReportsPanelProps) => {
  const { toast } = useToast();

  const resolveReport = async (reportId: string) => {
    setSystemReports(prev =>
      prev.map(report =>
        report.id === reportId
          ? { ...report, resolved: true }
          : report
      )
    );

    toast({
      title: "Éxito",
      description: "Reporte marcado como resuelto",
    });
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Reportes del Sistema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reports.filter(report => !report.resolved).map((report) => (
            <div key={report.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getSeverityColor(report.severity)}`} />
                <div>
                  <p className="text-white font-medium">{report.message}</p>
                  <p className="text-white/60 text-sm">
                    {formatDate(report.created_at)} - {report.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getSeverityColor(report.severity)}>
                  {report.severity}
                </Badge>
                <Button
                  onClick={() => resolveReport(report.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm"
                >
                  Resolver
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

