# 任务要求

天气模块新增功能，生成每日城市天气画报，主要内容有ai生成的图片以及描述诗词画面感的语句。
通过点击标题栏右侧的新增按钮，弹出modal框来加载接口请求返回的内容，并写入库，每个用户每天只能生成一次不同城市的画报。
下面是第三方接口的请求实例及接口返回的数据结构。
请根据以上要求帮完成新增的功能组件以及接口路由。

# 请求结构

curl -X POST 'https://api.coze.cn/v1/workflow/stream_run' \
-H "Authorization: Bearer sat_NwB5D6cThd9Akr2MGKRQ80ejhBAPeDcTWDHvCoMOmjed31jORxpbYsDkpbjiAe3W" \
-H "Content-Type: application/json" \
-d '{
"workflow_id": "7579820957188702248",
"app_id": "7579793955551330356",
"parameters": {
"BOT_USER_INPUT": "",
"city": "深圳"
}
}'

# 返回结果

content_type : text
node_id : 900001
node_execute_uuid : ""
node_type : End
usage {3}
output_count : 122
input_count : 336
token_count : 458
node_is_finish : true
node_seq_id : 0
node_title : End
content : {"city":"深圳","condition":"多云","date":"12月11日周四","img":"https://s.coze.cn/t/hmnFn4gCFb0/","poetry":"北风轻抚云纱，二十六度的温柔包裹着南国冬日的矜持；暮色四合时，六十三缕湿气在玻璃上凝结成哲思的露珠。","temp_high":26,"temp_low":19}
