import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Send, MessageSquare, User, Plus, Clock } from "lucide-react";
import { format } from "date-fns";

const TeacherParentConnect = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCompose, setShowCompose] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Fetch teacher's class
  const { data: profile } = useQuery({
    queryKey: ["teacher-profile-pc", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("class_name")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch students
  const { data: students } = useQuery({
    queryKey: ["pc-students", profile?.class_name],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .eq("class_name", profile!.class_name!);
      if (error) throw error;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "student")
        .in("user_id", data.map(d => d.user_id));
      const studentIds = new Set(roles?.map(r => r.user_id) || []);
      return data.filter(d => studentIds.has(d.user_id)).sort((a, b) => a.full_name.localeCompare(b.full_name));
    },
    enabled: !!profile?.class_name,
  });

  // Fetch sent messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ["parent-messages", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_messages")
        .select("*")
        .eq("teacher_id", user!.id)
        .order("sent_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStudent || !subject || !message) throw new Error("Fill all fields");
      const { error } = await supabase.from("parent_messages").insert({
        teacher_id: user!.id,
        student_id: selectedStudent,
        subject,
        message,
        class_name: profile!.class_name!,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Message sent!");
      setShowCompose(false);
      setSelectedStudent("");
      setSubject("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["parent-messages"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const nameMap: Record<string, string> = {};
  students?.forEach(s => { nameMap[s.user_id] = s.full_name; });

  return (
    <DashboardLayout role="teacher" breadcrumbItems={[{ label: "Dashboard", href: "/teacher" }, { label: "Parent Connect" }]}>
      <main className="p-6 max-w-[900px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">💬 Parent Connect</h1>
            <p className="text-muted-foreground">Communicate with parents about student progress</p>
          </div>
          <Button onClick={() => setShowCompose(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New Message
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center">
            <MessageSquare className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-card-foreground">{messages?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Messages Sent</p>
          </Card>
          <Card className="p-4 text-center">
            <User className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold text-card-foreground">{students?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Students</p>
          </Card>
          <Card className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold text-card-foreground">
              {messages?.[0] ? format(new Date(messages[0].sent_at), "MMM d") : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Last Sent</p>
          </Card>
        </div>

        {/* Message History */}
        <div className="space-y-3">
          {isLoading && <p className="text-muted-foreground text-center py-8">Loading messages...</p>}
          {messages?.map((msg: any) => (
            <Card key={msg.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-card-foreground">{msg.subject}</h4>
                  <p className="text-xs text-muted-foreground">
                    To: Parent of {nameMap[msg.student_id] || "Student"} • {format(new Date(msg.sent_at), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
                <Badge variant="secondary">Sent</Badge>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{msg.message}</p>
            </Card>
          ))}
          {(!messages || messages.length === 0) && !isLoading && (
            <div className="text-center py-16">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No messages yet. Start communicating with parents!</p>
            </div>
          )}
        </div>

        {/* Compose Dialog */}
        <Dialog open={showCompose} onOpenChange={setShowCompose}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Send Message to Parent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Student</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                >
                  <option value="">Select student...</option>
                  {students?.map(s => (
                    <option key={s.user_id} value={s.user_id}>{s.full_name}</option>
                  ))}
                </select>
              </div>
              <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
              <Textarea placeholder="Write your message to the parent..." rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
              <Button className="w-full gap-2" onClick={() => sendMutation.mutate()}
                disabled={!selectedStudent || !subject || !message || sendMutation.isPending}>
                <Send className="h-4 w-4" />
                {sendMutation.isPending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </DashboardLayout>
  );
};

export default TeacherParentConnect;
