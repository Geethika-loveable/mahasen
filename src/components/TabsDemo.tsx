import { AnimatedTabs } from "@/components/ui/animated-tabs";

const tabs = [
  {
    title: "Multi-Platform",
    value: "platform",
    content: (
      <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-gradient-to-br from-purple-700 to-violet-900">
        <p>Connect All Your Platforms</p>
        <img
          src="https://images.unsplash.com/photo-1501854140801-50d01698950b"
          alt="Platform Integration"
          className="object-cover object-left-top h-[60%] md:h-[90%] absolute -bottom-10 inset-x-0 w-[90%] rounded-xl mx-auto"
        />
      </div>
    ),
  },
  {
    title: "AI-Powered",
    value: "ai",
    content: (
      <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-gradient-to-br from-emerald-700 to-green-900">
        <p>Smart Responses with AI</p>
        <img
          src="https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7"
          alt="AI Technology"
          className="object-cover object-left-top h-[60%] md:h-[90%] absolute -bottom-10 inset-x-0 w-[90%] rounded-xl mx-auto"
        />
      </div>
    ),
  },
  {
    title: "Analytics",
    value: "analytics",
    content: (
      <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-gradient-to-br from-blue-700 to-indigo-900">
        <p>Powerful Analytics</p>
        <img
          src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158"
          alt="Analytics Dashboard"
          className="object-cover object-left-top h-[60%] md:h-[90%] absolute -bottom-10 inset-x-0 w-[90%] rounded-xl mx-auto"
        />
      </div>
    ),
  },
  {
    title: "Automation",
    value: "automation",
    content: (
      <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-gradient-to-br from-pink-700 to-rose-900">
        <p>Workflow Automation</p>
        <img
          src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e"
          alt="Automation"
          className="object-cover object-left-top h-[60%] md:h-[90%] absolute -bottom-10 inset-x-0 w-[90%] rounded-xl mx-auto"
        />
      </div>
    ),
  },
];

export function TabsDemo() {
  return (
    <div className="h-[20rem] md:h-[40rem] [perspective:1000px] relative flex flex-col max-w-5xl mx-auto w-full items-start justify-start my-40">
      <AnimatedTabs tabs={tabs} />
    </div>
  );
}