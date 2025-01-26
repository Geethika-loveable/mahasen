import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";

interface FeatureIcon {
  ({ className }: { className?: string }): JSX.Element;
}

interface Feature {
  title: string;
  description: string;
  icon: FeatureIcon;
}

interface FeatureCardsProps {
  features: Feature[];
}

export const FeatureCards = ({ features }: FeatureCardsProps) => {
  return (
    <section className="py-24 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <CardContainer key={index}>
              <CardBody className="bg-background relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] border-black/[0.1] w-full h-full rounded-xl p-6 border">
                <CardItem translateZ="50" className="w-12 h-12 text-emerald-600 dark:text-emerald-500">
                  <feature.icon className="w-full h-full" />
                </CardItem>
                <CardItem
                  translateZ="60"
                  className="mt-4 text-xl font-semibold text-foreground"
                >
                  {feature.title}
                </CardItem>
                <CardItem
                  as="p"
                  translateZ="80"
                  className="mt-2 text-muted-foreground"
                >
                  {feature.description}
                </CardItem>

                <CardItem translateZ="100" className="w-full mt-4">
                  <img
                    src={
                      index === 0
                        ? "https://i.ibb.co/KK0Nm6x/Multi-Platform-Integration.jpg"
                        : index === 1
                        ? "https://i.ibb.co/RTz1zc9/Real-time-conversations.jpg"
                        : "https://i.ibb.co/njkfj4m/Smart-inbox.jpg"
                    }
                    alt={
                      index === 0
                        ? "Multi-Platform-Integration"
                        : index === 1
                        ? "Real-time-conversations"
                        : "Smart-inbox"
                    }
                    className="h-60 w-full object-cover rounded-xl group-hover/card:shadow-xl"
                  />
                </CardItem>
              </CardBody>
            </CardContainer>
          ))}
        </div>
      </div>
    </section>
  );
};