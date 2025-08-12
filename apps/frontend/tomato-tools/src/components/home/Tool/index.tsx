import { Button } from "antd";
import ToolsModal from "./ToolsModal";
import React, { useState } from "react";
import { toolsMenu } from "@/config/tools";
import { useRouter } from "next/navigation";
import { FaEllipsisH } from "react-icons/fa";
import IconWrapper from "@/components/IconWrapper";

interface ToolItemProps {
  name: string;
  icon: React.ReactNode;
  link?: string;
  background?: string;
  description: string;
  itemClick?: () => void;
}

const ToolItem = ({
  name,
  icon,
  link,
  description,
  itemClick,
  background = "bg-primary/10",
}: ToolItemProps) => {
  const router = useRouter();

  const handleClick = () => {
    itemClick && itemClick();
    if (link) {
      router.push(link);
    }
  };

  return (
    <div
      className="tool-icon ripple pixel-grow cursor-pointer rounded-xl bg-white p-4 text-center shadow-md hover:shadow-lg dark:bg-gray-800"
      draggable="true"
      onClick={handleClick}
    >
      <IconWrapper size={12} background={background} icon={icon} />
      <span className="mb-1 text-sm font-medium">{name}</span>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {description || ""}
      </p>
    </div>
  );
};

export default function Tool() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">常用工具</h2>
        <Button
          type="text"
          className="text-sm text-primary hover:underline dark:text-dark-primary"
        >
          编辑
        </Button>
      </div>
      <div id="tool-grid" className="grid grid-cols-2 gap-4">
        {toolsMenu
          .filter((item) => item.id !== 7) // 过滤掉"其他"工具
          .map((item) => (
            <ToolItem
              key={item.id}
              name={item.name}
              icon={item.icon}
              link={item.url}
              background={item?.background}
              description={item.description}
            />
          ))}

        {/* 单独处理"其他"工具菜单 */}
        <ToolItem
          key={999}
          name={"其他"}
          icon={<FaEllipsisH className="text-gray-500 dark:text-gray-400" />}
          background={"bg-gray-500/10 dark:bg-gray-500/10"}
          itemClick={() => setModalVisible(true)}
          description={"其他实用工具"}
        />
      </div>

      {/* 其他工具弹窗 */}
      <ToolsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}
