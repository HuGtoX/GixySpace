"use client";

import React from "react";
import { Layout, Button } from "antd";
import { useRouter } from "next/navigation";

const { Header: AntHeader } = Layout;

type HeaderProps = {
  title: string;
};

function ToolHeader({ title }: HeaderProps) {
  const router = useRouter();

  return (
    <AntHeader
      className={
        "mb-2.5 flex items-center rounded-md border-b border-gray-200 dark:border-gray-700"
      }
    >
      <Button
        icon={<span>⬅️</span>}
        style={{ marginRight: 10 }}
        onClick={() => router.back()}
      />
      <div style={{ fontSize: 18, fontWeight: "bold", marginRight: "auto" }}>
        {title}
      </div>
    </AntHeader>
  );
}

export default ToolHeader;
