import { useState, useRef } from "react";
import { List, Button, Space } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { FaFilePdf } from "react-icons/fa";
import { formatBytes } from "@gixy/utils";
import style from "./style.module.scss";

type DraggableListProps = {
  items: any[];
  onChange: (newItems: any[]) => void;
  handleDelete: (uid: string) => void;
};

const DraggableList: React.FC<DraggableListProps> = (props) => {
  const { items, onChange, handleDelete } = props;

  const [draggingIndex, setDraggingIndex] = useState(-1);
  const dragOverIndex = useRef(-1);

  // 处理拖拽开始
  const handleDragStart = (e: any, index: number) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", ""); // 必须设置数据
  };

  // 处理拖拽经过
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    const { clientY } = event;
    const items = [
      ...Array.from(
        document.querySelector(".ant-list .ant-list-items")?.children ?? [],
      ),
    ];

    // 移除当前拖拽项
    const filteredItems = items.filter((_, i) => i !== draggingIndex);

    // 计算所有项的相对位置
    const positions = filteredItems.map((item) => {
      const rect = item.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height,
      };
    });

    // 寻找插入位置
    let newIndex = -1;
    if (clientY < positions[0]?.top) {
      newIndex = 0;
    } else if (clientY > positions[positions.length - 1].bottom) {
      newIndex = filteredItems.length;
    } else {
      newIndex = positions.findIndex(
        (pos) => clientY >= pos.top && clientY <= pos.bottom,
      );

      // 精确计算插入位置（上半部还是下半部）
      if (newIndex !== -1) {
        const { top, height } = positions[newIndex];
        const middle = top + height / 2;
        newIndex = clientY > middle ? newIndex + 1 : newIndex;
      }
    }

    // 修正原始列表的索引（考虑过滤掉的拖拽项）
    dragOverIndex.current = newIndex >= draggingIndex ? newIndex + 1 : newIndex;
  };

  // 处理拖拽结束
  const handleDragEnd = () => {
    if (
      dragOverIndex.current === -1 ||
      dragOverIndex.current === draggingIndex
    ) {
      setDraggingIndex(-1);
      return;
    }

    // 创建新数组并交换元素位置
    const newItems = [...items];
    const [removed] = newItems.splice(draggingIndex, 1);
    newItems.splice(dragOverIndex.current, 0, removed);

    onChange(newItems);
    setDraggingIndex(-1);
  };

  return (
    <div className="list">
      <List
        className="custom-scrollbar"
        itemLayout="horizontal"
        dataSource={items}
        renderItem={(item, index) => (
          <List.Item
            draggable
            key={item.id}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            className={`${style.list__item} list-item ${
              index === draggingIndex
                ? `${style.dragging} translate-y-1 transition-transform`
                : ""
            }`}
          >
            <List.Item.Meta
              className="group"
              avatar={<FaFilePdf className="h-8 w-8 text-red-600" />}
              title={<span className="font-medium">{item.name}</span>}
              description={
                <span>大小: {item.size ? formatBytes(item.size) : "--"}</span>
              }
            />
            <Space>
              <Button
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(item.id)}
                type="link"
                style={{ color: "#ff4d4f" }}
              >
                删除
              </Button>
            </Space>
          </List.Item>
        )}
        locale={{
          emptyText: (
            <div style={{ padding: 24, textAlign: "center" }}>
              上传文件开始合并，支持最多10个PDF，可拖拽调整顺序
            </div>
          ),
        }}
      />
    </div>
  );
};

export default DraggableList;
