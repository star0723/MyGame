# 《噬主：魔王胚胎》架构与开发规范

> **平台与阶段（最新）**：本项目现为 **仅手机端 Web（mobile-only，竖屏 portrait）**，当前代码为 **可玩 Demo**。
> 本阶段优先级：**先完成游戏逻辑 + 手机端完整可玩，之后再做素材适配与 UI**。
> 平台 / 输入 / 性能 / 验收的最新规范、现状审计与开发路线图见 **`docs/mobile-dev-plan.md`**（与本文件冲突处以该文件为准）。

## 1. 技术选型定稿

项目采用：

```text
Phaser 3 + TypeScript + Vite
```

这是本项目的正式架构方向，后续开发默认遵循该技术栈。

选择理由：

```text
Phaser 3 适合 2D / 轻 2.5D 像素割草游戏
TypeScript 适合约束实体、配置、事件和系统接口
Vite 适合黑客松快速开发、热更新和静态部署
Phaser Scene 适合拆分标题、战斗、UI 和结算流程
Phaser Tween / Particle / Camera 能快速做老虎机、击杀反馈和觉醒演出
Arcade Physics 可用于轻量碰撞，但核心战斗规则仍由自研系统控制
```

本项目不是 3D 技术 Demo，也不是完整长线 RPG。开发目标是优先做出一个辨识度强、流程完整、可演示的 Web 割草游戏 Demo。

## 2. 产品目标

游戏名称：

```text
噬主：魔王胚胎
```

核心定位：

```text
像素风
轻 2.5D
反英雄地牢割草
血肉老虎机
小怪孵化魔王
```

核心体验链：

```text
玩家控制邪恶核心
小怪围绕核心自动战斗
勇者从四周进攻
杀敌掉落腐血
腐血驱动老虎机成长
玩家花筹码将小怪升格为精英
胚胎值满后触发最终开奖
小兵融合成魔王
魔王带领怪群反杀勇者军团
击败圣骑士 Boss
进入屠杀报告
```

所有开发任务都应服务这条体验链。与这条体验链无关的系统，默认推迟。

## 3. 开发优先级

开发优先级固定为：

```text
可玩闭环 > 项目辨识度 > 爽感反馈 > 稳定性 > 扩展性 > 性能极限
```

黑客松阶段必须避免“系统很完整但游戏不好玩”的情况。

优先做：

```text
玩家移动
敌人生成和追击
小怪自动战斗
腐血掉落、过期和磁吸
老虎机升级
精英小怪升格
魔王最终开奖
魔王觉醒反杀
Boss 与结算
```

暂缓做：

```text
复杂剧情
完整关卡
大量敌人种类
大量魔王组合
局外成长
账号系统
排行榜
复杂物理
复杂装备词条
复杂 Boss AI
复杂地图编辑器
```

## 4. 推荐目录结构

初始工程结构：

```text
myGame/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  public/
    assets/
      sprites/
      audio/
      ui/
  src/
    main.ts
    game/
      constants.ts
      types.ts
      events.ts
      world.ts
      runState.ts
    scenes/
      BootScene.ts
      TitleScene.ts
      GameScene.ts
      UIScene.ts
      ResultScene.ts
    systems/
      inputSystem.ts
      waveSystem.ts
      enemySystem.ts
      minionSystem.ts
      combatSystem.ts
      pickupSystem.ts
      slotSystem.ts
      evolutionSystem.ts
      bossSystem.ts
      fxSystem.ts
    data/
      enemies.ts
      minions.ts
      upgrades.ts
      eliteMinions.ts
      slotSymbols.ts
      demonForms.ts
      dialogue.ts
    ui/
      hudView.ts
      slotView.ts
      eliteUpgradeView.ts
      awakeningView.ts
      resultView.ts
    utils/
      math.ts
      pools.ts
      random.ts
      debug.ts
  docs/
    gameplay.md
    architecture-dev-guide.md
```

黑客松前期可以少建文件，但最终逻辑应逐步收敛到上面的边界。

不要创建过深目录，也不要为只有一处使用的逻辑提前抽象复杂框架。

## 5. Scene 架构

Phaser Scene 固定为：

```text
BootScene
TitleScene
GameScene
UIScene
ResultScene
```

### 5.1 BootScene

职责：

```text
加载资源
初始化全局配置
注册基础动画
进入 TitleScene
```

BootScene 不写玩法逻辑。

### 5.2 TitleScene

职责：

```text
显示标题
显示开始入口
播放少量氛围动画
点击开始后启动 GameScene 和 UIScene
```

TitleScene 不创建战斗实体。

### 5.3 GameScene

职责：

```text
持有 World
运行所有战斗系统
生成敌人、小怪、腐血和 Boss
处理碰撞、伤害、死亡和成长
发出事件给 UIScene 和音效/特效
控制战斗阶段
```

GameScene 是唯一拥有战斗真相的 Scene。

### 5.4 UIScene

职责：

```text
显示 HUD
显示普通老虎机
显示精英升格老虎机
显示魔王觉醒演出覆盖层
显示 Boss 血条
处理升级选择
将 UI 选择结果通过事件发回 GameScene
```

UIScene 不直接修改实体数组。它只能通过事件或明确的方法请求 GameScene 应用选择。

### 5.5 ResultScene

职责：

```text
显示屠杀报告
显示击杀、腐血、魔王形态、评级等结果
提供重新开始入口
```

ResultScene 不继续运行战斗模拟。

## 6. Run Phase 状态机

不要把每个游戏阶段都拆成 Phaser Scene。战斗内阶段使用 `RunPhase` 管理。

推荐类型：

```ts
export type RunPhase =
  | 'playing'
  | 'slot_roll'
  | 'elite_upgrade'
  | 'awakening'
  | 'demon_rampage'
  | 'boss'
  | 'result';
```

阶段职责：

| 阶段 | 作用 |
|---|---|
| `playing` | 常规战斗 |
| `slot_roll` | 普通老虎机升级，战斗暂停或慢动作 |
| `elite_upgrade` | 花费筹码升格指定小怪为精英怪 |
| `awakening` | 魔王最终开奖和觉醒演出 |
| `demon_rampage` | 魔王反杀阶段 |
| `boss` | 圣骑士 Boss 战 |
| `result` | 准备进入结算 |

状态切换必须集中处理，不允许在多个系统里随意改阶段。

推荐入口：

```ts
setRunPhase(world, nextPhase, reason);
```

## 7. World 数据模型

`World` 是 GameScene 的运行时状态容器。

推荐结构：

```ts
export interface World {
  phase: RunPhase;
  time: number;
  elapsed: number;
  rngSeed: number;

  player: PlayerCore;
  minions: Minion[];
  enemies: Enemy[];
  projectiles: Projectile[];
  pickups: Pickup[];
  floatingTexts: FloatingText[];
  effects: GameEffect[];

  stats: RunStats;
  economy: RunEconomy;
  modifiers: RunModifiers;
  demon: DemonState;
}
```

关键规则：

```text
World 只保存游戏运行真相
Phaser Sprite 是表现对象，不应成为规则真相
UI 不直接改 World
系统函数接收 world 和 delta
跨系统通信优先使用事件和明确的命令函数
```

实体可以先用普通对象数组实现。只有性能不足时，再迁移到对象池或 TypedArray。

## 8. 实体边界

### 8.1 PlayerCore

玩家控制邪恶核心。

负责：

```text
移动
承受伤害
吸收腐血
触发经验升级
推动胚胎值增长
触发魔王觉醒
```

### 8.2 Minion

小怪是玩家前中期主要战斗力。

负责：

```text
围绕核心
寻找目标
自动攻击
击杀贡献
精英升格
魔王觉醒时被融合
```

### 8.3 EliteMinion

精英小怪不是新实体类型，而是 `Minion` 的状态或等级。

推荐字段：

```ts
elite?: {
  id: string;
  title: string;
  traits: string[];
  reviveTimer?: number;
};
```

规则：

```text
精英小怪由腐血筹码升格而来
精英小怪用于中期过渡
精英小怪可影响最终魔王形态权重
精英小怪死亡后可延迟重生，避免玩家投资瞬间归零
```

### 8.4 Enemy

敌人代表勇者军团。

首版敌人：

```text
militia
archer
paladinBoss
```

Boss 作为 `Enemy` 的一种处理，不单独开一套完全不同的实体系统。

### 8.5 Pickup

腐血是 Pickup 的核心形态。

规则：

```text
敌人死亡掉落
短时间后腐烂消失
进入拾取范围后磁吸
吸收后增加经验、筹码和胚胎值
```

## 9. 系统更新顺序

GameScene 每帧更新顺序必须固定。

推荐顺序：

```text
1. 读取输入快照
2. 更新玩家移动
3. 更新波次和敌人生成
4. 更新小怪轨道、目标选择和攻击意图
5. 更新敌人移动、攻击和 Boss 技能
6. 更新投射物、AOE 和临时攻击体
7. 统一处理碰撞和伤害
8. 统一处理死亡、掉落和击杀事件
9. 更新腐血磁吸、过期和拾取
10. 更新经验、筹码、胚胎值和升级触发
11. 根据阶段处理老虎机、精英升格和觉醒
12. 更新特效、伤害数字和摄像机反馈
13. 同步 Phaser 表现对象
14. 更新 depth 排序
15. 发事件给 UI
```

禁止：

```text
命中时到处直接 destroy 敌人
多个系统同时修改同一个实体生命状态
UI 直接改实体数组
在渲染同步阶段计算伤害
在 tween 回调里写关键战斗规则
```

死亡应走统一流程：

```text
mark dead -> deathSystem 处理 -> 掉落腐血 -> 发事件 -> 回收到对象池
```

## 10. 轻 2.5D 渲染规则

逻辑层只使用：

```text
x
y
radius
velocity
```

表现层使用：

```text
脚底锚点
y 排序
椭圆阴影
像素斜俯视角色
屏幕震动
短促闪白
腐血粒子
老虎机覆盖层
```

Phaser Sprite 规则：

```ts
sprite.setOrigin(0.5, 1);
sprite.setDepth(sprite.y);
```

阴影规则：

```text
阴影绘制在脚底
阴影 depth 略低于实体
阴影不参与碰撞
```

像素风规则：

```text
关闭 antialias
保持 pixelArt: true
使用高对比轮廓
玩家方偏黑红紫
勇者方偏白金蓝
腐血偏深红
老虎机使用血肉、骨牌、筹码、符号语言
```

## 11. 碰撞与物理策略

> **移动端说明**：以下敌人数量目标（150 / 300 / 600）是早期桌面设想。**移动端以 `docs/mobile-dev-plan.md` §3.5 的预算为准**（同屏敌人软上限约 80–120，中端 60fps / 低端 ≥30fps）。

Phaser Arcade Physics 可用于快速开发，但不要把所有规则绑定到 Arcade 回调中。

推荐策略：

```text
移动和简单碰撞可用 Arcade Physics
伤害、击退、掉落和升级由系统统一处理
小怪攻击和腐血磁吸优先用距离检测
Boss 技能使用圆形、扇形、矩形等自定义判定
```

首版目标：

```text
150 个敌人稳定
300 个敌人作为优化目标
600 个敌人不作为 v0.1 必达目标
```

如果性能不足，优化顺序：

```text
减少每帧全量扫描
增加对象池
减少 active Sprite 数量
降低粒子数量
合并伤害数字
再考虑 spatial grid
最后再考虑 TypedArray
```

## 12. 资源与数据规范

内容配置必须数据化。

数据文件：

```text
data/enemies.ts
data/minions.ts
data/upgrades.ts
data/eliteMinions.ts
data/demonForms.ts
data/dialogue.ts
```

禁止把大量平衡数值散落在系统代码中。

推荐配置形态：

```ts
export const ENEMY_CONFIGS = {
  militia: {
    hp: 18,
    speed: 58,
    damage: 4,
    radius: 12,
    bloodDrop: 1,
  },
} as const;
```

数值命名规则：

```text
hp / maxHp
speed
damage
radius
cooldown
duration
range
value
weight
```

## 13. 老虎机制与精英升格规范

老虎机分三类：

```text
普通升级老虎机
精英升格老虎机
魔王最终开奖老虎机
```

### 13.1 普通升级老虎机

用途：

```text
经验满后触发
随机生成 3 个候选奖励
玩家选 1 个
奖励影响战斗节奏
```

普通老虎机可以偏随机，但必须让每个选项可理解、可感知。

### 13.2 精英升格老虎机

用途：

```text
中期过渡
消耗腐血筹码
定向选择小怪类型
将指定小怪升格为精英
可附带随机词条
```

规则：

```text
精英升格由玩家主动触发
精英升格必须消耗筹码
首版至少支持骷髅和蝙蝠
精英升格不应替代魔王觉醒
精英小怪应提高最终融合的叙事和权重
```

### 13.3 魔王最终开奖

用途：

```text
胚胎值满后触发
播放强演出
决定魔王形态
进入反杀阶段
```

首版不做完整组合爆炸，先做 3 个预制结果。

## 14. UI 规范

UI 分三层：

```text
HUD
Overlay
Result
```

HUD 显示：

```text
生命条
腐血经验条
胚胎值
腐血筹码
小怪数量
精英小怪数量
击杀数
当前阶段
Boss 血条
```

Overlay 显示：

```text
普通老虎机
精英升格老虎机
魔王最终开奖
暂停菜单
```

Result 显示：

```text
击杀勇者数
吞噬腐血量
消耗腐血筹码
升格精英小怪数量
孵化魔王形态
最大连杀
献祭小怪数量
圣骑士是否被击败
最终评级
```

UI 交互规则：

```text
按钮必须有 hover / pressed / disabled 状态
老虎机选择必须有明确确认反馈
关键 UI 不遮挡玩家和 Boss 判定
暂停状态下战斗系统不继续推进
升级选择期间不允许重复点击导致多次应用奖励
```

## 15. 音效与反馈规范

爽感反馈优先级：

```text
命中闪白
击杀爆血
腐血磁吸
老虎机滚动音
老虎机停轮音
精英升格音效
魔王觉醒冲击
Boss 登场提示
结算评级音效
```

摄像机反馈规则：

```text
普通命中不震屏或极轻震屏
击杀可短震
精英升格可中等震屏
魔王觉醒可强震但时间短
Boss 技能震屏必须可读，不遮蔽危险区域
```

所有强反馈都要短促，不能破坏战斗可读性。

## 16. 代码风格规范

语言：

```text
TypeScript
```

命名：

```text
文件名：camelCase.ts，Scene 文件用 PascalCase.ts
类型/接口：PascalCase
变量/函数：camelCase
常量：UPPER_SNAKE_CASE 或配置对象 PascalCase
事件名：kebab-case 字符串或集中常量
```

代码规则：

```text
开启 strict TypeScript
禁止 any，确实需要时必须局部说明
系统函数保持小而明确
每个系统只负责一个领域
不要在 UI View 中写战斗结算逻辑
不要在数据配置中写复杂副作用
不要在 update 热路径里频繁创建临时对象
不要在多处散落 magic number
```

注释规则：

```text
只在复杂规则或非显然取舍处写注释
不要写“给变量赋值”这种无效注释
玩法规则优先写在 docs，再映射到代码
```

## 17. Git 与变更规范

每个任务应尽量围绕一个可验证目标。

推荐提交粒度：

```text
feat: add player movement and camera follow
feat: add minion orbit and auto attack
feat: add blood pickup magnet
feat: add slot upgrade flow
feat: add elite minion upgrade flow
feat: add demon awakening flow
fix: prevent duplicate upgrade apply
fix: cleanup timers on scene restart
```

不要把大范围格式化、重构和玩法改动混在一个提交里。

## 18. 本地开发流程

推荐命令：

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

开发节奏：

```text
1. 先跑通一个可玩的垂直切片
2. 每新增一个系统都要能在 1 分钟内验证
3. 任何 UI 弹窗都必须验证关闭和重复打开
4. 每次 Scene 重启都检查实体、事件、timer 是否清理
5. build 失败时不得继续堆功能
```

黑客松阶段建议每 2-3 小时做一次可运行版本备份。

## 19. 验收标准

MVP 必须满足：

```text
标题界面可进入游戏
邪恶核心可移动
小怪围绕核心并自动攻击
勇者从四周刷出
勇者死亡掉腐血
腐血会过期并可磁吸
经验满触发普通老虎机
至少 6 个普通升级奖励
可花费腐血筹码升格至少 1 个精英小怪
胚胎值满触发魔王最终开奖
至少 3 个魔王形态结果
魔王觉醒后战斗强度明显提高
圣骑士 Boss 登场
击败 Boss 后进入屠杀报告
可以重新开始
```

技术验收：

```text
npm run typecheck 通过
npm run build 通过
无控制台红色错误
重新开始 3 次不会明显卡顿或重复叠加事件
升级选择不会重复应用
老虎机期间战斗阶段正确暂停或慢动作
```

## 20. AI / 协作者项目提示词

后续让 AI 或协作者继续开发时，必须遵循以下项目提示词。

```text
你正在开发《噬主：魔王胚胎》。

技术栈固定为 Phaser 3 + TypeScript + Vite。

平台目标：仅手机端 Web（移动优先），不做桌面端，键盘仅作开发期调试。当前为可玩 Demo 阶段。
本阶段优先级：先完成游戏逻辑 + 手机端完整可玩，再做素材适配与 UI。
详见 docs/mobile-dev-plan.md（与本规范冲突处以该文件为准）。

这是一款像素风、轻 2.5D、反英雄地牢割草游戏。玩家控制邪恶核心，依靠小怪军团抵御勇者，收集腐血筹码，通过血肉老虎机成长，中期可以花费筹码将指定小怪升格为精英怪，最终通过魔王胚胎开奖让小怪融合成魔王，并带领怪群反杀勇者军团。

开发时必须优先保证完整可玩闭环：
标题 -> 战斗 -> 腐血 -> 普通老虎机 -> 精英升格 -> 魔王觉醒 -> Boss -> 屠杀报告 -> 重新开始。

架构规则：
1. Phaser Scene 只使用 BootScene、TitleScene、GameScene、UIScene、ResultScene 这几个主 Scene。
2. GameScene 持有 World，是唯一战斗真相来源。
3. UIScene 只负责 HUD、老虎机、精英升格、觉醒覆盖层和 Boss 血条，不直接修改实体数组。
4. 战斗内阶段使用 RunPhase，不要把每个阶段都拆成新 Scene。
5. 普通升级老虎机、精英升格老虎机、魔王最终开奖老虎机必须是三个清晰区分的流程。
6. 精英小怪是中期过渡，不是最终魔王，不能抢魔王觉醒的高光。
7. Boss 作为 Enemy 的一种处理，不要过早拆成复杂独立架构。
8. 轻 2.5D 表现使用脚底锚点、y-depth 排序、椭圆阴影和像素角色。
9. 伤害、死亡、掉落、拾取、升级必须由系统统一处理，不能散落在 UI 或 tween 回调中。
10. 所有新增系统必须支持重新开始时清理。

开发优先级：
可玩闭环 > 项目辨识度 > 爽感反馈 > 稳定性 > 扩展性 > 性能极限。

不要优先开发：
复杂剧情、局外成长、账号、排行榜、复杂装备、完整地图编辑器、大量敌人、大量魔王组合、复杂 Boss AI。

每次改动后至少运行：
npm run typecheck
npm run build

如果功能涉及 UI、Scene 切换、老虎机、重开或 Boss，必须手动验证一遍完整流程。
```

## 21. 开发指令清单

项目内所有开发任务默认遵循：

```text
先读 docs/mobile-dev-plan.md、docs/gameplay.md 和 docs/architecture-dev-guide.md
平台只做手机端；战斗输入以触控为主，键盘仅作桌面调试
不改变技术栈，除非明确要求
不引入大型外部状态管理库
不让 React/Vue 参与游戏主循环
不把关键战斗规则写进 UI 层
不把一次性演出写成不可重入流程
不在 update 热路径里无节制创建对象
不在多个系统中重复处理同一死亡事件
不在老虎机选择期间允许重复点击多次应用奖励
不在 Scene restart 后遗留 timer、event listener、tween 或 particle emitter
```

如果任务存在架构分歧，按以下原则决策：

```text
黑客松 Demo 优先可玩和可演示
战斗真相优先放在 World 和 systems
UI 只发事件，不直接改规则
能用数据表解决的，不硬编码到系统里
能用 Phaser 内置能力快速完成的，不自建大框架
性能优化以实际卡顿为依据，不提前做复杂底层重写
```

## 22. 参考资料

开发时优先参考官方文档：

```text
Phaser Scenes: https://docs.phaser.io/phaser/concepts/scenes
Phaser Arcade Physics: https://docs.phaser.io/phaser/concepts/physics/arcade
Phaser TypeScript + Vite 模板: https://github.com/phaserjs/template-vite-ts
Vite Guide: https://vite.dev/guide/
```
