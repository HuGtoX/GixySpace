import React from "react";

type SectionCardProps = {
  title?: string | React.ReactNode;
  styles?: React.CSSProperties;
  className?: string;
  plain?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
};

function SectionCard({
  title,
  plain,
  styles,
  right,
  children,
  className,
}: SectionCardProps) {
  const _className = plain
    ? ""
    : "rounded-xl p-4 glass-bg dark:bg-gray-800/70 backdrop-blur-md shadow-lg border border-white/20 dark:border-gray-700/30";

  const renderTitle = () => {
    if (typeof title === "string") {
      return (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {right}
        </div>
      );
    }
    return title;
  };

  return (
    <div style={styles} className={`${_className} ${className}`}>
      {title && renderTitle()}
      <div className="text-gray-800 dark:text-gray-200">{children}</div>
    </div>
  );
}

export default SectionCard;
