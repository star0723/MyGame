# 移动端开发计划与现状（Mobile-Only Dev Plan）

> **本文件是当前阶段的权威开发规范。** 与 `docs/architecture-dev-guide.md` 冲突的条目（平台 / 输入 / 性能 / 验收）以本文件为准。
>
> 配套：`docs/gameplay.md`（玩法）、`docs/architecture-dev-guide.md`（架构总纲）、`docs/asset-integration-guide.md`（素材接入，属 Phase 2）。

---

## 1. 平台与当前状态（已更新）

| 项 | 结论 |
|---|---|
| **平台** | **仅手机端 Web**（移动浏览器：iOS Safari / Android Chrome）。**不做桌面端**；键盘仅保留为开发期调试便利。 |
| **朝向** | **竖屏（portrait）优先，不做横屏**。逻辑分辨率改为竖屏（推荐 **720×1280 / 9:16**，见 §3.3）。 |
| **当前版本** | **可玩 Demo（垂直切片）**。完整闭环已跑通，但多处为脚手架 / 占位，且**手机上不可操作**（仅键盘输入）。 |
| **本阶段优先级（铁律）** | 1) 完成游戏逻辑 → 2) 手机端完整可玩 → 3) 之后才做素材适配 / UI 美术 / 演出。 |

一句话：**先让它在手机上「逻辑完整且好玩」，再让它「好看」。** 素材/UI 相关需求在 Phase 1 达标前一律推迟。

---

## 2. Demo 现状审计（基于当前代码）

状态：✅ 可用　🟡 能跑但简化/有缺口　🟥 脚手架，未接线。

### 2.1 核心循环（基本成型）

| 模块 | 状态 | 说明（源） |
|---|---|---|
| 玩家移动 | ✅ | 边界 clamp。`movementSystem.ts` |
| 刷怪 | ✅ | 四边外缘生成，压力随时长上升。`waveSystem.ts` |
| 小怪环绕 + 自动攻击 | ✅ | 索敌、靠近、攻击、击退。`minionSystem.ts` |
| 腐血掉落 | ✅ | 磁吸 / 过期 / 拾取 → 经验·筹码·胚胎值。`pickupSystem.ts` |
| 普通老虎机 | ✅ | 9 选 3 卡片（含哥布林征召）。`slotSystem.ts` `upgrades.ts` |
| 精英升格 | ✅ | 消耗筹码，骷髅/蝙蝠各一种，**上限 2 次**。`eliteMinions.ts` |
| 魔王觉醒 | ✅ | 胚胎满 → 开奖 → 随机 3 形态之一 → 暴走。`evolutionSystem.ts` |
| Boss | ✅ | 暴走 28s 后单次生成，血量随精英数缩放，含脉冲技能。`bossSystem.ts` |
| 结算 / 重开 | ✅ | 点击重开（触控友好）。`resultView.ts` |

> 菜单类 UI（标题、老虎机、升格、结算）都用 Phaser 指针事件，**点按在手机上已可用**。问题集中在「战斗内操作」。

### 2.2 关键缺口（Phase 1 要补的）

| 缺口 | 状态 | 影响 | 源 |
|---|---|---|---|
| **触控输入完全缺失** | 🟥 | 手机**无法移动 / 放技能**；`InputSystem` 无键盘时**构造抛错** | `inputSystem.ts` |
| 小怪不可受伤、永不死亡 | 🟡 | 敌人只伤害玩家；随从层无损耗与取舍；`hurt`/`death` 动画正常游玩中不触发 | `enemySystem.ts` |
| 浮动伤害数字 | 🟥 | `floatingTexts` 有数据与衰减，但**无处写入、不渲染** → 看不到伤害数字 | `fxSystem.ts` `GameScene.ts` |
| 暂停 | 🟥 | `pausePressed` 读取但**未消费**；无暂停菜单（手机切后台必需） | `inputSystem.ts` |
| 「老虎机」无转轮演出 | 🟥 | `SLOT_SYMBOLS` 未使用，实为三选一卡片 | `slotSymbols.ts` |
| 对白 / 播报 | 🟥 | `HERO_LINES`/`SYSTEM_LINES`、`showToast`、`runEnded` 均**定义未接线** | `dialogue.ts` `events.ts` |
| 对象池 | 🟥 | `pools.removeInactive` 未使用；每帧 `filter` 重建数组（GC 压力） | `pools.ts` `GameScene.ts` |
| 玩家死亡反馈 | 🟡 | 死亡即切结算，无演出 | `GameScene.ts` |
| 内容量 | 🟡 | Boss 1 种、魔王形态 3 种、敌人 2 种（Demo 体量，属 Phase 2 扩充） | `data/*` |

---

## 3. 移动端技术规范（Phase 1 必做）

### 3.1 触控输入（替换 / 扩展 `inputSystem.ts`）

- **坐标无需手算**：游戏固定逻辑分辨率 + `Scale.FIT`（**竖屏，推荐 720×1280**，见 §3.3 与 `main.ts`），Phaser 指针坐标已在该空间内，触控控件按该竖屏坐标摆放即可。
- **竖屏更适合拇指**：摇杆置于屏幕**左下**、技能按钮**右下**、暂停**右上**，单手/双手拇指都能自然够到底部两角。
- **左手虚拟摇杆**：屏幕左下固定区域，按下浮现、拖动产生 `moveX/moveY`（死区 + 归一化 + 半径夹紧）。
- **右手技能按钮**：血肉震荡（原 Q）→ 右下圆形按钮，带冷却灰显 / 扇形读条；为后续技能预留按钮位。
- **暂停按钮**：右上角；与切后台联动（§3.4）。
- **多点触控**：摇杆与按钮需分指同时生效 → Phaser 配置 `input: { activePointers: 3 }` 或 `addPointer(2)`。
- **`InputSystem` 改造**：触控为主、键盘可选（存在则叠加，便于桌面调试）；**构造不得在无键盘时抛错**。对外仍返回同样的 `InputSnapshot`（`moveX/moveY/shockwavePressed/pausePressed`），**下游系统零改动**——只换“输入来源”。
- **触控目标尺寸** ≥ 48×48 CSS px（按 FIT 缩放比换算到 720×1280 竖屏空间给足余量）。

### 3.2 视口与页面（`index.html` / `styles.css`）

当前 `index.html` 仅 `width=device-width, initial-scale=1.0`；`styles.css` 仅做了满屏 + `overflow:hidden`。需补：

- **viewport meta**：`maximum-scale=1, user-scalable=no, viewport-fit=cover`（禁双击/捏合缩放，支持安全区）。
- **CSS**：`touch-action: none`（防手势抢输入）、`overscroll-behavior: none`（防下拉刷新）、`user-select: none`、`-webkit-tap-highlight-color: transparent`；`body { position: fixed; inset: 0 }` 防 iOS 地址栏伸缩导致跳动；`#game` 黑底（FIT 黑边）。
- **安全区**：HUD 与触控按钮用 `env(safe-area-inset-*)` 留白，避开刘海 / 手势条。

### 3.3 朝向（竖屏 / portrait）

- **竖屏游玩，不做横屏**：逻辑分辨率改为竖屏，推荐 **720×1280（9:16）**，`Scale.FIT + CENTER_BOTH`（更窄长的屏会上下留少量黑边，可接受）。
- **代码改动**：`main.ts` 的 `width/height` 由 `1280×720` → `720×1280`。游戏世界（`WORLD_BOUNDS` 2600×1800）与「摄像机跟随玩家」**不受影响**——竖屏只是把取景窗口变窄变高，玩法逻辑无需改。
- **UI 重排（重点）**：战斗内 UI 目前用 1280×720 硬编码坐标，竖屏会错位，需重排（见 §4 P1-B 与 §6）：
  - `slotView.ts` / `eliteUpgradeView.ts` / `awakeningView.ts` 容器锚点 `640,360` → 新中心 `360,640`；`awakeningView` 的硬编码 `1280×720` 遮罩改为按 `scene.scale` 尺寸。
  - `hudView.ts` 的 Boss 文本 `x=640` → 新宽度中线 `360`；HUD 面板叠加安全区留白。
  - `TitleScene` / `resultView` 已用 `scene.scale` 自适应，基本无需改。
- **取景**：竖屏横向视野更小，必要时微调 `cameras.main.setZoom`，保证左右两侧威胁可读。
- 横屏时可选显示「请竖屏」提示（CSS `@media (orientation: landscape)`）或 `screen.orientation.lock('portrait')`（须全屏 + 能力检测降级），不强制。

### 3.4 生命周期与音频

- **音频解锁**：移动端需用户手势触发；标题「点击开始」即可解锁，Phaser 无音频时自动降级。
- **切后台暂停**：监听 `visibilitychange` / `blur`，暂停战斗与计时；恢复不补帧（`dt` 已 clamp 到 0.05）。
- **WebGL 上下文丢失**：移动端常见，验证 Phaser 纹理自动恢复。

### 3.5 性能预算（移动优先，**覆盖** architecture §11 的桌面目标）

- **帧率目标**：中端安卓 / 近年 iPhone 稳定 60fps；低端可接受 30fps，不卡死。
- **实体预算**：同屏敌人软上限 **~80–120**（**不是** 桌面的 300/600）；spawn 压力按设备分档。
- **每帧扫描**：`findNearestEnemy` 等为 O(小怪×敌人)，数百实体时偏贵 → 需要时引入空间网格 / 分帧索敌 / 目标缓存。
- **对象池**：用 `pools.removeInactive` 或环形池替代「每帧 filter + 新建」，降低 GC。
- **GC 友好**：热路径避免 `new`（`normalize` 返回新对象、`spawn` 里 `new Vector2`、每帧 `effects.push`）。
- **渲染**：保持 `pixelArt + roundPixels`；控制 Phaser GameObject 数量；低端降级 / 合并粒子特效。
- **包体 / 流量**：源图勿放 `public/`（见 §6）；只发布成品精灵表，减小移动端首屏与流量。

---

## 4. 分阶段路线图

### Phase 1 —— 游戏逻辑补全 + 手机端完整可玩（**当前唯一重点**）

按依赖排序，每条带验收：

```text
P1-A 触控可玩 [最高]
  内容：虚拟摇杆 + 技能按钮 + 暂停按钮；InputSystem 改造（触控为主、键盘可选、不抛错）；activePointers。
  验收：iOS + Android 真机、无键盘，可移动 / 放震荡 / 暂停，完整通关一局。

P1-B 竖屏化 + 视口 / 页面 / 安全区
  内容：main.ts 逻辑分辨率 → 720×1280（竖屏）；重排战斗内 UI（HUD / 老虎机 / 升格 / 觉醒遮罩 / Boss 文本）到竖屏布局；
        viewport meta、CSS touch-action 等、横屏「请竖屏」提示 / 竖屏锁定、安全区留白。
  验收：竖屏满屏可玩、UI 不错位；单指拖动不滚动页面、双击不缩放；刘海 / 手势条不挡 HUD / 按钮。

P1-C 生命周期
  内容：切后台暂停、音频手势解锁、context 丢失恢复。
  验收：来电 / 切后台再回来不崩溃、不暴走、不静音卡死。

P1-D 核心逻辑补完（影响“好玩”）
  内容：小怪可受击/死亡 + 可重新召唤（激活 hurt/death 动画，给随从层取舍）；
        浮动伤害数字接线（push + 渲染）；暂停菜单（继续 / 重开）；
        平衡（刷怪曲线、精英触发交互、玩家死亡反馈）。
  验收：一局 5–8 分钟有节奏、有压力、有正反馈；数值不崩。

P1-E 性能达标
  内容：移动实体预算、必要的索敌优化 / 对象池。
  验收：目标机型战斗中位帧率达标，长局无内存泄漏。
```

**Phase 1 出口标准（Definition of Done）**：真机竖屏、纯触控，完整闭环（标题 → 战斗 → 老虎机 → 升格 → 觉醒 → Boss → 结算 → 重开）稳定可玩；`npm run typecheck` 与 `npm run build` 通过；控制台无红色错误。

### Phase 2 —— 素材适配与 UI（Phase 1 完成后再做）

```text
- 小怪 / 敌人 / 玩家精灵接入（见 asset-integration-guide.md，process_keyed.py 流程）。
- 老虎机转轮 / 符号演出（启用 SLOT_SYMBOLS）。
- 对白播报（HERO_LINES / SYSTEM_LINES + showToast）、觉醒 / Boss 演出强化。
- HUD / 按钮美术、字体、动效、音效；移动端可读性与一致性。
- 内容扩充：更多敌人 / 魔王形态 / 精英词条。
```

> 红线：Phase 2 接素材前，先确认未打回 Phase 1 的触控与性能。

---

## 5. 移动端验收清单（Phase 1）

```text
[ ] 真机（iOS Safari + Android Chrome）**竖屏**纯触控可完整通关一局
[ ] 虚拟摇杆移动顺滑、有死区；技能按钮有冷却反馈；暂停可用
[ ] 单指拖动不触发页面滚动；双击 / 捏合不缩放；无地址栏抖动
[ ] 竖屏满屏可玩、UI 不错位；横屏时显示「请竖屏」提示；安全区不遮挡 HUD / 按钮
[ ] 切后台 → 回前台：不崩、不暴走、音频正常
[ ] 目标机型战斗帧率达标（中端 60 / 低端 ≥30），长局无明显发热掉帧
[ ] 小怪会受伤/死亡并可补充；伤害数字可见；玩家死亡有反馈
[ ] npm run typecheck / npm run build 通过；控制台无红错（favicon 404 可忽略）
```

---

## 6. 对现有文档的修订点

- **平台**：architecture §2「Web 割草 Demo」→ 收敛为「**仅手机端 Web**」。
- **朝向**：**竖屏（portrait）**，不做横屏；`main.ts` 1280×720 → 720×1280，战斗内 UI 需按竖屏重排（见 §3.3）。
- **输入**：`TitleScene` 的「WASD / 方向键 / Q」提示与 gameplay.md 控制说明，正式版改为触控；键盘仅桌面调试。Phase 1 顺手更新提示文案。
- **性能**：本文件 §3.5 **覆盖** architecture §11 的 150/300/600 桌面目标。
- **验收**：在 architecture §19 之上叠加本文件 §5（真机 / 触控 / 竖屏 / 帧率）。
- **素材 / UI**：`asset-integration-guide.md` 属 **Phase 2**，Phase 1 达标前不大规模接入。
