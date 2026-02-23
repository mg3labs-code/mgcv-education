import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  { icon: "🎯", name: "Daily Quiz Progress", emoji: "📊" },
  { icon: "📝", name: "Weekly Assignments Progress", emoji: "📋" },
  { icon: "📚", name: "Chapter-wise Progress", emoji: "📖" },
  { icon: "🎓", name: "Semester Progress", emoji: "🏆" },
  { icon: "🌟", name: "Overall Progress", emoji: "📈" },
];

const ProgressModal = ({ open, onOpenChange }: ProgressModalProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-[700px]">
      <DialogHeader className="text-center border-b-[3px] border-blue-500 pb-5">
        <DialogTitle className="text-[28px] text-[#2c3e50]">📊 YOUR LEARNING ANALYTICS</DialogTitle>
        <p className="text-gray-500 mt-2">Track your learning journey with detailed analytics and insights!</p>
      </DialogHeader>
      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))] mt-4">
        {categories.map((c, i) => (
          <button key={i} className="flex items-center gap-4 p-5 rounded-xl border-2 border-blue-500 bg-gradient-to-br from-white to-gray-50 hover:-translate-y-1 hover:shadow-lg transition-all text-left">
            <span className="text-2xl">{c.emoji}</span>
            <span className="flex-1 font-semibold text-[#2c3e50]">{c.icon} {c.name}</span>
            <span className="text-blue-500 text-lg">→</span>
          </button>
        ))}
      </div>
    </DialogContent>
  </Dialog>
);

export default ProgressModal;
