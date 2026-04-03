import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, Download } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function History() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  return <HistoryContent />;
}

function HistoryContent() {
  const [, setLocation] = useLocation();
  const { data: improvements, isLoading } = trpc.resume.getHistory.useQuery();
  const downloadMutation = trpc.resume.downloadPDF.useMutation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  const handleView = (id: number) => {
    setLocation(`/results?id=${id}`);
  };

  const handleDownload = async (id: number) => {
    try {
      const result = await downloadMutation.mutateAsync({ improvementId: id });
      if (result.pdfUrl) {
        const link = document.createElement("a");
        link.href = result.pdfUrl;
        link.download = result.fileName;
        link.click();
        toast.success("Resume downloaded!");
      }
    } catch (err) {
      toast.error("Failed to download resume");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => setLocation("/")}>
            ← Back to Home
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Resume Improvement History</h1>
          <p className="text-slate-600">View all your resume improvements and download PDFs</p>
        </div>

        {!improvements || improvements.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-slate-600 mb-4">No resume improvements yet</p>
              <Button onClick={() => setLocation("/upload")}>Upload Your First Resume</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {improvements.map((improvement: any) => (
              <Card key={improvement.id} className="hover:shadow-md transition">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Improvement #{improvement.id}</CardTitle>
                      <CardDescription>
                        {new Date(improvement.createdAt).toLocaleDateString()} at{" "}
                        {new Date(improvement.createdAt).toLocaleTimeString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        improvement.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : improvement.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {improvement.status.charAt(0).toUpperCase() + improvement.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm text-slate-600 mb-2">
                      <span className="font-medium">Instructions:</span> {improvement.instructions.substring(0, 100)}
                      {improvement.instructions.length > 100 ? "..." : ""}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Changes:</span> {improvement.changeCount} modifications made
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleView(improvement.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    {improvement.pdfUrl && (
                      <Button
                        size="sm"
                        onClick={() => handleDownload(improvement.id)}
                        disabled={downloadMutation.isPending}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
