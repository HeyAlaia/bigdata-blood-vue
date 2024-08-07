import {
  itemHeight,
  maxLevel,
  nodeWidth
} from '../registerShape'

// 自定义数据转换
export const transformData = (data) => {
  const nodes = []
  // 用 map 实现对象去重
  const edgeMap = new Map()
  // 用 set 实现表名去重
  const tableFields = new Set()
  data.forEach((item) => {
    const targetField = item.targetField
    const tableField = handleTableField(targetField)
    tableFields.add(tableField)
    if (item.refFields) {
      createEdge(edgeMap, tableFields, tableField, item.refFields)
    }
  })

  createNode(nodes, tableFields)
  const edges = Array.from(edgeMap.values())

  return {
    nodes,
    edges
  }
}

/**
 * 创建 Edge 即连线即字段之间的连线
 */
const createEdge = (
  edgeMap,
  tableFields,
  tableField,
  refFields
) => {
  const target = getTableFieldName(tableField)
  const targetName = target.tableName
  const targetAnchor = target.tableField
  refFields.forEach((ref) => {
    const tableField = handleTableField(ref)
    tableFields.add(tableField)

    const source = getTableFieldName(tableField)
    const sourceName = source.tableName
    const sourceAnchor = source.tableField
    // 不能自连，防止绘制失败
    if (targetName === sourceName) {
      return
    }

    const edge = {}
    edge.source = sourceName
    edge.sourceAnchor = sourceAnchor
    edge.target = targetName
    edge.targetAnchor = targetAnchor
    edge.label = ref.label
    const key = sourceName + sourceAnchor + '-' + targetName + targetAnchor
    edgeMap.set(key, edge)
  })
}

/**
 * 拼接表名+字段，逻辑可参考文档
 */
const handleTableField = (item) => {
  const fieldName = item.fieldName
  let tableField = ''
  if (item.final) {
    tableField = fieldName
  } else {
    tableField = `${item.level}-${item.index}:${fieldName}`
  }
  return tableField
}

/**
 * 拆分字符串获取表名称，字段名称
 */
const getTableFieldName = (item) => {
  const names = item.split(':')
  let tableName = ''
  let tableField = ''
  if (names.length === 1) {
    const array = names[0].split('.')
    tableName = array[1]
    tableField = array[2]
  } else {
    const array = names[1].split('.')
    tableName = array[1] + '_' + names[0]
    tableField = array[2]
  }
  return { tableName, tableField }
}

/**
 * 获取表层级及order
 */
const getTableLevelAndOrder = (tableField) => {
  let level = maxLevel
  let order = 0
  const endIndex = tableField.lastIndexOf('-')
  if (endIndex !== -1) {
    const startIndex = tableField.lastIndexOf('_')
    level = Number(tableField.slice(startIndex + 1, endIndex))
    order = Number(tableField.slice(endIndex + 1, tableField.length))
  }
  return { level, order }
}

/**
 * 创建 Node 即节点即表
 */
const createNode = (nodes, tableFields) => {
  const tables = new Map()
  tableFields.forEach((item) => {
    const table = getTableFieldName(item)
    const tableName = table.tableName
    const tableField = table.tableField

    if (!tables.has(tableName)) {
      tables.set(tableName, [tableField])
    } else {
      const attrs = tables.get(tableName)
      if (!attrs.includes(tableField)) {
        attrs.push(tableField)
        tables.set(tableName, attrs)
      }
    }
  })

  tables.forEach((value, key, map) => {
    const attrs = []
    value.forEach((attr) => {
      attrs.push({
        nodeId: key,
        key: attr,
        type: ''
      })
    })

    const { level, order } = getTableLevelAndOrder(key)
    const height = itemHeight * (attrs.length + 1)
    const obj = {
      id: key,
      key: key,
      label: key,
      x: 100,
      y: 100,
      level: level,
      order: order,
      attrs: attrs,
      size: [nodeWidth, height]
    }
    nodes.push(obj)
  })
}

/**
 * 处理表级数据，即当字段级血缘关系为 false 时
 */
export const collapseData = (data) => {
  const nodes = []
  const edgeMap = new Map()
  const tableFields = new Set()

  data.forEach((item) => {
    const targetField = item.targetField
    const tableField = handleTableField(targetField)
    tableFields.add(tableField)

    if (item.refFields) {
      createCollapsedEdge(edgeMap, tableFields, tableField, item.refFields)
    }
  })

  const edges = Array.from(edgeMap.values())
  createCollapsedNode(nodes, tableFields)

  return {
    nodes,
    edges
  }
}

const createCollapsedEdge = (
  edgeMap,
  tableFields,
  tableField,
  refFields
) => {
  const target = getTableFieldName(tableField)
  const targetName = target.tableName
  refFields.forEach((ref) => {
    const tableField = handleTableField(ref)
    tableFields.add(tableField)
    const source = getTableFieldName(tableField)
    const sourceName = source.tableName
    // 不能自连，防止绘制失败
    if (targetName === sourceName) {
      return
    }

    const edge = {}
    edge.source = sourceName
    edge.sourceAnchor = sourceName
    edge.target = targetName
    edge.targetAnchor = targetName
    edge.label = ref.label
    const key = sourceName + '-' + targetName
    edgeMap.set(key, edge)
  })
}

const createCollapsedNode = (nodes, tableFields) => {
  const tables = new Set()
  tableFields.forEach((item) => {
    const table = getTableFieldName(item)
    const tableName = table.tableName
    tables.add(tableName)
  })

  tables.forEach((key, value) => {
    const { level, order } = getTableLevelAndOrder(key)
    const obj = {
      id: key,
      key: key,
      label: key,
      x: 100,
      y: 100,
      level: level,
      order: order,
      attrs: [],
      size: [nodeWidth, itemHeight]
    }
    nodes.push(obj)
  })
}

/**
 * 获取选中 label 的所有左关联边
 * @param edges node 的所有 edges
 * @param model node 的 model
 * @param sourceAnchor 选中的 label
 * @param leftActiveEdges 左关联边集合
 */
export const getLeftRelation = (
  edges,
  model,
  sourceAnchor,
  leftActiveEdges
) => {
  const source = model['id'] // 当前节点
  edges
    .filter((edge) => !leftActiveEdges.includes(edge))
    .forEach((edge) => {
      if (
        edge.getModel()['target'] === source &&
        edge.getModel()['targetAnchor'] === sourceAnchor
      ) {
        leftActiveEdges.push(edge)

        const currentNode = edge.getSource()
        const currentModel = currentNode.getModel()
        const currentEdges = currentNode.getInEdges()
        const currentSourceAnchor = edge.getModel()['sourceAnchor']
        getLeftRelation(
          currentEdges,
          currentModel,
          currentSourceAnchor,
          leftActiveEdges
        )
      }
    })
}

/**
 * 获取选中 label 的所有右关联边
 * @param edges node 的所有 edges
 * @param model node 的 model
 * @param sourceAnchor 选中的 label
 * @param rightActiveEdges 右关联边集合
 */
export const getRightRelation = (
  edges,
  model,
  sourceAnchor,
  rightActiveEdges
) => {
  const source = model['id'] // 当前节点
  edges
    .filter((edge) => !rightActiveEdges.includes(edge))
    .forEach((edge) => {
      if (
        edge.getModel()['source'] === source &&
        edge.getModel()['sourceAnchor'] === sourceAnchor
      ) {
        rightActiveEdges.push(edge)

        const currentNode = edge.getTarget()
        const currentModel = currentNode.getModel()
        const currentEdges = currentNode.getOutEdges()
        const currentTargetAnchor = edge.getModel()['targetAnchor']
        getRightRelation(
          currentEdges,
          currentModel,
          currentTargetAnchor,
          rightActiveEdges
        )
      }
    })
}
