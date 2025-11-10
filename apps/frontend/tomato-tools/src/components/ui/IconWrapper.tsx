import React from 'react';

type IconWrapperProps = {
  /** 图标尺寸（默认12px） */
  size?: number;
  /** 背景色类名 */
  background?: string;
  /** 图标元素 */
  icon: React.ReactNode;
  className?: string;
};

const IconWrapper = ({
  size = 12,
  background,
  icon,
  className,
}: IconWrapperProps) => {
  return (
    <div
      className={
        className
          ? className
          : `w-${size} h-${size} mx-auto mb-2 ${background} rounded-lg flex items-center justify-center`
      }
    >
      {icon}
    </div>
  );
};

export default IconWrapper;