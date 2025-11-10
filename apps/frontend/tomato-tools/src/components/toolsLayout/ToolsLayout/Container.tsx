import React, { ReactNode } from "react";
import { Layout } from "antd";
import Instructions, { InstructionsProps } from "../Instructions";
import History from "../History";
import RelateTools from "../RelateTools";
import ToolHeader from "./ToolHeader";
import styles from "./style.module.scss";

const { Content } = Layout;

interface ContainerProps {
  children: ReactNode;
  title?: string;
  header?: ReactNode;
  footer?: ReactNode;
  instructions?: InstructionsProps;
}

function Container({
  children,
  title,
  header,
  footer,
  instructions,
}: ContainerProps) {
  return (
    <div className="flex flex-col gap-6 lg:h-full lg:flex-row">
      {/* 左侧主操作区 */}
      <Content className="custom-scrollbar lg:flex-1 lg:overflow-y-auto lg:pr-3">
        <div className={styles.container}>
          {title && <ToolHeader title={title} />}
          {header}

          <div className={`${styles.content} bg-white dark:bg-gray-800`}>
            {children}
          </div>
          {footer && (
            <div className={`${styles.footer} bg-white dark:bg-gray-800`}>
              {footer}
            </div>
          )}
        </div>
      </Content>

      {/* 右侧说明区 */}
      <div className="custom-scrollbar transition-all duration-300 lg:w-5/12 lg:overflow-y-auto lg:pl-3">
        {/* 使用说明 */}
        {instructions && <Instructions {...instructions} />}
        {/* 历史记录 */}
        <History />
        {/* 相关工具 */}
        <RelateTools />
      </div>
    </div>
  );
}

export default Container;
