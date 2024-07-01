# 数据血缘模块

base antd G6 graph，customize node and edge.

## 使用方式
使用组件LineageGraph
```javascript
  <LineageGraph :lineage-data="bloodMap" highlight-color="#063970" textWaterMarker="数据血缘" />
```
## how to use?
first use component 'LineageGraph',like is

```javascript
  <LineageGraph :lineage-data="bloodMap" highlight-color="#063970" textWaterMarker="数据血缘" />
```

## 参数说明 
| params    | explanation |
| -------- | ------- |
| lineage-data  | 渲染的数据（结构再data.json）   |
| highlight-color | 连线的颜色    |
| textWaterMarker    | 水印内容    |

## params explanation

| params    | explanation |
| -------- | ------- |
| lineage-data  | render blood data (example to data.json)  |
| highlight-color | edge line color     |
| textWaterMarker    | watermake concent    |