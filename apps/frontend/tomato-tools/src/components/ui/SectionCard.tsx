import React from "react";

type SectionCardProps = {
  title: string;
  plain?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
};

function SectionCard({ title, plain, right, children }: SectionCardProps) {
  const className = plain
    ? ""
    : "rounded-xl bg-white p-4 shadow-md dark:bg-gray-800";

  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

export default SectionCard;
