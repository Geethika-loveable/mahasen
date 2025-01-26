import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="border-t bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            All Rights Reserved - Azynctra 2025
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/about")}>
              About Us
            </Button>
            <div className="text-sm space-x-4 text-muted-foreground">
              <a 
                href="https://geethikaisuru.notion.site/Aventis-Privacy-Policy-140671df8cf1809fb347e99502582345" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Privacy Policy
              </a>
              <span>•</span>
              <a 
                href="https://geethikaisuru.notion.site/Aventis-Terms-Of-Service-140671df8cf18036a04dc535bf2db052" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Terms & Conditions
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};