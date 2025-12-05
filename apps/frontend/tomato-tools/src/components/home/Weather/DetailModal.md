# 天气详情弹窗功能

## 功能概述

天气详情弹窗提供了完整的天气信息展示，包括：

- 当前天气详细信息
- 未来七天天气预报
- 天气趋势图表
- 历史查询城市列表

## 组件结构

### 1. DetailModal.tsx

主弹窗组件，负责整体布局和数据展示。

**功能特性：**

- 左右分栏布局（左侧历史城市，右侧天气详情）
- 支持全屏显示
- 响应式设计，适配不同屏幕尺寸
- MacOS风格的模态框样式

**主要展示内容：**

- 当前天气概览（温度、体感温度、天气状况）
- 空气质量指标（AQI、等级）
- 详细气象指标（湿度、风速、能见度、气压）
- 七天天气趋势图表
- 未来七天详细预报列表
- 日出日落时间

### 2. WeatherChart.tsx

天气趋势图表组件，使用Chart.js渲染。

**功能特性：**

- 展示七天的最高温度、最低温度和湿度趋势
- 支持深色模式自动切换
- 交互式图表，支持悬停查看详细数据
- 双Y轴显示（左侧温度，右侧湿度）

**技术实现：**

- 使用 `react-chartjs-2` 和 `chart.js`
- 折线图展示温度和湿度变化
- 自动适配主题色

### 3. HistoryCityList.tsx

历史查询城市列表组件。

**功能特性：**

- 显示用户历史查询过的城市
- 支持折叠/展开功能
- 显示访问次数和最后访问时间
- 点击城市可快速切换查看该城市天气

**数据来源：**

- 通过 `/api/weather/history` 接口获取历史记录
- 自动记录用户查询的城市

## 使用方式

### 在父组件中使用

```tsx
import DetailModal from "./DetailModal";

<DetailModal
  isModalVisible={isModalVisible}
  setIsModalVisible={setIsModalVisible}
  weatherData={weatherData}
  selectedCity={selectedCity}
  onCityChange={setSelectedCity}
/>;
```

### Props说明

| 属性              | 类型                     | 必填 | 说明              |
| ----------------- | ------------------------ | ---- | ----------------- |
| isModalVisible    | boolean                  | 是   | 控制弹窗显示/隐藏 |
| setIsModalVisible | (value: boolean) => void | 是   | 设置弹窗显示状态  |
| weatherData       | WeatherDailyInfoResponse | 是   | 天气数据          |
| selectedCity      | CityData                 | 是   | 当前选中的城市    |
| onCityChange      | (city: CityData) => void | 是   | 城市切换回调      |

## 依赖安装

```bash
pnpm add chart.js react-chartjs-2
```

## 样式说明

样式文件位于 `styles.css`，包含：

- 基础天气组件样式
- 响应式布局样式
- 深色模式适配
- 动画效果

### 响应式断点

- **桌面端（>1024px）**：完整显示所有功能
- **平板端（768px-1024px）**：隐藏历史城市列表
- **移动端（<768px）**：优化布局，调整图表高度

## API接口

### 获取历史城市列表

```
GET /api/weather/history
```

**响应示例：**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "cityName": "北京",
      "locationId": "101010100",
      "visitCount": 5,
      "lastVisitAt": "2025-12-05T10:00:00Z"
    }
  ]
}
```

### 记录城市访问

```
POST /api/weather/history
```

**请求体：**

```json
{
  "cityName": "北京",
  "cityNameEn": "Beijing",
  "latitude": "39.90",
  "longitude": "116.41",
  "province": "北京市",
  "locationId": "101010100"
}
```

## 主题适配

组件完全支持深色模式，会自动根据系统主题切换：

- 文字颜色
- 背景颜色
- 边框颜色
- 图表配色

## 性能优化

1. **图表优化**：使用 `useRef` 缓存图表实例，避免重复渲染
2. **数据缓存**：历史城市数据在组件挂载时获取一次
3. **懒加载**：图表组件按需加载
4. **响应式优化**：移动端隐藏非必要元素

## 未来改进方向

1. 添加城市搜索功能
2. 支持收藏城市
3. 添加更多图表类型（降水量、风速等）
4. 支持导出天气数据
5. 添加天气预警信息
