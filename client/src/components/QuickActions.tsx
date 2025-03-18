import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { ModalContext } from "@/App";
import { Link } from "wouter";

const QuickActions = () => {
  const { t } = useTranslation();
  const { 
    setShowPregnancyAssessment, 
    setShowSchemeFinder, 
    setShowChildHealthAssessment 
  } = useContext(ModalContext);

  const actions = [
    {
      id: "pregnancy-assessment",
      title: t("pregnancy_assessment"),
      description: t("pregnancy_assessment_desc"),
      icon: "pregnant_woman",
      onClick: () => setShowPregnancyAssessment(true),
    },
    {
      id: "child-anemia",
      title: t("child_health"),
      description: t("child_health_desc"),
      icon: "child_care",
      onClick: () => setShowChildHealthAssessment(true),
    },
    {
      id: "scheme-finder",
      title: t("scheme_finder"),
      description: t("scheme_finder_desc"),
      icon: "help_outline",
      onClick: () => setShowSchemeFinder(true),
    },
    {
      id: "guidelines",
      title: t("medical_guidelines"),
      description: t("medical_guidelines_desc"),
      icon: "menu_book",
      href: "/resources",
    },
  ];

  return (
    <section className="mb-8">
      <h3 className="text-base font-medium mb-3">{t("quick_actions")}</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        {actions.map((action) => (
          <ActionCard
            key={action.id}
            title={action.title}
            description={action.description}
            icon={action.icon}
            onClick={action.onClick}
            href={action.href}
          />
        ))}
      </div>
    </section>
  );
};

interface ActionCardProps {
  title: string;
  description: string;
  icon: string;
  onClick?: () => void;
  href?: string;
}

const ActionCard = ({ title, description, icon, onClick, href }: ActionCardProps) => {
  const Card = (
    <div className="p-4">
      <div className="rounded-full w-10 h-10 flex items-center justify-center bg-primary/10 mb-3">
        <span className="material-icons text-primary">{icon}</span>
      </div>
      <h3 className="font-medium text-sm mb-1">{title}</h3>
      <p className="text-xs text-neutral-800">{description}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
        {Card}
      </Link>
    );
  }

  return (
    <button 
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow w-full text-left" 
      onClick={onClick}
    >
      {Card}
    </button>
  );
};

export default QuickActions;
