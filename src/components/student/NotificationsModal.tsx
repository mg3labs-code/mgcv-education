import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface NotificationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const notifications = [
  { icon: "🔔", text: "AI Quiz available on June 10", time: "2 hours ago", type: "alert" },
  { icon: "📚", text: "New assignment added: Mathematics Chapter 2", time: "5 hours ago", type: "info" },
  { icon: "🎯", text: "You're on a 7-day streak! Keep it up!", time: "Today", type: "success" },
  { icon: "📝", text: "Draft reminder: Complete your learning notes", time: "Yesterday", type: "warning" },
  { icon: "🏆", text: "Achievement unlocked: Quiz Master!", time: "2 days ago", type: "success" },
  { icon: "📊", text: "Weekly progress report is ready", time: "3 days ago", type: "info" },
];

const typeColors: Record<string, string> = {
  alert: "border-l-red-500 bg-red-50",
  info: "border-l-blue-500 bg-blue-50",
  success: "border-l-emerald-500 bg-emerald-50",
  warning: "border-l-amber-500 bg-amber-50",
};

const NotificationsModal = ({ open, onOpenChange }: NotificationsModalProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-[500px]">
      <DialogHeader className="border-b-2 border-gray-100 pb-4">
        <DialogTitle className="text-xl text-[#2c3e50]">🔔 Notifications</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-3 mt-4 max-h-[60vh] overflow-y-auto">
        {notifications.map((n, i) => (
          <div key={i} className={`p-4 rounded-xl border-l-4 ${typeColors[n.type]} transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer`}>
            <div className="flex items-start gap-3">
              <span className="text-xl">{n.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#2c3e50]">{n.text}</p>
                <span className="text-xs text-gray-400 mt-1 block">{n.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DialogContent>
  </Dialog>
);

export default NotificationsModal;
