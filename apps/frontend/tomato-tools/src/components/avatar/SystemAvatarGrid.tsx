"use client";

import React from "react";
import { Avatar } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";

interface SystemAvatarGridProps {
  selectedAvatar: string | null;
  onSelect: (avatarUrl: string) => void;
}

// 系统默认头像列表
const SYSTEM_AVATARS = [
  "/avatar/a1.png",
  "/avatar/a2.png",
  "/avatar/a3.png",
  "/avatar/a4.png",
  "/avatar/a5.png",
  "/avatar/a6.png",
  "/avatar/a7.png",
];

export default function SystemAvatarGrid({
  selectedAvatar,
  onSelect,
}: SystemAvatarGridProps) {
  return (
    <div className="grid grid-cols-3 gap-4 p-4 sm:grid-cols-4 sm:gap-5 md:grid-cols-4 md:gap-6 lg:gap-8">
      {SYSTEM_AVATARS.map((avatarUrl, index) => (
        <div
          key={index}
          className="group relative flex cursor-pointer items-center justify-center"
          onClick={() => onSelect(avatarUrl)}
        >
          <div
            className={`relative rounded-full border-2 transition-all duration-200 ${
              selectedAvatar === avatarUrl
                ? "border-orange-500 shadow-md shadow-orange-500/20 dark:border-dark-primary dark:shadow-dark-primary/20"
                : "border-gray-200 hover:border-orange-300 dark:border-gray-700 dark:hover:border-dark-primary/70"
            }`}
          >
            <Avatar size={80} src={avatarUrl} className="h-full w-full" />

            {/* 选中标记 */}
            {selectedAvatar === avatarUrl && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-orange-500/10 dark:bg-dark-primary/10">
                <CheckCircleFilled className="text-2xl text-orange-500 dark:text-dark-primary" />
              </div>
            )}
          </div>

          {/* 简单的悬停效果 */}
          {selectedAvatar !== avatarUrl && (
            <div className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div className="absolute inset-0 rounded-full bg-orange-500/5 dark:bg-dark-primary/5" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export { SYSTEM_AVATARS };
