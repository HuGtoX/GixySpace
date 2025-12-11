/**
 * 和风天气API TypeScript类型定义
 * 基于api.md文档生成
 */

// ==================== 通用类型 ====================

/**
 * API响应状态码
 */
export type WeatherCode =
  | "200" // 请求成功
  | "204" // 请求成功，但你查询的地区暂时没有你需要的数据
  | "400" // 请求错误，可能包含错误的请求参数或缺少必选的请求参数
  | "401" // 认证失败，可能使用了错误的KEY、数字签名错误、KEY的类型错误
  | "402" // 超过访问次数或余额不足以支持继续访问服务
  | "403" // 无访问权限，可能是绑定的PackageName、BundleID、域名IP地址不一致
  | "404" // 查询的数据或地区不存在
  | "429" // 超过限定的QPM
  | "500"; // 无响应或超时

/**
 * 多语言设置
 */
export type Language =
  | "zh" // 中文
  | "zh-hk" // 中文繁体
  | "en" // 英文
  | "de" // 德语
  | "es" // 西班牙语
  | "fr" // 法语
  | "it" // 意大利语
  | "ja" // 日语
  | "ko" // 韩语
  | "ru" // 俄语
  | "hi" // 印地语
  | "th" // 泰语
  | "ar" // 阿拉伯语
  | "pt" // 葡萄牙语
  | "bn" // 孟加拉语
  | "ms" // 马来语
  | "nl" // 荷兰语
  | "el" // 希腊语
  | "la" // 拉丁语
  | "sv" // 瑞典语
  | "id" // 印尼语
  | "pl" // 波兰语
  | "tr" // 土耳其语
  | "cs" // 捷克语
  | "et" // 爱沙尼亚语
  | "vi" // 越南语
  | "fil" // 菲律宾语
  | "fi" // 芬兰语
  | "he" // 希伯来语
  | "is" // 冰岛语
  | "nb"; // 挪威语

/**
 * 数据单位设置
 */
export type Unit = "m" | "i"; // m=公制单位(默认), i=英制单位

/**
 * 位置坐标格式 (经度,纬度)
 * 例如: "116.41,39.92"
 */
export type LocationCoordinate = string;

/**
 * 位置ID格式
 * 例如: "101010100"
 */
export type LocationID = string;

/**
 * 位置参数 - 可以是LocationID或坐标
 */
export type LocationParam = LocationID | LocationCoordinate;

// ==================== 请求参数类型 ====================

/**
 * 实时天气查询参数
 */
export interface WeatherNowParams {
  /** 位置参数 - LocationID或经纬度坐标 */
  location: LocationParam;
  /** 多语言设置 */
  lang?: Language;
  /** 数据单位设置 */
  unit?: Unit;
}

/**
 * 天气预报查询参数
 */
export interface WeatherForecastParams extends WeatherNowParams {
  /** 预报天数，可选值：1-15 */
  days?: number;
}

/**
 * 城市搜索参数
 */
export interface CitySearchParams {
  /** 城市名称 */
  location: string;
  /** 返回结果数量，默认10，最大20 */
  number?: number;
  /** 多语言设置 */
  lang?: Language;
}

// ==================== 响应数据类型 ====================

/**
 * API响应基础结构
 */
export interface BaseResponse {
  /** 状态码 */
  code: WeatherCode;
  /** 最近更新时间 */
  updateTime: string;
  /** 响应式页面链接 */
  fxLink: string;
  /** 数据来源信息 */
  refer: {
    /** 原始数据来源 */
    sources?: string[];
    /** 数据许可或版权声明 */
    license?: string[];
  };
}

/**
 * 实时天气数据
 */
export interface WeatherNow {
  /** 数据观测时间 */
  obsTime: string;
  /** 温度，默认单位：摄氏度 */
  temp: string;
  /** 体感温度，默认单位：摄氏度 */
  feelsLike: string;
  /** 天气状况图标代码 */
  icon: string;
  /** 天气状况文字描述 */
  text: string;
  /** 风向360角度 */
  wind360: string;
  /** 风向 */
  windDir: string;
  /** 风力等级 */
  windScale: string;
  /** 风速，公里/小时 */
  windSpeed: string;
  /** 相对湿度，百分比数值 */
  humidity: string;
  /** 过去1小时降水量，默认单位：毫米 */
  precip: string;
  /** 大气压强，默认单位：百帕 */
  pressure: string;
  /** 能见度，默认单位：公里 */
  vis: string;
  /** 云量，百分比数值，可能为空 */
  cloud?: string;
  /** 露点温度，可能为空 */
  dew?: string;
}

/**
 * 实时天气响应
 */
export interface WeatherNowResponse extends BaseResponse {
  /** 实时天气数据 */
  now: WeatherNow;
}

/**
 * 天气预报单日数据
 */
export interface WeatherDaily {
  /** 预报日期 */
  fxDate: string;
  /** 日出时间 */
  sunrise: string;
  /** 日落时间 */
  sunset: string;
  /** 月升时间 */
  moonrise: string;
  /** 月落时间 */
  moonset: string;
  /** 月相名称 */
  moonPhase: string;
  /** 月相图标代码 */
  moonPhaseIcon: string;
  /** 最高温度 */
  tempMax: string;
  /** 最低温度 */
  tempMin: string;
  /** 白天天气状况图标代码 */
  iconDay: string;
  /** 白天天气状况文字描述 */
  textDay: string;
  /** 夜间天气状况图标代码 */
  iconNight: string;
  /** 夜间天气状况文字描述 */
  textNight: string;
  /** 白天风向360角度 */
  wind360Day: string;
  /** 白天风向 */
  windDirDay: string;
  /** 白天风力等级 */
  windScaleDay: string;
  /** 白天风速，公里/小时 */
  windSpeedDay: string;
  /** 夜间风向360角度 */
  wind360Night: string;
  /** 夜间风向 */
  windDirNight: string;
  /** 夜间风力等级 */
  windScaleNight: string;
  /** 夜间风速，公里/小时 */
  windSpeedNight: string;
  /** 相对湿度，百分比数值 */
  humidity: string;
  /** 降水量，默认单位：毫米 */
  precip: string;
  /** 大气压强，默认单位：百帕 */
  pressure: string;
  /** 能见度，默认单位：公里 */
  vis: string;
  /** 云量，百分比数值 */
  cloud: string;
  /** 紫外线强度指数 */
  uvIndex: string;
}

/**
 * 天气预报响应
 */
export interface WeatherForecastResponse extends BaseResponse {
  /** 天气预报数据 */
  daily: WeatherDaily[];
}

/**
 * 城市信息
 */
export interface CityInfo {
  /** 地区/城市名称 */
  name: string;
  /** 地区/城市ID */
  id: string;
  /** 地区/城市纬度 */
  lat: string;
  /** 地区/城市经度 */
  lon: string;
  /** 地区/城市的上级行政区划名称 */
  adm2: string;
  /** 地区/城市所属一级行政区域 */
  adm1: string;
  /** 地区/城市所属国家名称 */
  country: string;
  /** 地区/城市所在时区 */
  tz: string;
  /** 地区/城市目前与UTC时间偏移的小时数 */
  utcOffset: string;
  /** 地区/城市是否当前处于夏令时 */
  isDst: string;
  /** 地区/城市的属性 */
  type: string;
  /** 地区评分 */
  rank: string;
  /** 该地区的天气预报网页链接 */
  fxLink: string;
}

/**
 * 城市搜索响应
 */
export interface CitySearchResponse extends BaseResponse {
  /** 城市信息列表 */
  location: CityInfo[];
}

/**
 * 空气质量数据
 */
export interface AirNow {
  /** 数据发布时间 */
  pubTime: string;
  /** 空气质量指数 */
  aqi: string;
  /** 空气质量指数等级 */
  level: string;
  /** 空气质量指数级别 */
  category: string;
  /** 空气质量的主要污染物，优时返回NA */
  primary: string;
  /** PM10 */
  pm10: string;
  /** PM2.5 */
  pm25: string;
  /** 二氧化氮 */
  no2: string;
  /** 二氧化硫 */
  so2: string;
  /** 一氧化碳 */
  co: string;
  /** 臭氧 */
  o3: string;
}

/**
 * 空气质量响应
 */
export interface AirNowResponse extends BaseResponse {
  /** 空气质量数据 */
  now: AirNow;
}

// ==================== 自定义API响应类型 ====================

/**
 * 统一的API响应格式
 */
export interface ApiResponse<T = any> {
  /** 请求是否成功 */
  success: boolean;
  /** 响应数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
  /** 错误代码 */
  code?: string;
}

/**
 * 位置信息
 */
export interface LocationInfo {
  /** 位置ID */
  id?: string;
  /** 纬度 */
  latitude: string;
  /** 经度 */
  longitude: string;
  /** 城市名称 */
  city: string;
  /** 国家名称 */
  country: string;
  /** 详细地址 */
  address?: string;
}

/**
 * 完整的天气信息响应
 */
export interface WeatherInfoResponse {
  /** 位置信息 */
  location: LocationInfo;
  /** 实时天气 */
  weather: WeatherNowResponse;
  /** 空气质量 */
  air?: AirNowResponse;
  /** 数据更新时间 */
  updateTime: string;
}

/**
 * 天气预报信息响应
 */
export interface WeatherForecastInfoResponse {
  /** 位置信息 */
  location: LocationInfo;
  /** 天气预报 */
  forecast: WeatherForecastResponse;
  /** 数据更新时间 */
  updateTime: string;
}

/**
 * 每日天气预报信息响应（包含实时天气、空气质量和预报数据）
 */
export interface WeatherDailyInfoResponse {
  /** 位置信息 */
  location: LocationInfo;
  /** 实时天气 */
  weather: WeatherNowResponse;
  /** 天气预报 */
  forecast: WeatherForecastResponse;
  /** 空气质量 */
  air?: AirNowResponse;
  /** 数据更新时间 */
  updateTime: string;
}

// ==================== 天气画报相关类型 ====================

/**
 * 天气画报数据（来自第三方API）
 */
export interface WeatherPosterData {
  /** 城市名称 */
  city: string;
  /** 天气状况 */
  condition: string;
  /** 日期 */
  date: string;
  /** AI生成的图片URL */
  img: string;
  /** 诗词描述 */
  poetry: string;
  /** 最高温度 */
  temp_high: number;
  /** 最低温度 */
  temp_low: number;
}

/**
 * 天气画报生成请求参数
 */
export interface WeatherPosterGenerateRequest {
  /** 城市名称 */
  city: string;
}

/**
 * 天气画报生成响应
 */
export interface WeatherPosterGenerateResponse {
  /** 画报数据 */
  poster: WeatherPosterData;
  /** 是否为今日首次生成 */
  isFirstToday: boolean;
}
