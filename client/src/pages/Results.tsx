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
  const [copied, setCopied] = useState(false);

  // Get improvement ID from URL params or session storage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setImprovementId(parseInt(id));
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600 capitalize">{improvement.status}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Changes Made</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{improvement.changes.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Created</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                {new Date(improvement.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Instructions Applied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">{improvement.instructions}</p>
          </CardContent>
        </Card>

        <Tabs defaultValue="comparison" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="improved">Improved Resume</TabsTrigger>
            <TabsTrigger value="changes">Changes Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Original Resume</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-100 p-4 rounded max-h-96 overflow-y-auto text-sm whitespace-pre-wrap">
                    {improvement.originalContent}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Improved Resume</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-100 p-4 rounded max-h-96 overflow-y-auto text-sm whitespace-pre-wrap">
                    {improvement.improvedContent}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="improved">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Improved Resume</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleCopyImproved}>
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button size="sm" onClick={handleDownload} disabled={downloadMutation.isPending}>
                      {downloadMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-100 p-6 rounded max-h-96 overflow-y-auto text-sm whitespace-pre-wrap font-mono">
                  {improvement.improvedContent}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="changes">
            <Card>
              <CardHeader>
                <CardTitle>Changes Made ({improvement.changes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {improvement.changes.length === 0 ? (
                  <p className="text-slate-600">No changes recorded</p>
                ) : (
                  <div className="space-y-4">
                    {improvement.changes.map((change: any, idx: number) => (
                      <div key={idx} className="border-l-4 border-blue-400 pl-4 py-2">
                        <p className="font-semibold text-slate-900">{change.section}</p>
                        <p className="text-sm text-slate-600 mt-1">
                          <span className="font-medium">Original:</span> {change.original}
                        </p>
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Improved:</span> {change.improved}
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          <span className="font-medium">Reason:</span> {change.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-4">
          <Button onClick={() => setLocation("/upload")} variant="outline">
            Improve Another Resume
          </Button>
          <Button onClick={() => setLocation("/history")}>View History</Button>
        </div>
      </div>
    </div>
  );
}
