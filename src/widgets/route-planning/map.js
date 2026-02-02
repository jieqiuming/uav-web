import * as mars3d from "mars3d"
import * as routeApi from "@/api/services/route"

export let map // mars3d.Map三维地图对象
let graphicLayer
let waypointLayer

// 需要覆盖config.json中地图属性参数（当前示例框架中自动处理合并）
export const mapOptions = {
  scene: {
    center: { lng: 118.318, lat: 31.367, alt: 465.5, heading: 340.9, pitch: -34 }
  }
}

export const eventTarget = new mars3d.BaseClass() // 事件对象，用于抛出事件到组件中

// 航点模式状态
let waypointMode = false
let currentAltitude = 120
let waypoints = []
let waypointGraphics = []
let routePreviewGraphic = null
let currentRoute = null

// 初始化地图业务，生命周期钩子函数（必须）,框架在地图初始化完成后自动调用该函数
export function onMounted(mapInstance) {
  map = mapInstance // 记录map

  addGraphicLayers()
}

// 释放当前地图业务的生命周期函数
export function onUnmounted() {
  disableWaypointMode()
  clearWaypoints()
  map = null
}

function addGraphicLayers() {
  // 创建矢量数据图层
  graphicLayer = new mars3d.layer.GraphicLayer()
  map.addLayer(graphicLayer)

  // 创建专门的航点图层
  waypointLayer = new mars3d.layer.GraphicLayer()
  map.addLayer(waypointLayer)

  // 添加演示用的禁飞区
  addMockNoFlyZone()
}

// 模拟禁飞区 (无为附近 113.915, 29.780 118.318711,31.36727)
const noFlyZones = [
  {
    center: [118.318711, 31.36727],
    radius: 500, // 半径500米
    maxAlt: 200, // 高度限制200米
    name: "演示禁飞区A"
  }
]

function addMockNoFlyZone() {
  const noFlyLayer = new mars3d.layer.GraphicLayer()
  map.addLayer(noFlyLayer)

  noFlyZones.forEach(zone => {
    const graphic = new mars3d.graphic.CircleEntity({
      position: [zone.center[0], zone.center[1], 0],
      style: {
        radius: zone.radius,
        height: 0,
        diffHeight: zone.maxAlt,
        color: "#ff0000",
        opacity: 0.3,
        outline: true,
        outlineColor: "#ff0000",
        label: {
          text: zone.name,
          font_size: 18,
          color: "#ffffff",
          pixelOffsetY: -10,
          distanceDisplayCondition: true,
          distanceDisplayCondition_far: 10000,
          distanceDisplayCondition_near: 0
        }
      }
    })
    noFlyLayer.addGraphic(graphic)
  })
}

// 检查航线是否侵入禁飞区
export function checkNoFlyZone(waypointList) {
  if (waypointList.length < 2) {
    return { valid: true, msg: "航线安全" }
  }

  // 1. 检查航点是否在禁飞区内
  for (let i = 0; i < waypointList.length; i++) {
    const wp = waypointList[i]
    for (const zone of noFlyZones) {
      const distance = mars3d.MeasureUtil.getDistance([wp.lng, wp.lat], zone.center)
      if (distance <= zone.radius && wp.alt <= zone.maxAlt) {
        return { valid: false, msg: `警告：航点 ${i + 1} 位于 ${zone.name} 内！` }
      }
    }
  }

  // 2. 简单的线段相交检查 (简化版：仅检查线段中点)
  for (let i = 0; i < waypointList.length - 1; i++) {
    const p1 = waypointList[i]
    const p2 = waypointList[i + 1]

    // 取中点检查
    const midLng = (p1.lng + p2.lng) / 2
    const midLat = (p1.lat + p2.lat) / 2
    // 假设高度为线性插值（最保守取较小值或较大值，这里简化取最大值检查）
    const maxH = Math.max(p1.alt, p2.alt)

    for (const zone of noFlyZones) {
      const distance = mars3d.MeasureUtil.getDistance([midLng, midLat], zone.center)
      if (distance <= zone.radius && maxH <= zone.maxAlt) {
        return { valid: false, msg: `警告：航段 ${i + 1}-${i + 2} 可能穿越 ${zone.name}！` }
      }
    }
  }

  return { valid: true, msg: "航线安全" }
}

// 启用航点编辑模式
export function enableWaypointMode(altitude = 120) {
  waypointMode = true
  currentAltitude = altitude
  map.setCursor("crosshair")

  // 绑定地图点击事件
  map.on(mars3d.EventType.click, onMapClickAddWaypoint)

  console.log("航点编辑模式已启用")
}

// 禁用航点编辑模式
export function disableWaypointMode() {
  waypointMode = false
  map.setCursor("")

  // 解绑地图点击事件
  map.off(mars3d.EventType.click, onMapClickAddWaypoint)

  console.log("航点编辑模式已禁用")
}

// 地图点击添加航点
function onMapClickAddWaypoint(event) {
  if (!waypointMode) {
    return
  }

  const cartesian = event.cartesian
  if (!cartesian) {
    return
  }

  const point = mars3d.LngLatPoint.fromCartesian(cartesian)
  point.alt = currentAltitude // 使用设置的飞行高度

  // 抛出航点添加事件
  eventTarget.fire("waypointAdded", { point })
}

// 更新航点显示
export function updateWaypointDisplay(waypointList) {
  waypoints = waypointList

  // 清除现有航点图形
  waypointLayer.clear()
  waypointGraphics = []

  // 添加新的航点图形
  waypointList.forEach((waypoint, index) => {
    addWaypointGraphic(waypoint, index + 1)
  })

  // 如果有多个航点，显示连接线
  if (waypointList.length >= 2) {
    showRouteConnection(waypointList)
  }
}

// 添加航点图形
async function addWaypointGraphic(waypoint, index) {
  const graphic = new mars3d.graphic.BillboardPrimitive({
    position: [waypoint.lng, waypoint.lat, waypoint.alt],
    style: {
      image: await getWaypointMarkerImg(index),
      horizontalOrigin: mars3d.Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: mars3d.Cesium.VerticalOrigin.BOTTOM,
      scale: 0.8
    },
    hasEdit: true, // 开启编辑功能
    isAutoEditing: false, // 默认不处于编辑状态
    attr: {
      index,
      waypoint
    }
  })

  waypointLayer.addGraphic(graphic)
  waypointGraphics.push(graphic)

  // 绑定编辑事件
  graphic.on(mars3d.EventType.editMovePoint, (event) => {
    // 拖拽移动时触发
    const point = event.point
    waypoint.lng = point.lng
    waypoint.lat = point.lat
    waypoint.alt = point.alt

    // 抛出航点更新事件
    eventTarget.fire("waypointUpdated", { index: index - 1, waypoint })

    // 更新连线
    updateRouteConnection()
  })
}

// 获取航点标记图标
let waypointMark
async function getWaypointMarkerImg(num) {
  if (!waypointMark) {
    waypointMark = await mars3d.Cesium.Resource.fetchImage({ url: "/img/marker/bg/poi-num.png" })
  }

  const canvas = document.createElement("canvas")
  canvas.width = 19
  canvas.height = 25
  const ctx = canvas.getContext("2d")
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(waypointMark, 0, 0) // 绘制图片

  // 绘制文字
  ctx.fillStyle = "#ffffff"
  ctx.font = "12px 楷体"
  ctx.textBaseline = "middle"
  ctx.fillText(num, num < 10 ? 6 : 3, 10)

  return canvas.toDataURL("image/png")
}

// 更新航线连接
function updateRouteConnection() {
  if (waypoints.length < 2) {
    if (routePreviewGraphic) {
      waypointLayer.removeGraphic(routePreviewGraphic)
      routePreviewGraphic = null
    }
    return
  }

  const positions = waypoints.map((wp) => [wp.lng, wp.lat, wp.alt])

  if (routePreviewGraphic) {
    routePreviewGraphic.positions = positions
  } else {
    showRouteConnection(waypoints)
  }
}

// 显示航线连接
function showRouteConnection(waypointList) {
  // 清除现有的航线预览
  if (routePreviewGraphic) {
    waypointLayer.removeGraphic(routePreviewGraphic)
    routePreviewGraphic = null
  }

  if (waypointList.length < 2) {
    return
  }

  const positions = waypointList.map((wp) => [wp.lng, wp.lat, wp.alt])

  routePreviewGraphic = new mars3d.graphic.PolylineEntity({
    positions,
    style: {
      width: 3,
      color: "#1890ff",
      opacity: 0.8,
      clampToGround: false
    }
  })

  waypointLayer.addGraphic(routePreviewGraphic)
}

// 清空航点
export function clearWaypoints() {
  waypoints = []
  waypointLayer.clear()
  waypointGraphics = []
  routePreviewGraphic = null

  // 静默停止仿真（避免在清理过程中触发事件）
  stopSimulationInternal()

  console.log("航点已清空，仿真已停止")
}

// 高亮指定航点
export function highlightWaypoint(index) {
  if (index < 0 || index >= waypointGraphics.length) {
    return
  }

  // 先重置所有航点样式
  waypointGraphics.forEach((graphic, i) => {
    graphic.style.scale = 0.8
    graphic.style.color = "#ffffff"
  })

  // 高亮选中航点
  const selectedGraphic = waypointGraphics[index]
  if (selectedGraphic) {
    selectedGraphic.style.scale = 1.2
    selectedGraphic.style.color = "#ffff00"

    // 飞到选中航点
    const waypoint = waypoints[index]
    if (waypoint) {
      map.flyToPoint([waypoint.lng, waypoint.lat, waypoint.alt], {
        radius: 200,
        duration: 1
      })
    }
  }
}

// 显示航线预览
export function showRoutePreview(waypointList) {
  showRouteConnection(waypointList)

  // 飞到航线范围
  if (waypointList.length >= 2) {
    const positions = waypointList.map((wp) => [wp.lng, wp.lat, wp.alt])
    map.flyToPositions(positions, {
      radius: 1000,
      duration: 2
    })
  }
}

// 开始仿真飞行
export function startSimulation(options) {
  const { waypoints: waypointList, speed, altitude } = options

  if (waypointList.length < 2) {
    console.warn("至少需要2个航点才能进行仿真")
    return
  }

  // 构建航线位置数组
  const positions = waypointList.map((wp) => [wp.lng, wp.lat, wp.alt])

  // 清除现有仿真
  if (currentRoute) {
    graphicLayer.removeGraphic(currentRoute)
    currentRoute = null
  }

  // 创建仿真飞行路线
  currentRoute = new mars3d.graphic.FixedRoute({
    name: "仿真飞行",
    position: {
      type: "time",
      speed,
      startTime: "2025-07-31 09:00:00",
      list: positions
    },
    clockRange: mars3d.Cesium.ClockRange.CLAMPED,
    camera: {
      type: "gs",
      radius: 300
    },
    label: {
      text: "仿真飞机",
      font_size: 24,
      scale: 0.5,
      color: "#ffffff",
      background: true,
      backgroundColor: "rgba(0,0,0,0.5)",
      pixelOffsetY: -25
    },
    model: {
      url: "/model/dajiang.gltf",
      scale: 0.8,
      minimumPixelSize: 80
    },
    path: {
      color: "rgba(255,255,0,0.8)",
      width: 2
    }
  })

  graphicLayer.addGraphic(currentRoute)

  // 绑定仿真完成事件
  currentRoute.on(mars3d.EventType.stop, () => {
    eventTarget.fire("simulationComplete")
  })

  // 修改控件对应的时间
  map.clock.currentTime = currentRoute.startTime
  if (map.control.timeline) {
    map.control.timeline.zoomTo(currentRoute.startTime, currentRoute.stopTime)
  }

  // 开始仿真
  currentRoute.start()

  console.log("仿真飞行已开始")
}

// 内部停止仿真（不触发事件）
function stopSimulationInternal() {
  if (currentRoute) {
    currentRoute.stop()
    graphicLayer.removeGraphic(currentRoute)
    currentRoute = null
    console.log("仿真飞行已停止（内部）")
  }
}

// 停止仿真
export function stopSimulation() {
  stopSimulationInternal()

  // 触发状态更新事件
  setTimeout(() => {
    eventTarget.fire("simulationStatusChanged", {
      status: 'stopped',
      isPause: false,
      isStart: false
    })
  }, 100)
}

// 静默停止仿真（用于重置，不触发事件）
export function stopSimulationSilent() {
  stopSimulationInternal()
}

// 暂停仿真
export function pauseSimulation() {
  if (currentRoute && currentRoute.isStart) {
    currentRoute.pause()
    console.log("仿真飞行已暂停")

    // 延迟触发状态更新事件
    setTimeout(() => {
      eventTarget.fire("simulationStatusChanged", {
        status: 'paused',
        isPause: currentRoute.isPause,
        isStart: currentRoute.isStart
      })
    }, 100)
  }
}

// 恢复仿真
export function resumeSimulation() {
  if (currentRoute && currentRoute.isPause) {
    currentRoute.proceed()
    console.log("仿真飞行已恢复")

    // 延迟触发状态更新事件
    setTimeout(() => {
      eventTarget.fire("simulationStatusChanged", {
        status: 'running',
        isPause: currentRoute.isPause,
        isStart: currentRoute.isStart
      })
    }, 100)
  }
}

// 获取仿真状态
export function getSimulationStatus() {
  if (!currentRoute) {
    return 'stopped'
  }
  if (currentRoute.isPause) {
    return 'paused'
  }
  if (currentRoute.isStart) {
    return 'running'
  }
  return 'stopped'
}


// ... (previous code)

// 保存航线到后端
export async function saveRoute(routeData) {
  try {
    // 适配数据结构：后端不需要完整的 routeData 数组，只需要单个对象
    // 但原逻辑似乎是把整个数组存进去？不，看原逻辑：
    // routes = get(); existingIndex...; push/update; set()
    // 现在的 routeApi.saveRoute 是处理单个 RouteModel 的保存（Insert/Update 由 Mock Controller 处理）

    await routeApi.saveRoute(routeData)
    console.log("航线保存成功:", routeData)
    return true
  } catch (error) {
    console.error("保存航线失败:", error)
    return false
  }
}

// 获取所有已保存的航线
export async function getSavedRoutes() {
  try {
    const list = await routeApi.getRoutes()
    return list || []
  } catch (error) {
    console.error("读取航线失败:", error)
    return []
  }
}

// 删除航线
export async function deleteRoute(routeId) {
  try {
    await routeApi.deleteRoute(routeId)
    console.log("航线删除成功:", routeId)
    return true
  } catch (error) {
    console.error("删除航线失败:", error)
    return false
  }
}

// 导入航线数据
export function importRoute(routeData) {
  // 清空当前航点
  clearWaypoints()

  // 转换航线数据为航点格式
  const waypointList = routeData.waypoints.map((pos, index) => ({
    lng: pos[0],
    lat: pos[1],
    alt: pos[2],
    index: index + 1
  }))

  // 更新航点显示
  updateWaypointDisplay(waypointList)

  // 飞到航线位置
  showRoutePreview(waypointList)

  console.log("航线导入成功:", routeData.name)
}

// 导出当前航点为航线数据
export function exportCurrentRoute(routeInfo) {
  if (waypoints.length < 2) {
    console.warn("至少需要2个航点才能导出航线")
    return null
  }

  return {
    ...routeInfo,
    waypoints: waypoints.map((wp) => [wp.lng, wp.lat, wp.alt]),
    waypointCount: waypoints.length
  }
}
