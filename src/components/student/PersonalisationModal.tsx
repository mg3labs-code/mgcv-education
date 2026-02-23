import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PersonalisationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  { icon: "🎨", name: "Appearance & Themes", desc: "Customize colors, themes, and visual style" },
  { icon: "📚", name: "Study Preferences", desc: "Set your learning goals and preferences" },
  { icon: "🔔", name: "Smart Notifications", desc: "Manage alerts, reminders, and motivation" },
  { icon: "🎮", name: "Gamification & Rewards", desc: "Achievements, streaks, and fun challenges" },
  { icon: "♿", name: "Accessibility", desc: "Make learning comfortable for everyone" },
  { icon: "🔒", name: "Data & Privacy", desc: "Control your data and privacy settings" },
];

const PersonalisationModal = ({ open, onOpenChange }: PersonalisationModalProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-[700px]">
      <DialogHeader className="text-center border-b-[3px] border-blue-500 pb-5">
        <DialogTitle className="text-[28px] text-[#2c3e50]">⚙️ PERSONALIZE YOUR EXPERIENCE</DialogTitle>
        <p className="text-gray-500 mt-2">Make this dashboard truly yours! Customize every aspect of your learning experience.</p>
      </DialogHeader>
      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))] mt-4">
        {categories.map((c, i) => (
          <button key={i} className="flex items-center gap-4 p-5 rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-white to-gray-50 hover:-translate-y-1 hover:shadow-lg hover:border-blue-500 transition-all text-left">
            <span className="text-2xl">{c.icon}</span>
            <div className="flex-1">
              <span className="font-semibold text-[#2c3e50] block">{c.name}</span>
              <span className="text-xs text-gray-500">{c.desc}</span>
            </div>
            <span className="text-blue-500">→</span>
          </button>
        ))}
      </div>
      <div className="flex gap-4 justify-center mt-6">
        <button className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-white px-6 py-2.5 rounded-full font-semibold hover:-translate-y-0.5 hover:shadow-md transition-all">
          💾 Save All Changes
        </button>
        <button className="bg-gradient-to-r from-orange-500 to-orange-400 text-white px-6 py-2.5 rounded-full font-semibold hover:-translate-y-0.5 hover:shadow-md transition-all">
          🔄 Reset to Defaults
        </button>
      </div>
    </DialogContent>
  </Dialog>
);

export default PersonalisationModal;
