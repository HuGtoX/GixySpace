import React, { useState } from "react";
import { Modal } from "antd";

interface ConfirmModalProps {
  title?: string;
  message: string;
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  confirmText?: string;
  cancelText?: string;
  confirmDanger?: boolean;
  [key: string]: any;
}

function ConfirmModal(props: ConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const {
    title = "确认操作",
    message,
    visible,
    onClose,
    onConfirm,
    confirmText = "确认",
    cancelText = "取消",
    confirmDanger = false,
    ...restProps
  } = props;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <Modal
      zIndex={1001}
      title={title}
      open={visible}
      onCancel={onClose}
      okText={confirmText}
      cancelText={cancelText}
      centered
      okButtonProps={{ danger: confirmDanger }}
      confirmLoading={loading}
      onOk={handleConfirm}
      {...restProps}
    >
      <p>{message}</p>
    </Modal>
  );
}

export default ConfirmModal;
