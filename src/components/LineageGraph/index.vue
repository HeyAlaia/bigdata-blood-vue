<template>
  <div>
    <div ref="canvasRef" class="canvas-wrapper" />
  </div>
</template>

<script>
import G6 from '@antv/g6'
import './index.css'
import './registerLayout'
import './registerShape'
import {
  getLeftRelation,
  getRightRelation,
  transformData
} from './utils/common'
import {
  clearAllStats,
  handleHighlightColor,
  handleTextWaterMarker,
  renderGraph,
  setLeftStats,
  setRightStats
} from './utils/graphUtil'

export default {
  name: 'Blood',
  props: {
    lineageData: {
      type: Object
    },
    highlightColor: {
      type: String
    },
    textWaterMarker: {
      type: String
    }
  },
  data() {
    return {
      lineageWholeData: undefined,
      graphRef: undefined,
      currentHighlightColorRef: '',
      nodeSize: undefined,
      nodeLevel: undefined,
      fieldCheckedRef: true,
      initialZoom: 100
    }
  },
  watch: {
    lineageData(newVal, oldVal) {
      this.handleDataChange(newVal)
    }
  },
  mounted() {
    this.initG6Graph()
    this.handleDataChange(this.lineageData)
  },
  methods: {
    handleDataChange(newData) {
      const wholeData = newData
      this.lineageWholeData = wholeData
      this.nodeSize = wholeData.size
      this.nodeLevel = wholeData.level
      const data = transformData(wholeData.data)
      renderGraph(this.graphRef, data)
      handleTextWaterMarker(this.graphRef, this.textWaterMarker)
      this.currentHighlightColorRef = this.highlightColor
      handleHighlightColor(this.graphRef, this.highlightColor)
      const windowWidth = document.documentElement.clientWidth
      const windowHeight = document.documentElement.clientHeight
      const width = windowWidth - windowWidth * 0.35
      const height = windowHeight - windowHeight * 0.35
      this.graphRef.changeSize(width, height)
      this.graphRef.fitView()
    },
    initG6Graph() {
      if (!this.graphRef) {
        // 实例化 Minimap
        const minimap = new G6.Minimap()
        // 网格画布
        const grid = new G6.Grid({
          cell: 10,
          type: 'line',
          line: {
            stroke: '#ccc',
            lineWidth: 1
          }
        })
        const container = this.$refs.canvasRef
        const windowWidth = document.documentElement.clientWidth
        const windowHeight = document.documentElement.clientHeight
        const width = windowWidth - windowWidth * 0.35
        const height = windowHeight - windowHeight * 0.35
        // 实例化 Graph
        this.graphRef = new G6.Graph({
          container: container || '',
          width: width,
          height: height,
          plugins: [grid, minimap],
          fitView: true,
          fitViewPadding: [80, 60, 70, 80],
          modes: {
            default: ['drag-canvas', 'zoom-canvas', 'drag-node']
          },
          // 布局配置
          layout: {
            type: 'lineageLayout'
          },
          defaultNode: {
            type: 'dice-er-box',
            color: '#096DD9',
            boxStyle: {
              stroke: '#096DD9',
              lineWidth: 6,
              radius: 4
            },
            style: {
              fill: '#096DD9'
            },
            labelCfg: {
              style: {
                fill: '#ffffff',
                fontSize: 20
              }
            }
          },
          defaultEdge: {
            type: 'dice-er-edge',
            style: {
              stroke: '#6C6B6B',
              lineWidth: 2,
              endArrow: true
            }
          }
        })
      }
      if (this.graphRef) {
        const graph = this.graphRef
        // 设置文字水印
        graph.setTextWaterMarker(this.textWaterMarker)
        graph.zoom(this.initialZoom)
        this.bindEvents(graph)
      }
    },
    /**
     * 处理节点点击事件
     */
    handleNodeClick(
      graph,
      item,
      currentAnchor,
      name
    ) {
      const model = item.getModel()
      const edges = item.getEdges()

      const leftActiveEdges = []

      getLeftRelation(edges, model, currentAnchor, leftActiveEdges)

      const rightActiveEdges = []

      getRightRelation(edges, model, currentAnchor, rightActiveEdges)

      // 清除状态
      clearAllStats(graph)

      // 设置当前节点状态
      graph.setItemState(item, name + '-' + currentAnchor, true)

      // 设置左关联边及节点状态
      setLeftStats(
        graph,
        leftActiveEdges,
        this.currentHighlightColorRef,
        name
      )

      // 设置右关联边及节点状态
      setRightStats(
        graph,
        rightActiveEdges,
        this.currentHighlightColorRef,
        name
      )
    },

    /**
     * 处理连线点击事件
     */
    handleEdgeClick(graph, item, name) {
      const sourceNode = item.getSource()
      const sourceModel = sourceNode.getModel()
      const sourceEdges = sourceNode.getInEdges()

      // 获取当前连线的 source 节点
      const sourceAnchor = item.getModel()['sourceAnchor']

      const leftActiveEdges = []
      leftActiveEdges.push(item)

      getLeftRelation(sourceEdges, sourceModel, sourceAnchor, leftActiveEdges)

      const targetNode = item.getTarget()
      const targetModel = targetNode.getModel()
      const targetEdges = targetNode.getOutEdges()

      // 获取当前连线的 target 节点
      const targetAnchor = item.getModel()['targetAnchor']

      const rightActiveEdges = []
      rightActiveEdges.push(item)

      getRightRelation(targetEdges, targetModel, targetAnchor, rightActiveEdges)

      // 清除状态
      clearAllStats(graph)

      // 设置左关联边及节点状态
      setLeftStats(
        graph,
        leftActiveEdges,
        this.currentHighlightColorRef,
        name
      )

      // 设置右关联边及节点状态
      setRightStats(
        graph,
        rightActiveEdges,
        this.currentHighlightColorRef,
        name
      )
    },
    bindEvents(graph) {
      // 监听节点点击事件
      graph.off('node:click').on('node:click', (evt) => {
        const { item, target } = evt
        const currentAnchor = target.get('name')
        if (!currentAnchor) return

        if (this.fieldCheckedRef) {
          this.handleNodeClick(graph, item, currentAnchor, 'highlight')
        } else {
          this.handleNodeClick(graph, item, currentAnchor, 'tableHighlight')
        }
      })

      // 监听连线点击事件
      graph.off('edge:click').on('edge:click', (evt) => {
        const { item } = evt
        if (this.fieldCheckedRef) {
          this.handleEdgeClick(graph, item, 'highlight')
        } else {
          this.handleEdgeClick(graph, item, 'tableHighlight')
        }
      })

      // 监听只在 canvas 空白处点击事件
      graph.off('canvas:click').on('canvas:click', (evt) => {
        // 清除状态
        clearAllStats(graph)
      })
    }
  }
}
</script>

<style scoped>
.canvas-wrapper {
  background-color: white;
  height: 100%;
  width: 100%;
}
</style>
