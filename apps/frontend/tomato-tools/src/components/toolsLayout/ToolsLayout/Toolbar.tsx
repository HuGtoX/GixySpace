import React from 'react';
import { Space } from 'antd';

interface ToolbarProps {
  children?: React.ReactNode;
}

function Toolbar({ children }: ToolbarProps) {
  if (!children) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <Space wrap><div>{children}</div></Space>
    </div>
  );
}

export default Toolbar;