import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Decorative mesh */}
      <div className="absolute -top-[30%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,hsl(162_65%_38%/0.08)_0%,transparent_70%)] blur-3xl" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(circle,hsl(210_65%_52%/0.06)_0%,transparent_70%)] blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" as const }}
        className="text-center relative z-10 px-6"
      >
        <div className="text-8xl md:text-[10rem] font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary/30 to-info/20 leading-none mb-4">
          404
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Page not found</h1>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          The page <code className="text-xs bg-muted px-2 py-0.5 rounded">{location.pathname}</code> doesn't exist.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild variant="default" className="rounded-full">
            <Link to="/"><Home className="h-4 w-4 mr-1" /> Home</Link>
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Go Back
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
