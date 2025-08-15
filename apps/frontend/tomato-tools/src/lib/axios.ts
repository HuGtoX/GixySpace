import axios from "axios";
import type {
  InternalAxiosRequestConfig,
  AxiosInstance,
  AxiosResponse,
} from "axios";
import { message } from "antd";
import { GuestID } from "@/config/constants";

declare module "axios" {
  interface AxiosInstance {
    request<T = unknown>(config: AxiosRequestConfig): Promise<T>;
    get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T = unknown>(
      url: string,
      data?: unknown,
      config?: AxiosRequestConfig,
    ): Promise<T>;
  }
}

const instance: AxiosInstance = axios.create({
  withCredentials: false,
  timeout: 1000 * 60,
});

// 添加请求拦截器
instance.interceptors.request.use(
  function (config: InternalAxiosRequestConfig) {
    config.data = config.data;
    // @ts-expect-error - Setting headers on config
    config.headers = {
      "Content-Type": "application/json", //配置请求头
    };

    // 添加访客ID
    if (typeof window !== "undefined") {
      const guestId = localStorage.getItem(GuestID) || "default-guest-id";
      config.headers["X-Guest-ID"] = guestId;
    }

    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);

// 添加响应拦截器
instance.interceptors.response.use(
  function (response: AxiosResponse) {
    return response.data;
  },
  function (error) {
    // 在浏览器环境中显示错误消息
    if (typeof window !== "undefined") {
      console.warn("API Error:", error.message);
      if (error.status === 401) {
        message.open({
          type: "error",
          content: "用户未授权，请登录",
          duration: 2,
        });
      } else {
        message.open({
          type: "error",
          content: error.message,
          duration: 2,
        });
      }
    }
    return Promise.reject(error);
  },
);

export default instance;
