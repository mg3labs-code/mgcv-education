import { useNavigate } from "react-router-dom";
import { GraduationCap, Users, Shield, ArrowRight } from "lucide-react";

const roles = [
  {
    id: "student",
    label: "Student",
    description: "Access your learning episodes, track skill growth, and build mastery.",
    icon: GraduationCap,
    path: "/student",
  },
  {
    id: "teacher",
    label: "Teacher",
    description: "Monitor class performance, identify weak concepts, and track retention.",
    icon: Users,
    path: "/teacher",
  },
  {
    id: "admin",
    label: "Administrator",
    description: "School-wide analytics, adoption metrics, and engagement tracking.",
    icon: Shield,
    path: "/admin",
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center mb-12 animate-fade-in">
        <h1 className="text-4xl font-bold font-serif text-foreground mb-3">
          Elite Thinking Classroom
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          A structured cognitive learning system designed to build long-term scholarly habits within your curriculum.
        </p>
      </div>

      <div className="grid gap-4 w-full max-w-2xl">
        {roles.map((role, i) => (
          <button
            key={role.id}
            onClick={() => navigate(role.path)}
            className="flex items-center gap-5 p-6 rounded-lg border border-border bg-card text-left hover:border-accent hover:shadow-lg transition-all group animate-fade-in"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground shrink-0">
              <role.icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold font-serif text-card-foreground">{role.label}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{role.description}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-10">
        Class 6–10 · CBSE / ICSE Aligned · Cognitive Training System
      </p>
    </div>
  );
};

export default Index;
