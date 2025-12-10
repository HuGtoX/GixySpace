## 请求示例

curl -X GET --compressed \
-H 'Authorization: Bearer your_token' \
'https://your_api_host/v7/weather/3d?location=101010100'

## 参数

路径参数
days(必选)预报天数，支持最多30天预报，可选值：
3d 3天预报。
7d 7天预报。
10d 10天预报。
15d 15天预报。
30d 30天预报。

## 返回数据

```json
{
  "code": "200",
  "updateTime": "2021-11-15T16:35+08:00",
  "fxLink": "http://hfx.link/2ax1",
  "daily": [
    {
      "fxDate": "2021-11-15",
      "sunrise": "06:58",
      "sunset": "16:59",
      "moonrise": "15:16",
      "moonset": "03:40",
      "moonPhase": "盈凸月",
      "moonPhaseIcon": "803",
      "tempMax": "12",
      "tempMin": "-1",
      "iconDay": "101",
      "textDay": "多云",
      "iconNight": "150",
      "textNight": "晴",
      "wind360Day": "45",
      "windDirDay": "东北风",
      "windScaleDay": "1-2",
      "windSpeedDay": "3",
      "wind360Night": "0",
      "windDirNight": "北风",
      "windScaleNight": "1-2",
      "windSpeedNight": "3",
      "humidity": "65",
      "precip": "0.0",
      "pressure": "1020",
      "vis": "25",
      "cloud": "4",
      "uvIndex": "3"
    },
    {
      "fxDate": "2021-11-16",
      "sunrise": "07:00",
      "sunset": "16:58",
      "moonrise": "15:38",
      "moonset": "04:40",
      "moonPhase": "盈凸月",
      "moonPhaseIcon": "803",
      "tempMax": "13",
      "tempMin": "0",
      "iconDay": "100",
      "textDay": "晴",
      "iconNight": "101",
      "textNight": "多云",
      "wind360Day": "225",
      "windDirDay": "西南风",
      "windScaleDay": "1-2",
      "windSpeedDay": "3",
      "wind360Night": "225",
      "windDirNight": "西南风",
      "windScaleNight": "1-2",
      "windSpeedNight": "3",
      "humidity": "74",
      "precip": "0.0",
      "pressure": "1016",
      "vis": "25",
      "cloud": "1",
      "uvIndex": "3"
    },
    {
      "fxDate": "2021-11-17",
      "sunrise": "07:01",
      "sunset": "16:57",
      "moonrise": "16:01",
      "moonset": "05:41",
      "moonPhase": "盈凸月",
      "moonPhaseIcon": "803",
      "tempMax": "13",
      "tempMin": "0",
      "iconDay": "100",
      "textDay": "晴",
      "iconNight": "150",
      "textNight": "晴",
      "wind360Day": "225",
      "windDirDay": "西南风",
      "windScaleDay": "1-2",
      "windSpeedDay": "3",
      "wind360Night": "225",
      "windDirNight": "西南风",
      "windScaleNight": "1-2",
      "windSpeedNight": "3",
      "humidity": "56",
      "precip": "0.0",
      "pressure": "1009",
      "vis": "25",
      "cloud": "0",
      "uvIndex": "3"
    }
  ],
  "refer": {
    "sources": ["QWeather", "NMC", "ECMWF"],
    "license": ["QWeather Developers License"]
  }
}
```

code 请参考状态码
updateTime 当前API的最近更新时间
fxLink 当前数据的响应式页面，便于嵌入网站或应用
daily.fxDate 预报日期
daily.sunrise 日出时间，在高纬度地区可能为空
daily.sunset 日落时间，在高纬度地区可能为空
daily.moonrise 当天月升时间，可能为空
daily.moonset 当天月落时间，可能为空
daily.moonPhase 月相名称
daily.moonPhaseIcon 月相图标代码，另请参考天气图标项目
daily.tempMax 预报当天最高温度
daily.tempMin 预报当天最低温度
daily.iconDay 预报白天天气状况的图标代码，另请参考天气图标项目
daily.textDay 预报白天天气状况文字描述，包括阴晴雨雪等天气状态的描述
daily.iconNight 预报夜间天气状况的图标代码，另请参考天气图标项目
daily.textNight 预报晚间天气状况文字描述，包括阴晴雨雪等天气状态的描述
daily.wind360Day 预报白天风向360角度
daily.windDirDay 预报白天风向
daily.windScaleDay 预报白天风力等级
daily.windSpeedDay 预报白天风速，公里/小时
daily.wind360Night 预报夜间风向360角度
daily.windDirNight 预报夜间当天风向
daily.windScaleNight 预报夜间风力等级
daily.windSpeedNight 预报夜间风速，公里/小时
daily.precip 预报当天总降水量，默认单位：毫米
daily.uvIndex 紫外线强度指数
daily.humidity 相对湿度，百分比数值
daily.pressure 大气压强，默认单位：百帕
daily.vis 能见度，默认单位：公里
daily.cloud 云量，百分比数值。可能为空
refer.sources 原始数据来源，或数据源说明，可能为空
refer.license 数据许可或版权声明，可能为空

图标代码 天气 白天 夜晚
100 晴 ✅ ❌
101 多云 ✅ ❌
102 少云 ✅ ❌
103 晴间多云 ✅ ❌
104 阴 ✅ ✅
150 晴 ❌ ✅
151 多云 ❌ ✅
152 少云 ❌ ✅
153 晴间多云 ❌ ✅
300 阵雨 ✅ ❌
301 强阵雨 ✅ ❌
302 雷阵雨 ✅ ✅
303 强雷阵雨 ✅ ✅
304 雷阵雨伴有冰雹 ✅ ✅
305 小雨 ✅ ✅
306 中雨 ✅ ✅
307 大雨 ✅ ✅
308 极端降雨 ✅ ✅
309 毛毛雨/细雨 ✅ ✅
310 暴雨 ✅ ✅
311 大暴雨 ✅ ✅
312 特大暴雨 ✅ ✅
313 冻雨 ✅ ✅
314 小到中雨 ✅ ✅
315 中到大雨 ✅ ✅
316 大到暴雨 ✅ ✅
317 暴雨到大暴雨 ✅ ✅
318 大暴雨到特大暴雨 ✅ ✅
350 阵雨 ❌ ✅
351 强阵雨 ❌ ✅
399 雨 ✅ ✅
400 小雪 ✅ ✅
401 中雪 ✅ ✅
402 大雪 ✅ ✅
403 暴雪 ✅ ✅
404 雨夹雪 ✅ ✅
405 雨雪天气 ✅ ✅
406 阵雨夹雪 ✅ ❌
407 阵雪 ✅ ❌
408 小到中雪 ✅ ✅
409 中到大雪 ✅ ✅
410 大到暴雪 ✅ ✅
456 阵雨夹雪 ❌ ✅
457 阵雪 ❌ ✅
499 雪 ✅ ✅
500 薄雾 ✅ ✅
501 雾 ✅ ✅
502 霾 ✅ ✅
503 扬沙 ✅ ✅
504 浮尘 ✅ ✅
507 沙尘暴 ✅ ✅
508 强沙尘暴 ✅ ✅
509 浓雾 ✅ ✅
510 强浓雾 ✅ ✅
511 中度霾 ✅ ✅
512 重度霾 ✅ ✅
513 严重霾 ✅ ✅
514 大雾 ✅ ✅
515 特强浓雾 ✅ ✅
900 热 ✅ ✅
901 冷 ✅ ✅
999 未知 ✅ ✅
