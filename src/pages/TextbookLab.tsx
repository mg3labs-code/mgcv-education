import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageLayout from "@/components/PageLayout";
import EnhancedReader from "@/components/textbook/EnhancedReader";
import InteractiveTutor from "@/components/textbook/InteractiveTutor";
import VisualThinkingLab from "@/components/textbook/VisualThinkingLab";
import FullTextbookView from "@/components/textbook/FullTextbookView";
import { BookOpen, MessageCircle, Sparkles, Library } from "lucide-react";

const TextbookLab = () => {
  return (
    <PageLayout role="student">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold font-serif">Textbook Lab</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chapter 1: Real Numbers — Compare 4 different learning approaches and find what works best
          </p>
        </div>

        <Tabs defaultValue="enhanced" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1">
            <TabsTrigger value="enhanced" className="flex items-center gap-1.5 text-xs py-2">
              <BookOpen className="h-3.5 w-3.5" /> Enhanced Reader
            </TabsTrigger>
            <TabsTrigger value="tutor" className="flex items-center gap-1.5 text-xs py-2">
              <MessageCircle className="h-3.5 w-3.5" /> Interactive Tutor
            </TabsTrigger>
            <TabsTrigger value="visual" className="flex items-center gap-1.5 text-xs py-2">
              <Sparkles className="h-3.5 w-3.5" /> Visual Thinking
            </TabsTrigger>
            <TabsTrigger value="full" className="flex items-center gap-1.5 text-xs py-2">
              <Library className="h-3.5 w-3.5" /> Full Textbook
            </TabsTrigger>
          </TabsList>

          <TabsContent value="enhanced"><EnhancedReader /></TabsContent>
          <TabsContent value="tutor"><InteractiveTutor /></TabsContent>
          <TabsContent value="visual"><VisualThinkingLab /></TabsContent>
          <TabsContent value="full"><FullTextbookView /></TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default TextbookLab;
