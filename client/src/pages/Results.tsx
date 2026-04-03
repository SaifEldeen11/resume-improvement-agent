import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, Copy, Check } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Results() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [improvementId, setImprovementId] = useState<number | null>(null);

  // Get improvement ID from URL params or session storage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("improvementId") || params.get("id");
    if (id) {
      setImprovementId(parseInt(id));
      sessionStorage.setItem("improvementId", id);
    } else {
      const stored = sessionStorage.getItem("improvementId");
      if (stored) {
        setImprovementId(parseInt(stored));
      }
    }
  }, []);

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

  if (!improvementId) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">No Improvement Found</h1>
          <p className="text-slate-600 mb-6">Please upload a resume to get started.</p>
          <Button onClick={() => setLocation("/upload")}>Upload a Resume</Button>
        </div>
      </div>
    );
  }

  return (
    <ResultsContent improvementId={improvementId} />
  );
}

function ResultsContent({ improvementId }: { improvementId: number }) {
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);

  const { data: improvement, isLoading, error } = trpc.resume.getImprovement.useQuery({
    improvementId,
  });

  const downloadMutation = trpc.resume.downloadPDF.useMutation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (error || !improvement) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Error Loading Results</h1>
          <p className="text-slate-600 mb-6">{error?.message || "Could not load improvement details"}</p>
          <Button onClick={() => setLocation("/upload")}>Upload a Resume</Button>
        </div>
      </div>
    );
  }

  const handleCopyImproved = () => {
    navigator.clipboard.writeText(improvement.improvedContent);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      const result = await downloadMutation.mutateAsync({ improvementId });
      if (result.pdfUrl) {
        // Open PDF in new tab
        window.open(result.pdfUrl, "_blank");
        toast.success("PDF ready for download!");
      }
    } catch (err) {
      toast.error("Failed to download PDF");
    }
  };

  // Parse changes if they're stored as JSON
  const changes = Array.isArray(improvement.changes) ? improvement.changes : [];

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => setLocation("/upload")}>
            ← Back to Upload
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Resume Improvement Complete</h1>
          <p className="text-slate-600">Your resume has been successfully improved based on your instructions.</p>
        </div>

        <Tabs defaultValue="comparison" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="changes">Changes ({changes.length})</TabsTrigger>
            <TabsTrigger value="improved">Improved Resume</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Original Resume</CardTitle>
                  <CardDescription>Your original content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-100 p-4 rounded text-sm text-slate-700 max-h-96 overflow-y-auto whitespace-pre-wrap font-mono">
                    {improvement.originalContent}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Improved Resume</CardTitle>
                  <CardDescription>Enhanced version</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-green-50 p-4 rounded text-sm text-slate-700 max-h-96 overflow-y-auto whitespace-pre-wrap font-mono">
                    {improvement.improvedContent}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="changes" className="space-y-4">
            {changes.length > 0 ? (
              <div className="space-y-4">
                {changes.map((change: any, idx: number) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="text-sm">{change.section}</CardTitle>
                      <CardDescription>{change.reason}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">Original:</p>
                        <p className="text-sm text-slate-700 bg-slate-100 p-2 rounded">{change.original}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">Improved:</p>
                        <p className="text-sm text-slate-700 bg-green-100 p-2 rounded">{change.improved}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-slate-600">No specific changes were detected. The resume has been optimized for ATS.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="improved">
            <Card>
              <CardHeader>
                <CardTitle>Your Improved Resume</CardTitle>
                <CardDescription>Ready to download and submit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-100 p-6 rounded text-sm text-slate-700 max-h-96 overflow-y-auto whitespace-pre-wrap font-mono">
                  {improvement.improvedContent}
                </div>
                <div className="flex gap-4">
                  <Button onClick={handleCopyImproved} className="flex items-center gap-2">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy to Clipboard"}
                  </Button>
                  <Button onClick={handleDownload} disabled={downloadMutation.isPending} className="flex items-center gap-2">
                    {downloadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <Button onClick={() => setLocation("/upload")} variant="outline" className="w-full">
            Improve Another Resume
          </Button>
        </div>
      </div>
    </div>
  );
}
