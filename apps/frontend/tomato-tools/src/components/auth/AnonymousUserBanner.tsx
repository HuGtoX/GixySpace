"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Alert, Button } from "antd";
import { useState } from "react";
import ConvertUserModal from "./ConvertUserModal";

export default function AnonymousUserBanner() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  if (!user?.isAnonymous) {
    return null;
  }

  return (
    <>
      <Alert
        message="您正在使用临时账号"
        description={
          <div>
            临时账号数据将在30天后清除，
            <Button
              type="link"
              onClick={() => setShowModal(true)}
              className="h-auto p-0"
            >
              立即转为正式账号
            </Button>
            以永久保存数据
          </div>
        }
        type="warning"
        showIcon
        closable
        className="mb-4"
      />
      <ConvertUserModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
