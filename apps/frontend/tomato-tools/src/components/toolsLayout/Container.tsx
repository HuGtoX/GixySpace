"use client";

import React from "react";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

const Container = ({ children, className = "" }: ContainerProps) => {
  return (
    <div
      className={`min-h-screen bg-gray-50 transition-colors dark:bg-gray-900 ${className}`}
    >
      {children}
    </div>
  );
};

export default Container;
