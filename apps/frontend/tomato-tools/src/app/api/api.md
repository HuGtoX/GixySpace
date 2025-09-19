实时天气

查询参数
location(必选)需要查询地区的LocationID或以英文逗号分隔的经度,纬度坐标（十进制，最多支持小数点后两位），LocationID可通过GeoAPI获取。例如 location=101010100 或 location=116.41,39.92
lang多语言设置，请阅读多语言文档，了解我们的多语言是如何工作、如何设置以及数据是否支持多语言。
unit数据单位设置，可选值包括unit=m（公制单位，默认）和unit=i（英制单位）。更多选项和说明参考度量衡单位。

返回的数据格式:
code 请参考状态码
updateTime 当前API的最近更新时间
fxLink 当前数据的响应式页面，便于嵌入网站或应用
now.obsTime 数据观测时间
now.temp 温度，默认单位：摄氏度
now.feelsLike 体感温度，默认单位：摄氏度
now.icon 天气状况的图标代码，另请参考天气图标项目
now.text 天气状况的文字描述，包括阴晴雨雪等天气状态的描述
now.wind360 风向360角度
now.windDir 风向
now.windScale 风力等级
now.windSpeed 风速，公里/小时
now.humidity 相对湿度，百分比数值
now.precip 过去1小时降水量，默认单位：毫米
now.pressure 大气压强，默认单位：百帕
now.vis 能见度，默认单位：公里
now.cloud 云量，百分比数值。可能为空
now.dew 露点温度。可能为空
refer.sources 原始数据来源，或数据源说明，可能为空
refer.license 数据许可或版权声明，可能为空
