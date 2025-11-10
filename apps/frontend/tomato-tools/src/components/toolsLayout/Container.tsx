'use client';

import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

const Container = ({ children, className = '' }: ContainerProps) => {
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors ${className}`}>
      {children}
    </div>
  );
};

export default Container;