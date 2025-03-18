import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";

const TabNavigation = () => {
  const [location] = useLocation();
  const { t } = useTranslation();

  const tabs = [
    {
      path: "/",
      label: t("home"),
      icon: "home",
    },
    {
      path: "/assessments",
      label: t("assessments"),
      icon: "checklist",
    },
    {
      path: "/patients",
      label: t("patients"),
      icon: "people",
    },
    {
      path: "/resources",
      label: t("resources"),
      icon: "book",
    },
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto">
        <div className="flex overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              href={tab.path}
              className={`flex-1 px-4 py-3 text-center ${
                location === tab.path
                  ? "text-primary border-b-2 border-primary"
                  : "text-neutral-800"
              } flex flex-col items-center text-sm font-medium`}
            >
              <span className="material-icons mb-1">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default TabNavigation;
