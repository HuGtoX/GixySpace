import { Modal, Card, Divider } from "antd";
import type { WeatherData } from "@gixy/types";
import { FaWind } from "react-icons/fa";
import "qweather-icons/font/qweather-icons.css"; // 引入天气图标样式

// 根据AQI值获取对应的颜色
const getAqiColor = (aqi: number) => {
  if (aqi <= 50) return "bg-green-100 text-green-600";
  if (aqi <= 100) return "bg-yellow-100 text-yellow-600";
  if (aqi <= 150) return "bg-orange-100 text-orange-600";
  if (aqi <= 200) return "bg-red-100 text-red-600";
  if (aqi <= 300) return "bg-purple-100 text-purple-600";
  return "bg-brown-100 text-brown-600";
};

// 获取天气图标颜色
const getWeatherIconColor = (weatherText: string) => {
  if (weatherText.includes("晴")) return "text-yellow-500";
  if (weatherText.includes("雨")) return "text-blue-500";
  if (weatherText.includes("阴") || weatherText.includes("云"))
    return "text-gray-500";
  return "text-gray-600";
};

interface DetailModalProps {
  isModalVisible: boolean;
  setIsModalVisible: (visible: boolean) => void;
  weatherData: WeatherData | null;
}

const DetailModal: React.FC<DetailModalProps> = ({
  isModalVisible,
  setIsModalVisible,
  weatherData,
}) => {
  if (!weatherData) return null;

  return (
    <Modal
      title="天气详情"
      open={isModalVisible}
      onOk={() => setIsModalVisible(false)}
      onCancel={() => setIsModalVisible(false)}
      okText="关闭"
      width={400}
    >
      <div className="p-2">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <i
              className={`qi-${weatherData.weather.now.icon} mr-2 text-2xl ${getWeatherIconColor(weatherData.weather.now.text)}`}
            />
            <div>
              <div className="text-lg font-bold">
                {weatherData.weather.now.text}
              </div>
              <div className="text-sm text-gray-500">
                更新于:{" "}
                {new Date(weatherData.weather.now.obsTime).toLocaleString(
                  "zh-CN",
                )}
              </div>
            </div>
          </div>
          <div className="text-3xl font-bold">
            {weatherData.weather.now.temp}°C
          </div>
        </div>

        <Divider className="my-3" />

        <Card bordered={false} className="mb-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center p-2">
              {/* <FaDroplets size={18} className="mr-2 text-blue-500" /> */}
              <div>
                <div className="text-xs text-gray-500">湿度</div>
                <div className="text-sm font-medium">
                  {weatherData.weather.now.humidity}%
                </div>
              </div>
            </div>
            <div className="flex items-center p-2">
              <FaWind size={18} className="mr-2 text-gray-500" />
              <div>
                <div className="text-xs text-gray-500">风向风速</div>
                <div className="text-sm font-medium">
                  {weatherData.weather.now.windDir}{" "}
                  {weatherData.weather.now.windSpeed}m/s
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card bordered={false} title="空气质量" className="mb-3">
          <div className="mb-2 flex items-center p-2">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${getAqiColor(Number(weatherData.air.now.aqi))} mr-3 font-bold`}
            >
              {weatherData.air.now.aqi}
            </div>
            <div>
              <div className="text-sm font-medium">
                {weatherData.air.now.category}
              </div>
              <div className="text-xs text-gray-500">
                PM2.5: {weatherData.air.now.pm2p5}μg/m³
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs"></div>
        </Card>
      </div>
    </Modal>
  );
};

export default DetailModal;
