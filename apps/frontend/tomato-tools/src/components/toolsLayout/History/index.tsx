import React from 'react';
import { Card, Empty } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';

function History() {
  return (
    <Card
      size="small"
      style={{ marginBottom: 16 }}
      title={
        <span>
          <HistoryOutlined style={{ marginRight: 8 }} />
          历史记录
        </span>
      }
    >
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂无历史记录"
      />
    </Card>
  );
}

export default History;