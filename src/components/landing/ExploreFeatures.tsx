import { TabsDemo } from "@/components/TabsDemo";

export const ExploreFeatures = () => {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Explore Our Features
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Discover how our platform can transform your customer support experience
          </p>
        </div>
        <TabsDemo />
      </div>
    </section>
  );
};