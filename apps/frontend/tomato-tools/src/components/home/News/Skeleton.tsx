import React from "react";
import { Skeleton as AntSkeleton, Divider, List, Button } from "antd";

interface SkeletonProps {
  data?: any[];
  loading?: boolean;
  emptyDescription?: React.ReactNode;
  children?: React.ReactNode;
}

export default function Skeleton(props: SkeletonProps) {
  const { loading = true, data, emptyDescription, children } = props;

  if (!loading && !data?.length) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400">
        {emptyDescription || "暂无内容"}
      </div>
    );
  }

  if (!loading) {
    return <>{children}</>;
  }

  return (
    <div className="flex-1 p-4">
      <AntSkeleton active />
      <div className="mt-4 space-y-2">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <AntSkeleton.Input key={i} active />
          ))}
      </div>
      <Divider className="my-4" />
      <AntSkeleton active />
      <div className="mt-4 space-y-2">
        {Array(2)
          .fill(0)
          .map((_, i) => (
            <AntSkeleton.Input key={i} active />
          ))}
      </div>
    </div>
  );
}
