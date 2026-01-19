import axios from "axios";
import type {
  InternalAxiosRequestConfig,
  AxiosInstance,
  AxiosResponse,
} from "axios";
import { ApiResponse } from "@/types";
import { message } from "antd";

declare module "axios" {
  interface AxiosInstance {
    request<T = unknown>(config: AxiosRequestConfig): Promise<T>;
    get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T = ApiResponse<any>>(
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
    // 设置默认Content-Type，如果已经设置则不覆盖
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    // 添加调试日志
    if (process.env.NODE_ENV === "development") {
      console.log("[Axios] 发送请求:", {
        url: config.url,
        method: config.method,
        hasData: !!config.data,
        contentType: config.headers["Content-Type"],
      });
    }

    return config;
  },
  function (error) {
    console.error("[Axios] 请求拦截器错误:", error);
    return Promise.reject(error);
  },
);

// 添加响应拦截器
instance.interceptors.response.use(
  function (response: AxiosResponse) {
    return response.data;
  },
  function (error) {
    // 只在客户端环境显示错误
    if (typeof window !== "undefined") {
      const errorMessage = error.response?.data?.message || error.message;
      message.error(errorMessage);
    }
    // 返回标准化的错误对象
    return Promise.reject({
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
    });
  },
);

export default instance;
