# 小怪精灵图接入指南

> 面向后续接手的 AI / 协作者。目标：把一张和 `Matting_1780112158480.png`（哥布林）同款的角色精灵图，**用最少步骤、零白边**接进《噬主：魔王胚胎》，成为一种带动画的小怪。
>
> 配套阅读：`docs/architecture-dev-guide.md`（架构与渲染规则）、`docs/gameplay.md`（玩法）。
>
> **阶段定位**：本指南属于路线图 **Phase 2（素材 / UI）**。请先完成 **Phase 1（游戏逻辑 + 手机端完整可玩）** 再大规模接入，见 `docs/mobile-dev-plan.md`。

---

## 1. 适用范围

本指南覆盖的素材类型：**同一美术包的 Q 版单角色精灵图**，固定 5 行布局：

```text
第1行 idle    待机
第2行 walk    移动
第3行 attack  攻击
第4行 hurt    受击
第5行 death   死亡
```

- 每行帧数可不同（实测 idle 4 / walk 6 / attack 5~6 / hurt 2 / death 6）。**以脚本自动检测为准**，不要手数。
- 帧之间手工摆放、间距不均、自带烘焙投影（脚下软阴影）——脚本会自动切帧、对齐、重排成统一网格。
- 已接入的同款素材：`skeleton`（骷髅）、`bat`（蝙蝠）、`goblin`（哥布林）。

输入图分两种情况，处理脚本不同（见 §4）：

| 输入背景 | 例子 | 用哪个脚本 | 边缘质量 |
|---|---|---|---|
| **已抠好（透明 PNG）** | `Matting_1780112158480.png` | `process_keyed.py` ✅ 首选 | 最好，无白边 |
| 纯色底（如 `#f8f8f8`） | `pixel_499c_*.png` | `process_goblin.py`（matting） | 好，无白边 |
| Photoshop 棋盘格透明底 | `bf.png` / `kl.png` | `process_sheets.py` | 一般，边缘可能有浅色描边 |

> **结论先行**：让美术 / 你自己先把图抠成透明 PNG，再走 `process_keyed.py`，质量最高且最省事。后两种是兜底。

---

## 2. 一句话流程（TL;DR）

已抠好的透明图，三步接入：

```bash
# 1) 切帧重排（在项目根目录 E:/myGame 运行）
python docs/Source/process_keyed.py public/assets/你的图.png goblin

# 2) 把脚本最后打印的 config 块粘贴进 src/data/minionSprites.ts 的 MINION_SPRITES
#    （新种类还要做 §5.5 的几步）

# 3) 验证
npm run typecheck && npm run build
# 再用浏览器跑一遍看动画/朝向/缩放（见 §6.6）
```

脚本会产出 `<name>.png` + `<name>.json` + 一张**深色背景预览图**，并直接打印可粘贴的 TS 配置。

---

## 3. 输出契约（脚本产物）

`process_*.py` 统一输出到 `public/assets/`：

- **`<name>.png`** —— 重排后的统一网格精灵表，固定 **6 列**，每格一帧，行优先（frame 0 在左上）。
- **`<name>.json`** —— 清单（manifest）。游戏运行时**不直接读它**，它是写 `minionSprites.ts` 配置的“数据来源 / 真相”：

```json
{
  "image": "goblin.png",
  "frameWidth": 207, "frameHeight": 197,
  "columns": 6, "count": 24,
  "anchor": { "x": 0.4541, "y": 0.9695 },
  "anims": {
    "idle":   [0, 3],  "walk": [4, 9], "attack": [10, 15],
    "hurt":   [16, 17], "death": [18, 23]
  }
}
```

- **`public/assets/test/_<name>_on_dark.png`** —— 合成到游戏底色 `#130b18` 上的预览，用来肉眼验收白边（见 §8）。

重排对齐规则（无需改，了解即可）：
- 水平锚点 = 帧“下半身”像素的中位列（避开举起的武器/手臂，保证脚步不漂）。
- 垂直锚点 = 帧底（脚底 / 阴影基线）。
- 网格格子尺寸 = 所有帧相对锚点的最大外扩 + 6px padding。

---

## 4. 处理脚本（`docs/Source/`）

| 脚本 | 输入 | 做什么 |
|---|---|---|
| **`process_keyed.py`** ✅ | 已透明 PNG | 直接用 alpha 切帧重排，**保留原始抗锯齿**。可复用，带命令行参数。 |
| `process_goblin.py` | 纯色底 | 对单一背景色做 alpha matting（按“中性灰+亮度”判定背景、边缘算半透明、去背景色污染、连通域处理被包住的白底口袋）。 |
| `process_sheets.py` | 棋盘格底 | 从边缘 flood-fill 抠棋盘格（保留被深色描边包住的白），二值抠图。用于 `skeleton`/`bat`。 |

`process_keyed.py` 用法（首选）：

```bash
python docs/Source/process_keyed.py <输入透明图.png> <name>
# 例：
python docs/Source/process_keyed.py public/assets/Matting_1780112158480.png goblin
```

脚本内可调常量：`COLUMNS=6`、`ALPHA_FG=40`（判定前景的 alpha 阈值）、`DISPLAY_HEIGHT=84`（默认显示高，输出到 TS 里再按需微调）、`ROW_ANIMS`（5 行 → 动画名 + 帧率 + 循环）。

---

## 5. 接入步骤

### 5.1 准备透明图
优先拿到**已抠好的透明 PNG**。背景必须真透明（alpha=0），不是白底/棋盘格。

### 5.2 切帧重排
跑 `process_keyed.py`（§4）。检查终端输出的 `detected rows -> [...]`：应当是 **5 个数**（对应 5 行）。若不是 5，说明检测异常（帧粘连/漏检），先排查图本身或调阈值，**别硬接**。

### 5.3 验收预览（关键）
打开 `public/assets/test/_<name>_on_dark.png`，在深色底上确认：
- 角色边缘**没有白边/浅灰描边**；
- 每格**恰好一只**角色，没有半只、没有两只粘连；
- 脚下阴影是自然的软投影，不是死白色块；
- 死亡行最后几帧的碎骨/血渣等小元素**没丢**。

### 5.4 写配置
把脚本打印的 config 块粘贴进 `src/data/minionSprites.ts` 的 `MINION_SPRITES`。然后**人工确认两项**：
- `facesRight`：源图角色默认朝向（朝右 `true` / 朝左 `false`）。脚本默认填 `true`，**必须**进游戏看一眼，反了就改。
- `displayHeight`：屏上格子高度（px）。现有：skeleton 82 / bat 76 / goblin 84。和这几个对齐即可，过大就调小。

> 仅此一步就能让该小怪从“占位矩形”变成“带 idle/walk/attack/hurt/death 的动画精灵”——`BootScene` 和 `GameScene` 会自动识别（见 §7）。

### 5.5 如果是“新的小怪种类”（之前没有的 kind）
`skeleton`/`bat`/`goblin`/`slime` 已是合法 `MinionKind`。若要加全新种类，按顺序补：

1. `src/game/types.ts` —— 给 `MinionKind` 联合类型加上新 kind。
2. `src/data/minions.ts` —— 在 `MINION_NAMES` 加中文名。
3. `src/game/world.ts` —— `createMinion()` 里按需给该 kind 设数值（`orbitRadius` / `baseDamage` / `cooldown` / `attackRange` / `speed`）。不写则吃 else 默认值。
4. `src/data/upgrades.ts` —— 加一个 `summon-<kind>` 升级，否则游戏里**永远刷不出来**（哥布林就是这么接进可玩流程的）。
5. （可选）`src/data/eliteMinions.ts` —— 想支持精英升格再加 `sourceKind` 对应项。
6. `src/data/minionSprites.ts` —— 加 §5.4 的精灵配置。

### 5.6 验证
见 §6.6 / §10。

---

## 6. 运行时如何驱动（引擎侧，已写好，无需改）

> 接入只需写数据（§5.4）。下面是引擎已实现的机制，便于排查问题。

### 6.1 加载与动画注册 —— `src/scenes/BootScene.ts`
`preload()` 遍历 `MINION_SPRITE_LIST`，对每个配置 `load.spritesheet(key, url, {frameWidth, frameHeight})`；`create()` 里 `registerMinionAnims()` 按 `anims` 区间用 `generateFrameNumbers` 注册全局动画（key 形如 `goblin-walk`）。**新增一个配置项即自动加载+注册**。

### 6.2 渲染与状态机 —— `src/scenes/GameScene.ts`
- `createMinionVisual()`：`MINION_SPRITES[kind]` 命中就建 `Phaser.Sprite`，`setOrigin(origin.x, origin.y)`、`setScale(displayHeight/frameHeight)`；未命中（如 `slime`）走旧矩形分支（带椭圆阴影）。
- `updateMinionSprite()` 每帧驱动：
  - **death**：`minion.alive===false` → 播一次 `death`（小怪目前基本不死，属防御性）。
  - **attack**：检测 `minion.attackTimer` 的**上升沿**（命中时被重置变大）→ 播一次 `attack`。
  - **walk / idle**：按每帧位移距离（>0.6px 判定移动）切 `walk`/`idle`。
  - **朝向**：按水平位移符号配合 `facesRight` 决定 `flipX`。
  - **精英**：`minion.elite` 时 `setTint(0xffd479)` 描金，否则清除。
  - **深度**：`setDepth(minion.y)` 做 y 排序。

### 6.3 阴影约定
这些精灵**自带烘焙阴影**，所以精灵小怪**不再额外画椭圆阴影**（只有矩形占位小怪才画）。`origin.y≈0.97` 让阴影基线落在小怪的 `(x,y)` 地面点；蝙蝠这类飞行单位的“身体高、阴影低”关系也由原图烘焙好。

---

## 7. 配置字段参考（`MinionSpriteConfig`）

```ts
interface MinionSpriteConfig {
  key: string;          // 纹理 key，等于资源名，如 'goblin'
  url: string;          // 相对 /assets 的文件名，如 'goblin.png'
  frameWidth: number;   // 来自 manifest
  frameHeight: number;  // 来自 manifest
  origin: { x: number; y: number };  // 来自 manifest.anchor（脚底/身体中线锚点）
  displayHeight: number; // 屏上格子高度(px)，缩放=displayHeight/frameHeight
  facesRight: boolean;   // 源图默认朝向；决定 flipX
  anims: Record<'idle'|'walk'|'attack'|'hurt'|'death',
    { frames: [number, number]; frameRate: number; repeat: number }>;
    // frames=[起,止]含两端；repeat: -1 循环，0 播一次
}
```

帧率/循环现行约定：`idle 6/-1`、`walk 12/-1`、`attack 16/0`、`hurt 10/0`、`death 11/0`（蝙蝠飞行类略高）。

---

## 8. 抠图与白边（教训）

- **白边的来源**：原图常合成在浅色底上，边缘是“角色色 + 浅底”的混合像素。直接二值抠图会把这些半亮像素留成前景，在深色场景里就成了白边（`process_sheets.py` 的已知短板）。
- **根治办法**（按优先级）：
  1. **拿到已抠好的透明图** → `process_keyed.py`，保留原生抗锯齿，零白边。**首选**。
  2. 纯色底 → `process_goblin.py` 的 matting：按色判透明度 + 去背景色污染 + 连通域处理“被角色围住的纯白口袋”（曾导致脚边白色块）。
  3. 棋盘格底 → `process_sheets.py`，能用但边缘一般。
- **阴影别抠成白块**：脚下软阴影是中性浅灰，matting 时要把它当“前景的浅灰”保留为灰色投影，而不是当背景算半透明（否则在深色底上发白）。
- **验收唯一标准**：`_<name>_on_dark.png` 深色预览。白边/白块在浅色背景上看不出来，**必须在深色上看**。

---

## 9. 常见坑

- **行检测**：`process_*.py` 用 alpha/前景投影按行带切分，相邻行间距 ≥28px 才算两行；蝙蝠那种“身体 + 离地阴影”有 ≤18px 的缝会被合并为同一帧——别把行合并阈值调太小。
- **帧数以检测为准**：脚本里的“期望帧数”只是提示；某帧因大幅度挥砍/特效与邻帧粘连可能少 1 帧，动画照样能用。两只粘进一格才是真问题（看预览）。
- **朝向必看**：`facesRight` 脚本只能猜，进游戏确认；反了角色会“倒着走”。
- **缩放对齐**：新单位 `displayHeight` 和现有 skeleton/bat/goblin 对齐，避免一只巨大一只迷你。
- **资源位置**：精灵表直接放 `public/assets/` 根（`BootScene` 用 `setPath('/assets')` + 文件名加载）。`assets/sprites|audio|ui/` 子目录目前为空、未使用。
- **Windows 路径**：bash 里 `/tmp`、`/e/...` 与 Python 在 Windows 下的解析不同；脚本统一用相对路径（在项目根 `E:/myGame` 运行）或 `E:/...` 盘符路径，别用 `/e/...` 喂给 Python。
- **重开清理**：精灵随实体生命周期销毁；沿用现有 `cleanupDestroyedVisuals` 流程即可，别在别处自行 destroy。

---

## 10. 验收清单

```text
[ ] process_keyed.py 输出 detected rows 为 5 个数
[ ] _<name>_on_dark.png：无白边/白块、每格一只、阴影正常、死亡碎屑不丢
[ ] minionSprites.ts 配置已粘贴；facesRight、displayHeight 已人工确认
[ ] （新种类）types/MINION_NAMES/createMinion/summon 升级 已补齐
[ ] npm run typecheck 通过
[ ] npm run build 通过
[ ] 浏览器实跑：动画播放、朝向正确、缩放协调、控制台无红色错误（favicon 404 可忽略）
```

---

## 11. 文件索引

```text
docs/Source/process_keyed.py     已抠透明图 → 统一网格（首选，带 CLI + 打印 TS 配置）
docs/Source/process_goblin.py    纯色底 → matting 抠图重排
docs/Source/process_sheets.py    棋盘格底 → flood-fill 抠图重排（skeleton/bat）
public/assets/<name>.png|json    成品精灵表 + 清单
public/assets/test/              输入原图、调色板、预览图（非运行时资源）
src/data/minionSprites.ts        MINION_SPRITES：每种小怪的精灵配置（接入主入口）
src/scenes/BootScene.ts          加载精灵表 + 注册动画
src/scenes/GameScene.ts          createMinionVisual / updateMinionSprite（渲染+动画状态机）
src/game/world.ts                createMinion 数值、STARTING_MINIONS
src/data/upgrades.ts             summon-<kind> 召唤升级（小怪的刷新入口）
src/game/types.ts                MinionKind 联合类型
src/data/minions.ts              MINION_NAMES 中文名
```
