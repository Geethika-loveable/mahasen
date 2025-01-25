import { AnimatedTabs } from "@/components/ui/animated-tabs";

const tabs = [
  {
    title: "Multi Platform",
    value: "platform",
    content: (
      <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="text-center space-y-2">
          <p>Connect All Your Platforms</p>
        </div>
        <img
          src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
          alt="Multi Platform Integration"
          className="object-cover object-left-top h-[60%] md:h-[90%] absolute -bottom-10 inset-x-0 w-[90%] rounded-xl mx-auto"
        />
      </div>
    ),
  },
  {
    title: "Customer Centric",
    value: "customer",
    content: (
      <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-gradient-to-br from-blue-400 to-blue-600">
        <div className="text-center space-y-2">
          <p>Focus on Customer Experience</p>
        </div>
        <img
          src="https://images.unsplash.com/photo-1519389950473-47ba0277781c"
          alt="Customer Experience"
          className="object-cover object-left-top h-[60%] md:h-[90%] absolute -bottom-10 inset-x-0 w-[90%] rounded-xl mx-auto"
        />
      </div>
    ),
  },
  {
    title: "Humans - AI",
    value: "ai",
    content: (
      <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-gradient-to-br from-sky-500 to-sky-700">
        <div className="text-center space-y-2">
          <p>Human-AI Collaboration</p>
          
        </div>
        <img
          src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
          alt="AI Integration"
          className="object-cover object-left-top h-[60%] md:h-[90%] absolute -bottom-10 inset-x-0 w-[90%] rounded-xl mx-auto"
        />
      </div>
    ),
  },
  {
    title: "Agent Architecture",
    value: "architecture",
    content: (
      <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-gradient-to-br from-cyan-500 to-cyan-700">
        <div className="text-center space-y-2">
          <p>Intelligent Agent System</p>
          
        </div>
        <img
          src="https://images.unsplash.com/photo-1531297484001-80022131f5a1"
          alt="Agent Architecture"
          className="object-cover object-left-top h-[60%] md:h-[90%] absolute -bottom-10 inset-x-0 w-[90%] rounded-xl mx-auto"
        />
      </div>
    ),
  },
  {
    title: "Support Tickets",
    value: "tickets",
    content: (
      <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-gradient-to-br from-teal-300 to-teal-500">
        <div className="text-center space-y-2">
          <p>Streamlined Support</p>
          
        </div>
        <img
          src="https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7"
          alt="Support System"
          className="object-cover object-left-top h-[60%] md:h-[90%] absolute -bottom-10 inset-x-0 w-[90%] rounded-xl mx-auto"
        />
      </div>
    ),
  },
];

export function TabsDemo() {
  return (
    <div className="h-[20rem] md:h-[40rem] [perspective:1000px] relative flex flex-col max-w-5xl mx-auto w-full items-start justify-start my-20">
      <AnimatedTabs tabs={tabs} />
    </div>
  );
}