
import { Navigation } from "@/components/landing/Navigation";
import { Footer } from "@/components/landing/Footer";
import { Check, X, Sparkles, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";

const PricingCard = ({
  title,
  price,
  description,
  features,
  isPopular,
  yearlyPrice,
  isAnnual,
  secondaryInfo,
  gradientClass,
}: {
  title: string;
  price: string;
  description: string;
  features: Array<{ text: string; included: boolean; tooltip?: string }>;
  isPopular?: boolean;
  yearlyPrice?: string;
  isAnnual: boolean;
  secondaryInfo?: string;
  gradientClass?: string;
}) => (
  <Card className={`relative h-full ${isPopular ? 'border-2 border-primary shadow-lg scale-105' : ''} 
    transition-all duration-300 hover:shadow-xl group backdrop-blur-sm bg-background/80`}>
    <div className={`absolute inset-0 opacity-5 transition-opacity group-hover:opacity-10 rounded-lg ${gradientClass}`} />
    <div className="p-6 h-full flex flex-col relative">
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Most Popular
          </Badge>
        </div>
      )}
      
      <div className="text-center mb-6 flex-none">
        <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4">{description}</p>
        <div className="mb-2 relative">
          {isAnnual && price !== 'Custom' && (
            <div className="absolute -top-4 right-0 left-0">
              <span className="text-sm line-through text-muted-foreground">${parseInt(price.replace('$', '')) + 4}/mo</span>
            </div>
          )}
          <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            {isAnnual && yearlyPrice ? yearlyPrice : price}
          </span>
          {price !== 'Custom' && (
            <span className="text-muted-foreground text-lg">/month</span>
          )}
        </div>
        {secondaryInfo && (
          <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">{secondaryInfo}</p>
        )}
      </div>

      <div className="space-y-4 mb-8 flex-grow">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-2 group/feature">
            {feature.included ? (
              <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
            ) : (
              <X className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            )}
            <div className="flex items-center gap-1">
              <span className={feature.included ? 'text-foreground' : 'text-muted-foreground'}>
                {feature.text}
              </span>
              {feature.tooltip && (
                <Tooltip content={feature.tooltip}>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </Tooltip>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-none">
        <Button 
          className={`w-full ${isPopular ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : ''}`}
          variant={isPopular ? "default" : "outline"}
          size="lg"
          onClick={() => window.open("https://wa.me/message/TTJHEFNWX2KKF1", "_blank")}
        >
          {price === 'Custom' ? 'Contact Sales' : 'Get Started'}
        </Button>
        {price !== 'Custom' && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            14-day free trial, no credit card required
          </p>
        )}
      </div>
    </div>
  </Card>
);

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      title: "Starter",
      price: "$17",
      yearlyPrice: "$13",
      description: "Perfect for small businesses just getting started",
      gradientClass: "bg-gradient-to-br from-blue-500 to-teal-500",
      features: [
        { text: "Up to 500 messages/month", included: true, tooltip: "Messages across all connected platforms" },
        { text: "2 social media platforms", included: true, tooltip: "Choose between WhatsApp, Facebook, or Instagram" },
        { text: "Basic AI responses", included: true, tooltip: "Automated responses using our AI system" },
        { text: "Email support", included: true },
        { text: "1 team member", included: true },
        { text: "Knowledge base integration", included: false, tooltip: "Upload and use custom knowledge bases" },
        { text: "Custom AI training", included: false },
        { text: "Priority support", included: false }
      ],
      secondaryInfo: isAnnual ? "Save $48 annually" : undefined
    },
    {
      title: "Professional",
      price: "$99",
      yearlyPrice: "$79",
      description: "Ideal for growing businesses",
      gradientClass: "bg-gradient-to-br from-purple-600 to-pink-600",
      features: [
        { text: "Up to 5,000 messages/month", included: true, tooltip: "Increased message capacity across platforms" },
        { text: "All social media platforms", included: true },
        { text: "Advanced AI with custom training", included: true, tooltip: "Train AI on your business data" },
        { text: "Priority support", included: true },
        { text: "5 team members", included: true },
        { text: "Knowledge base integration", included: true },
        { text: "Analytics dashboard", included: true, tooltip: "Detailed insights and reporting" },
        { text: "Custom integrations", included: false }
      ],
      isPopular: true,
      secondaryInfo: isAnnual ? "Save $240 annually" : undefined
    },
    {
      title: "Enterprise",
      price: "Custom",
      description: "For large organizations with custom needs",
      gradientClass: "bg-gradient-to-br from-gray-800 to-gray-900",
      features: [
        { text: "Unlimited messages", included: true },
        { text: "All platforms + API access", included: true, tooltip: "Full API access for custom integrations" },
        { text: "Custom AI model training", included: true },
        { text: "24/7 dedicated support", included: true },
        { text: "Unlimited team members", included: true },
        { text: "Advanced analytics & reporting", included: true },
        { text: "Custom integrations", included: true },
        { text: "Dedicated account manager", included: true }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <Navigation />
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              Pricing
            </Badge>
            <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Choose the plan that's right for your business. All plans include a 14-day free trial.
            </p>
            
            <div className="inline-flex items-center justify-center gap-3 p-1 bg-white dark:bg-gray-800 rounded-full mb-12 shadow-sm">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-2 rounded-full transition-all ${
                  !isAnnual 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-2 rounded-full transition-all ${
                  isAnnual 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Annually (-20%)
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <PricingCard 
                key={index} 
                {...plan} 
                isAnnual={isAnnual}
              />
            ))}
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              Frequently Asked Questions
            </h2>
            <div className="max-w-3xl mx-auto text-left grid gap-6 mt-8">
              <div className="p-6 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <h3 className="font-medium mb-2">Can I switch plans later?</h3>
                <p className="text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time. Prorated charges will be applied to your next billing cycle.</p>
              </div>
              <div className="p-6 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <h3 className="font-medium mb-2">What happens after my trial ends?</h3>
                <p className="text-muted-foreground">After your 14-day trial, you'll be automatically switched to your selected plan. Don't worry - we'll send you a reminder before this happens.</p>
              </div>
              <div className="p-6 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <h3 className="font-medium mb-2">Do you offer custom solutions?</h3>
                <p className="text-muted-foreground">Yes! Our Enterprise plan can be customized to your specific needs. Contact our sales team to discuss your requirements.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;

