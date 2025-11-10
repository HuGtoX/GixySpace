import React from 'react';
import { Card } from 'antd';
import { AppstoreOutlined, BarcodeOutlined, LinkOutlined, LockOutlined, QrcodeOutlined, PictureOutlined, ThunderboltOutlined } from '@ant-design/icons';
import Link from 'next/link';

interface ToolItemProps {
  icon: React.ReactNode;
  title: string;
  href: string;
}

const ToolItem: React.FC<ToolItemProps> = ({ icon, title, href }) => {
  return (
    <Link href={href} className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="text-blue-500 text-lg">{icon}</div>
        <span className="text-sm text-gray-700 dark:text-gray-300">{title}</span>
      </div>
    </Link>
  );
};

const relatedTools = [
  {
    icon: <BarcodeOutlined />,
    title: '条形码生成器',
    href: '/barcode/generate'
  },
  {
    icon: <LinkOutlined />,
    title: '短链接生成器',
    href: '/url/shorten'
  },
  {
    icon: <LockOutlined />,
    title: '文本加密工具',
    href: '/text/encrypt'
  },
  {
    icon: <QrcodeOutlined />,
    title: '二维码解码工具',
    href: '/qrcode/decode'
  },
  {
    icon: <PictureOutlined />,
    title: '图片转二维码',
    href: '/image/to-qrcode'
  },
  {
    icon: <ThunderboltOutlined />,
    title: '批量生成器',
    href: '/batch/generator'
  }
];

function RelateTools() {
  return (
    <Card
      size="small"
      title={
        <span>
          <AppstoreOutlined style={{ marginRight: 8 }} />
          相关工具
        </span>
      }
    >
      <div className="space-y-1">
        {relatedTools.map((tool, index) => (
          <ToolItem
            key={index}
            icon={tool.icon}
            title={tool.title}
            href={tool.href}
          />
        ))}
      </div>
    </Card>
  );
}

export default RelateTools;