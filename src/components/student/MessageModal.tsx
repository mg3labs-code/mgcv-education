import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const options = [
  { label: "📨 Message to Everyone", color: "from-[#667eea] to-[#764ba2]" },
  { label: "💚 Message to Students", color: "from-[#667eea] to-[#764ba2]" },
  { label: "👨‍👩‍👧 Message to Parents", color: "from-[#667eea] to-[#764ba2]" },
  { label: "📩 Message to Individual", color: "from-[#667eea] to-[#764ba2]" },
];

const MessageModal = ({ open, onOpenChange }: MessageModalProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-[600px]">
      <DialogHeader className="border-b-2 border-gray-100 pb-4">
        <DialogTitle className="text-[1.8rem] text-[#333] flex items-center gap-2">💬 Message Center</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mt-4">
        {options.map((o, i) => (
          <button key={i} className={`bg-gradient-to-r ${o.color} text-white border-none p-4 rounded-xl cursor-pointer font-medium text-base hover:-translate-y-0.5 hover:shadow-lg transition-all text-center`}>
            {o.label}
          </button>
        ))}
      </div>
    </DialogContent>
  </Dialog>
);

export default MessageModal;
