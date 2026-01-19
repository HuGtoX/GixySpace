"use client";

import React from "react";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

const Container = ({ children, className = "" }: ContainerProps) => {
  return (
    <div className={`min-h-screen transition-colors ${className}`}>
      {children}
    </div>
  );
};

export default Container;
