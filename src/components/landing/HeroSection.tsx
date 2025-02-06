import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Cover } from "@/components/ui/cover";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Intelligent Customer Support
          </h2>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
           <Cover>‎ Mahasen AI ‎ </Cover>
            <br />  
          </h1>
            
          <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto">
            Manage all your customer conversations from WhatsApp, Facebook, and Instagram in one place.
            Respond faster, collaborate better.
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <HoverBorderGradient
            onClick={() => navigate("/signup")}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white"
            containerClassName="rounded-md"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </HoverBorderGradient>
          <HoverBorderGradient
            onClick={() => navigate("/login")}
            className="px-4 py-2 text-sm font-medium text-white"
            containerClassName="rounded-md"
          >
            Sign in
          </HoverBorderGradient>
        </div>
      </div>
    </section>
  );
};