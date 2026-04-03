import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, FileText, Zap } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-slate-900 mb-6">Resume Improvement Agent</h1>
            <p className="text-xl text-slate-600 mb-8">Transform your resume with AI-powered suggestions and professional optimization</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card>
                <CardHeader>
                  <Upload className="w-8 h-8 text-blue-600 mb-2" />
                  <CardTitle>Upload Resume</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">Support PDF and image formats with instant text extraction</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <Zap className="w-8 h-8 text-blue-600 mb-2" />
                  <CardTitle>AI Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">Get intelligent suggestions based on your specific instructions</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <FileText className="w-8 h-8 text-blue-600 mb-2" />
                  <CardTitle>Download PDF</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">Get a professionally formatted, ATS-optimized resume</p>
                </CardContent>
              </Card>
            </div>

            <Button size="lg" onClick={() => window.location.href = getLoginUrl()}>
              Get Started
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Resume Improvement Agent</h1>
          <Button variant="outline" onClick={() => setLocation("/history")}>
            View History
          </Button>
        </div>
        
        <Button size="lg" onClick={() => setLocation("/upload")}>
          Upload New Resume
        </Button>
      </div>
    </div>
  );
}
