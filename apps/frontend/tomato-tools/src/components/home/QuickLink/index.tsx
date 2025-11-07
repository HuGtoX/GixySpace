import { FaGithub, FaTwitter, FaLinkedin, FaGlobe } from "react-icons/fa";
import SectionCard from "@/components/SectionCard";

interface LinkItem {
  name: string;
  url: string;
  icon: React.ReactNode;
  color: string;
}

const quickLinks: LinkItem[] = [
  {
    name: "GitHub",
    url: "https://github.com",
    icon: <FaGithub />,
    color: "text-gray-800 dark:text-gray-200"
  },
  {
    name: "Twitter",
    url: "https://twitter.com",
    icon: <FaTwitter />,
    color: "text-blue-500"
  },
  {
    name: "LinkedIn",
    url: "https://linkedin.com",
    icon: <FaLinkedin />,
    color: "text-blue-600"
  },
  {
    name: "官网",
    url: "https://gixyspace.com",
    icon: <FaGlobe />,
    color: "text-green-500"
  }
];

export default function QuickLink() {
  return (
    <SectionCard title="快捷链接">
      <div className="grid grid-cols-2 gap-3">
        {quickLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            <span className={`text-lg ${link.color}`}>
              {link.icon}
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {link.name}
            </span>
          </a>
        ))}
      </div>
    </SectionCard>
  );
}