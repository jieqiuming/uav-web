# 用户体验诊断与优化方案（飞行管理平台）

本文基于当前前端原型源码与《无人机飞行管理平台流程梳理.md》进行诊断，目标是解决“用户不知道怎么操作、流程不清晰”的问题，并给出可落地的优化方案与实施节奏。

## 结论
当前原型功能覆盖较全，但入口分散、流程断点多、数据链路不一致，导致用户无法形成“从创建任务到生成报告”的完整心智模型。

## 关键问题诊断

1. 入口分散、导航重复
- 顶部导航：`src/components/system-menu/top-bar.vue`
- 工具导航：`src/widgets/basic/toolbar/index.vue`
业务功能被拆在两套入口里，用户难以判断主流程入口。

2. 核心流程模块未暴露在主导航
工单、任务、人员等核心流程模块只在工具栏里，顶部菜单仅提供“设备清单/航线规划/业务管理”，与流程梳理文档不一致。

3. 流程缺少显性引导
`route-planning` 有 step 状态但无“流程导航/下一步”引导；保存航线只提示消息，不形成可操作链路。
参考：`src/widgets/route-planning/index.vue`

4. 数据链路割裂，流程断层
- `route-planning` 保存方式与 `airspace-computation` 读取方式不统一
- `flight-demo` 写本地报告，但 `flight-report` 使用静态 mock 数据
参考：
- `src/widgets/airspace-computation/index.vue`
- `src/widgets/flight-demo/index.vue`
- `src/widgets/flight-report/index.vue`

5. 缺乏“状态约束”与流程闭环
任务可直接执行，不依赖空域审批结果；空域申请与任务未强绑定。用户无法理解“为什么要先申请空域”。
参考：
- `src/widgets/task-management/index.vue`
- `src/widgets/airspace-application/index.vue`

6. UI 窗口堆叠、上下文丢失
大量 `mars-dialog` 弹窗位置分散，缺少“主工作区 + 侧栏面板”的统一布局，用户易迷失当前步骤。

## 优化方案（按优先级）

### 1. 信息架构重构（优先级最高）
目标：让用户第一眼知道“主流程从哪里开始”。
建议：
- 统一入口，仅保留一套业务导航
- 导航结构改为流程型分组：
  资源准备 → 航线 → 空域 → 任务 → 执行 → 报告
- 工具功能（测量、标绘、分析）单独放“工具”分组

### 2. 主流程可视化与向导化
目标：用户始终知道下一步是什么。
建议：
- 增加流程进度条/步骤引导
- 步骤建议：
  资源准备 → 航线规划 → 空域计算 → 工单/任务 → 空域申请 → 执行监控 → 报告
- 每一步提供“下一步”按钮，直接打开对应模块

### 3. 打通数据链路（原型阶段可用统一 LocalStorage / store）
目标：用户操作链路形成闭环。
建议：
- 航线保存后立刻可用于空域计算与任务创建
- 空域计算通过后标记航线为“可用”
- 任务创建自动触发空域申请
- 执行完成后，报告模块可直接查看生成的报告

### 4. 建立“状态约束”与可解释性
目标：让用户理解前置步骤必要性。
建议：
- 任务执行按钮：若未通过空域审批则禁用，并显示原因
- 空域申请与任务强绑定，申请表自动填充任务信息
- 航线列表标记“待审批/可用/冲突”

### 5. 交互细节优化
目标：减少误操作和认知负担。
建议：
- 空状态引导 + CTA（例如“暂无航线 → 去创建航线”）
- 统一弹窗布局策略（例如固定右侧抽屉或主面板）
- 缩小顶部大标题，释放地图空间

## 建议落地节奏

### Phase 1（1-2 周）
- 导航结构调整
- 主流程向导/进度条
- 报告模块读取 `uav_flight_reports`
- 航线保存后可直接引导到空域计算

### Phase 2（2-4 周）
- 任务与空域申请绑定
- 任务执行与空域审批状态约束
- 航线状态标识（待审批/可用/冲突）

### Phase 3（后续）
- 真实数据联动
- 权限与角色视图
- 大屏与标准模式的流程联动

## 参考文件
- `src/components/system-menu/top-bar.vue`
- `src/widgets/basic/toolbar/index.vue`
- `src/widgets/route-planning/index.vue`
- `src/widgets/route-management/index.vue`
- `src/widgets/airspace-application/index.vue`
- `src/widgets/airspace-computation/index.vue`
- `src/widgets/task-management/index.vue`
- `src/widgets/flight-demo/index.vue`
- `src/widgets/flight-report/index.vue`

