# 《噬主：魔王胚胎》最终美术资源提示词

> **用途**: 可直接投喂 AI 绘图工具的生产级提示词  
> **目标画布**: 720×1280 竖屏，1× 逻辑像素（需 2× 高清则画布翻倍）  
> **导出格式**: 透明背景 PNG，关闭抗锯齿（pixelArt mode）

---

## 全局配置

### 通用风格前缀（所有资源必加）

```
dark grimdark fantasy pixel art, 2.5D top-down ARPG UI asset, hand-crafted 16–32px-cluster pixels with subtle dithering, high contrast on near-black background, ornate carved gothic frame (bone + blackened iron + worn gold trim), demonic occult motifs (horned skulls, bat wings, claws, dripping blood, glowing toxic-green soul flames, arcane purple runes), strong rim light, crisp readable silhouette, centered, isolated on transparent background, game UI sprite, no text, no watermark
```

### 通用负向词（所有资源必加）

```
photorealistic, 3d render, smooth gradients, blurry, antialiased soft edges, modern flat material design, cute/chibi, lowres jpeg artifacts, text, letters, signature, watermark, drop shadow on transparent bg, busy background
```

### 调色板（必须在提示词中明确指定颜色）

| 名称 | HEX | 用途 |
|---|---|---|
| void | `#070409` | 虚空黑底色 |
| panel | `#150a17` / `#21121f` | 面板填充 |
| blood | `#d5223a` / `#b51d2a` | HP、震荡、危险 |
| crimson | `#7e1b36` | 暗红描边 |
| bone | `#e8dcc0` | 骷髅、骨架、文字高光 |
| gold | `#c99437` → `#ffd76a` | 边框描金、按钮、王权 |
| flame | `#7ad13a` / `#4f8f25` | 腐血、灵魂火、史莱姆 |
| arcane | `#8a4bd6` / `#4a2470` | 胚胎、蝙蝠、老虎机 |
| frame | `#3a1840` | 老虎机/面板雕花框 |

---

## 1. 顶部状态栏 (TopStatusBar)

### 1.1 HUD 面板底框

- **尺寸**: 596×140 px
- **9-Slice**: cornerInset = 14px (四角不拉伸，边可平铺)
- **风格**: 暗黑 HUD 面板，黑铁边框 + 旧金铆钉 + 半透明深红内部
- **Prompt**:
  ```
  dark grimdark fantasy pixel art, 2.5D top-down ARPG UI asset, hand-crafted 16–32px-cluster pixels with subtle dithering, high contrast on near-black background, ornate carved gothic frame (bone + blackened iron + worn gold trim), demonic occult motifs (horned skulls, bat wings, claws, dripping blood, glowing toxic-green soul flames, arcane purple runes), strong rim light, crisp readable silhouette, centered, isolated on transparent background, game UI sprite, no text, no watermark — a horizontal HUD panel plaque, blackened iron border with worn gold rivets at the corners, faint engraved demonic runes, semi-transparent dark crimson interior, 9-slice friendly with plain tileable edges, top-left game HUD frame, palette void #070409 panel #150a17 border crimson #7e1b36 gold #c99437
  ```
- **Negative**: `photorealistic, 3d render, smooth gradients, blurry, antialiased soft edges, modern flat material design, cute/chibi, lowres jpeg artifacts, text, letters, signature, watermark, drop shadow on transparent bg, busy background`
- **格式**: PNG with alpha, 9-slice ready (边缘 14px 不拉伸)
- **文件名**: `hud_panel_596x140_inset14.png`

### 1.2 老虎机进度槽

- **尺寸**: 进度条 560×20 px，单格宝珠 26×26 px
- **状态**: 空槽 + 满槽 两态
- **风格**: 分段式神秘进度轨道，11 个骨边宝石槽，左端骷髅铆钉，右端金箭头
- **Prompt (空槽)**:
  ```
  [STYLE] a segmented occult progress track, ~11 small empty socket cells like inset bone-rimmed gem slots, gothic, for slot machine progress, left end a tiny horned skull rivet, right end a small gold arrow, palette void #070409 gold #c99437
  ```
- **Prompt (满槽)**:
  ```
  [STYLE] a segmented occult progress track, ~11 filled socket cells each holding a glowing toxic-green soul-flame gem, gothic, left end a tiny horned skull rivet, right end a small gold arrow, palette void #070409 gold #c99437 flame #7ad13a
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha
- **文件名**: `slot_progress_empty_560x20.png`, `slot_progress_filled_560x20.png`, `slot_orb_26x26.png`

### 1.3 状态图标 (HP / 腐血 / 胚胎值)

- **尺寸**: 每个 28×28 px
- **数量**: 3 个图标，统一描边重量
- **风格**: 血红心脏 + 腐血滴 + 奥术胚胎宝石
- **Prompt**:
  ```
  [STYLE] a set of three matching 28px game stat icons on transparent bg, same chunky outline weight: (1) a blood-red anatomical heart with a drip, color #d5223a; (2) a dripping corrupted-blood droplet wreathed in toxic-green flame, color #7ad13a + #b51d2a; (3) a faceted arcane purple demon-embryo gem glowing, color #8a4bd6; pixel art, crisp, isolated
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha, 四周留 ≥4px 透明安全边距
- **文件名**: `icon_hp_28x28.png`, `icon_corruption_28x28.png`, `icon_embryo_28x28.png`

### 1.4 状态条填充 (9-slice, 3 色)

- **尺寸**: 轨道 250×18 px, cornerInset = 6px
- **状态**: 空轨道 + 红色填充 + 绿色填充 + 紫色填充
- **风格**: 骨边轨道 + 光泽填充条（顶部高光线 + 内发光）
- **Prompt (轨道)**:
  ```
  [STYLE] a thin RPG stat bar empty track, dark bone-rimmed channel, 9-slice tileable along x, pixel art, isolated, palette bone #e8dcc0 void #070409
  ```
- **Prompt (填充条 - 分别生成 3 色)**:
  ```
  [STYLE] glossy stat bar fill strip with bright top highlight line and subtle inner glow, 9-slice tileable along x, pixel art, isolated — (1) blood red #d5223a; (2) toxic-green #7ad13a; (3) arcane-purple #8a4bd6
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha, 9-slice ready (上下 6px 不拉伸)
- **文件名**: `statbar_track_250x18_inset6.png`, `statbar_fill_red_250x18_inset6.png`, `statbar_fill_green_250x18_inset6.png`, `statbar_fill_purple_250x18_inset6.png`

### 1.5 暂停/设置按钮

- **尺寸**: 64×64 px
- **状态**: normal / pressed 两态
- **风格**: 圆形暗色徽章，旧金环，骨质双竖暂停条，微红光
- **Prompt**:
  ```
  [STYLE] a round dark medallion button with a worn gold ring, two vertical pause bars carved from bone in the center, faint crimson glow, grimdark mobile UI button, normal and pressed states, palette void #070409 gold #c99437 bone #e8dcc0
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha
- **文件名**: `btn_pause_normal_64x64.png`, `btn_pause_pressed_64x64.png`

### 1.6 Boss 血条框

- **尺寸**: 520×24 px
- **9-Slice**: cornerInset = 12px
- **风格**: 威严 Boss 血条框，黑钢 + 圣金花纹（堕落圣骑士主题），裂纹，空红槽
- **Prompt**:
  ```
  [STYLE] a wide menacing boss health bar frame, blackened steel with holy-gold filigree (a fallen paladin motif), cracked, with an empty red channel, 9-slice, pixel art, isolated, palette crimson #7e1b36 gold #c99437 bone #e8dcc0
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha, 9-slice ready (左右 12px 不拉伸)
- **文件名**: `boss_healthbar_520x24_inset12.png`

---

## 2. 技能轮盘 (SkillWheelView)

### 2.1 轮盘底环 + 中心枢纽

- **尺寸**: 底环 260×260 px，中心枢纽 72×72 px
- **风格**: 径向技能轮底环（黑曜石盘 + 奥术紫符文 + 四方位凹槽 + 绿魂火光），中心恶魔骷髅徽章
- **Prompt**:
  ```
  [STYLE] a radial skill-wheel base ring, dark obsidian disc with carved arcane purple runes around the rim and four cardinal notches, faint green soul-flame glow; PLUS a smaller central hub medallion with a horned demon skull; top-down mobile MOBA/ARPG skill wheel, isolated, palette panel #150a17 arcane #8a4bd6 gold #c99437 flame #7ad13a
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha
- **文件名**: `skill_wheel_ring_260x260.png`, `skill_wheel_hub_72x72.png`

### 2.2 节点底座

- **尺寸**: 84×84 px
- **状态**: default (暗淡) / selected (亮金描边)
- **风格**: 圆形技能节点插槽，骨铁边，选中态加亮金外发光
- **Prompt**:
  ```
  [STYLE] a circular skill-node socket, bone-and-iron rim on a dark disc, TWO states: default (dim) and selected with a bright glowing gold outline, pixel art game UI, isolated, gold #ffd76a void #070409
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha
- **文件名**: `skill_node_default_84x84.png`, `skill_node_selected_84x84.png`

### 1.6 Boss 血条框

- **尺寸**: 520×24 px
- **9-Slice**: cornerInset = 12px
- **风格**: 威严 Boss 血条框，黑钢 + 圣金花纹（堕落圣骑士主题），裂纹，空红槽
- **Prompt**:
  ```
  [STYLE] a wide menacing boss health bar frame, blackened steel with holy-gold filigree (a fallen paladin motif), cracked, with an empty red channel, 9-slice, pixel art, isolated, palette crimson #7e1b36 gold #c99437 bone #e8dcc0
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha, 9-slice ready (左右 12px 不拉伸)
- **文件名**: `boss_healthbar_520x24_inset12.png`

---

## 2. 技能轮盘 (SkillWheelView)

### 2.1 轮盘底环 + 中心枢纽

- **尺寸**: 底环 260×260 px，中心枢纽 72×72 px
- **风格**: 径向技能轮底环（黑曜石盘 + 奥术紫符文 + 四方位凹槽 + 绿魂火光），中心恶魔骷髅徽章
- **Prompt**:
  ```
  [STYLE] a radial skill-wheel base ring, dark obsidian disc with carved arcane purple runes around the rim and four cardinal notches, faint green soul-flame glow; PLUS a smaller central hub medallion with a horned demon skull; top-down mobile MOBA/ARPG skill wheel, isolated, palette panel #150a17 arcane #8a4bd6 gold #c99437 flame #7ad13a
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha
- **文件名**: `skill_wheel_ring_260x260.png`, `skill_wheel_hub_72x72.png`

### 2.2 节点底座

- **尺寸**: 84×84 px
- **状态**: default (暗淡) / selected (亮金描边)
- **风格**: 圆形技能节点插槽，骨铁边，选中态加亮金外发光
- **Prompt**:
  ```
  [STYLE] a circular skill-node socket, bone-and-iron rim on a dark disc, TWO states: default (dim) and selected with a bright glowing gold outline, pixel art game UI, isolated, gold #ffd76a void #070409
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha
- **文件名**: `skill_node_default_84x84.png`, `skill_node_selected_84x84.png`

### 2.3 四个技能图标 (震荡 / 血爆 / 腐蚀 / 召唤)

- **尺寸**: 每个 56×56 px
- **数量**: 4 个图标，统一描边重量，颜色编码
- **风格**: 暗黑技能图标，清晰可辨识轮廓
- **Prompt**:
  ```
  [STYLE] a set of four matching 56px grimdark skill icons, same outline weight, isolated each on transparent bg:
  (1) "震荡" SHOCKWAVE — concentric blood shock rings / a slamming gauntlet, color #d5223a;
  (2) "血爆" BLOOD BURST — an exploding blood orb with spatter, color #b51d2a;
  (3) "腐蚀" CORROSION — a dripping toxic-green acid skull, color #7ad13a;
  (4) "召唤" SUMMON — a purple summoning rune circle birthing a tiny imp, color #8a4bd6;
  pixel art, crisp readable silhouettes
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha, 四周留 ≥4px 透明安全边距
- **文件名**: `skill_shockwave_56x56.png`, `skill_bloodburst_56x56.png`, `skill_corrosion_56x56.png`, `skill_summon_56x56.png`

---

## 3. 恶魔老虎机 (DemonSlotMachineView)

### 3.1 机身雕花外框 + 顶部恶魔头冠

- **尺寸**: 机身框 580×760 px (cornerInset = 40px)，头冠饰件 260×160 px
- **9-Slice**: 机身框支持 9-slice，中空
- **风格**: 华丽恶魔老虎机柜框，奥术紫木 + 黑铁 + 旧金边，哥特柱，底部绿魂火，顶部恶魔骷髅冠
- **Prompt**:
  ```
  [STYLE] an ornate demonic slot-machine cabinet frame, carved arcane-purple wood and blackened iron with worn gold trim, gothic columns on the sides, glowing green soul-flames licking the base, a large horned demon skull crest mounted on top (separate piece), 9-slice friendly hollow center, pixel art, isolated, palette frame #3a1840 arcane #8a4bd6 gold #c99437 flame #7ad13a void #070409
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha, 9-slice ready (四周 40px 不拉伸)
- **文件名**: `slot_machine_frame_580x760_inset40.png`, `slot_machine_crest_260x160.png`

### 3.2 标题横幅底 (不含文字)

- **尺寸**: 360×80 px
- **风格**: 华丽横幅牌匾，深红布 + 金绳边 + 骷髅端帽，中心空白供文字
- **Prompt**:
  ```
  [STYLE] an ornate banner plaque ribbon, dark crimson cloth with gold rope trim and skull end-caps, empty center for title text, grimdark casino-from-hell, isolated, crimson #b51d2a gold #c99437
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha
- **文件名**: `slot_title_banner_360x80.png`

### 3.3 转轮格 (ReelCell)

- **尺寸**: 150×120 px
- **9-Slice**: cornerInset = 10px
- **风格**: 老虎机转轮窗口，凹陷暗槽 + 骨边金框 + 微弱玻璃反光
- **Prompt**:
  ```
  [STYLE] a slot-machine reel cell window, recessed dark slot with bone-rimmed gold bezel and a faint glass glare, empty center, 9-slice, pixel art, isolated, gold #c99437 void #070409
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha, 9-slice ready (四周 10px 不拉伸)
- **文件名**: `slot_reel_cell_150x120_inset10.png`

### 3.4 六个老虎机符号

- **尺寸**: 每个 96×96 px
- **数量**: 6 个符号，统一描边重量，居中构图
- **风格**: 暗黑赌场符号，鲜艳可辨识
- **Prompt**:
  ```
  [STYLE] a set of six matching 96px slot-machine symbols, grimdark pixel art, same outline weight, each isolated on transparent bg, vivid and readable at small size:
  (1) 骨冠 — a bone crown skull, bone #e8dcc0;
  (2) 血翼 — a pair of bloody bat wings, crimson #b51d2a;
  (3) 腐口 — a fanged corrupt maw dripping ichor, dark red + bone;
  (4) 火焰 — a green soul-flame, flame #7ad13a;
  (5) 毒液 — a toxic poison vial / bubbling drop, #4f8f25;
  (6) 王权 — a golden royal crown with a ruby, gold #ffd76a + #d5223a;
  casino slot iconography meets demonic theme
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha, 四周留 ≥4px 透明安全边距
- **文件名**: `slot_symbol_bone_crown_96x96.png`, `slot_symbol_blood_wings_96x96.png`, `slot_symbol_corrupt_maw_96x96.png`, `slot_symbol_soul_flame_96x96.png`, `slot_symbol_poison_96x96.png`, `slot_symbol_royal_crown_96x96.png`

### 3.5 "确定领取"按钮

- **尺寸**: 320×72 px
- **9-Slice**: cornerInset = 16px
- **状态**: normal / hover / pressed / disabled 四态
- **风格**: 宽华丽确认按钮牌匾，抛光金面 + 雕刻边 + 铆钉，斜面
- **Prompt**:
  ```
  [STYLE] a wide ornate confirm button plaque, polished gold face with engraved border and rivets, beveled, four states (normal / hover-glow / pressed-darker / disabled-grey), 9-slice, grimdark mobile UI, isolated, gold #c99437→#ffd76a crimson #7e1b36
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha, 9-slice ready (左右 16px 不拉伸)
- **文件名**: `btn_claim_normal_320x72_inset16.png`, `btn_claim_hover_320x72_inset16.png`, `btn_claim_pressed_320x72_inset16.png`, `btn_claim_disabled_320x72_inset16.png`

### 3.6 拉杆组件 (Lever)

- **尺寸**: 轨道 40×300 px，红球把手 56×56 px，下拉把手 360×64 px，箭头 48×64 px
- **风格**: 老虎机侧拉杆（黑铁轨道 + 光泽红球把手 + 金环），下拉链条把手 + 发光绿箭头
- **Prompt**:
  ```
  [STYLE] a slot-machine side lever: a vertical blackened-iron rail track PLUS a glossy crimson sphere knob with a gold collar on a rod; ALSO a pull-down handle tab (a hanging chain + horned grip) and a downward glowing green arrow, pixel art, isolated, blood #d5223a gold #c99437 flame #7ad13a
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha
- **文件名**: `slot_lever_track_40x300.png`, `slot_lever_knob_56x56.png`, `slot_pull_handle_360x64.png`, `slot_arrow_down_48x64.png`

---

## 4. 小怪军团 (MinionLegionBar)

### 4.1 队列面板底 + 肖像格 + 数量徽章 + 精英金环

- **尺寸**: 面板 300×96 px，肖像格 56×56 px (cornerInset = 8px)，徽章 24×24 px，精英环 64×64 px
- **9-Slice**: 面板和肖像格支持 9-slice
- **风格**: 左下小队面板，暗色牌匾 + 骨边肖像槽 + 金边计数徽章 + 发光金精英环
- **Prompt**:
  ```
  [STYLE] a bottom-left squad panel: a small dark plaque labelled area, PLUS a single bone-rimmed portrait slot frame, PLUS a tiny round count-badge (dark disc, gold rim), PLUS a glowing gold "elite" ring overlay, pixel art game UI, 9-slice for the frames, isolated, panel #150a17 crimson #7e1b36 gold #c99437
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha, 9-slice ready
- **文件名**: `minion_panel_300x96.png`, `minion_portrait_frame_56x56_inset8.png`, `minion_count_badge_24x24.png`, `minion_elite_ring_64x64.png`

### 4.2 四个小怪头像 (骷髅 / 蝙蝠 / 哥布林 / 史莱姆)

- **尺寸**: 每个 48×48 px
- **数量**: 4 个头像，统一构图（头部/半身），清晰轮廓
- **风格**: 暗黑小怪肖像，服务魔王的邪恶仆从
- **Prompt**:
  ```
  [STYLE] a set of four matching 48px minion portrait icons, grimdark pixel art, same framing (head/bust), each isolated:
  (1) skeleton 骷髅 — bone #e8dcc0 grinning skull warrior;
  (2) bat 蝙蝠 — arcane-purple winged bat #8a4bd6;
  (3) goblin 哥布林 — toxic-green goblin #7ad13a with red eyes;
  (4) slime 史莱姆 — dripping dark-green slime #4f8f25;
  evil minions serving a demon lord, readable silhouettes
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha, 四周留 ≥4px 透明安全边距
- **文件名**: `minion_skeleton_48x48.png`, `minion_bat_48x48.png`, `minion_goblin_48x48.png`, `minion_slime_48x48.png`

### 3.6 拉杆组件 (Lever)

- **尺寸**: 轨道 40×300 px，红球把手 56×56 px，下拉把手 360×64 px，箭头 48×64 px
- **风格**: 老虎机侧拉杆（黑铁轨道 + 光泽红球把手 + 金环），下拉链条把手 + 发光绿箭头
- **Prompt**:
  ```
  [STYLE] a slot-machine side lever: a vertical blackened-iron rail track PLUS a glossy crimson sphere knob with a gold collar on a rod; ALSO a pull-down handle tab (a hanging chain + horned grip) and a downward glowing green arrow, pixel art, isolated, blood #d5223a gold #c99437 flame #7ad13a
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha
- **文件名**: `slot_lever_track_40x300.png`, `slot_lever_knob_56x56.png`, `slot_pull_handle_360x64.png`, `slot_arrow_down_48x64.png`

---

## 4. 小怪军团 (MinionLegionBar)

### 4.1 队列面板底 + 肖像格 + 数量徽章 + 精英金环

- **尺寸**: 面板 300×96 px，肖像格 56×56 px (cornerInset = 8px)，徽章 24×24 px，精英环 64×64 px
- **9-Slice**: 面板和肖像格支持 9-slice
- **风格**: 左下小队面板，暗色牌匾 + 骨边肖像槽 + 金边计数徽章 + 发光金精英环
- **Prompt**:
  ```
  [STYLE] a bottom-left squad panel: a small dark plaque labelled area, PLUS a single bone-rimmed portrait slot frame, PLUS a tiny round count-badge (dark disc, gold rim), PLUS a glowing gold "elite" ring overlay, pixel art game UI, 9-slice for the frames, isolated, panel #150a17 crimson #7e1b36 gold #c99437
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha, 9-slice ready
- **文件名**: `minion_panel_300x96.png`, `minion_portrait_frame_56x56_inset8.png`, `minion_count_badge_24x24.png`, `minion_elite_ring_64x64.png`

### 4.2 四个小怪头像 (骷髅 / 蝙蝠 / 哥布林 / 史莱姆)

- **尺寸**: 每个 48×48 px
- **数量**: 4 个头像，统一构图（头部/半身），清晰轮廓
- **风格**: 暗黑小怪肖像，服务魔王的邪恶仆从
- **Prompt**:
  ```
  [STYLE] a set of four matching 48px minion portrait icons, grimdark pixel art, same framing (head/bust), each isolated:
  (1) skeleton 骷髅 — bone #e8dcc0 grinning skull warrior;
  (2) bat 蝙蝠 — arcane-purple winged bat #8a4bd6;
  (3) goblin 哥布林 — toxic-green goblin #7ad13a with red eyes;
  (4) slime 史莱姆 — dripping dark-green slime #4f8f25;
  evil minions serving a demon lord, readable silhouettes
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha, 四周留 ≥4px 透明安全边距
- **文件名**: `minion_skeleton_48x48.png`, `minion_bat_48x48.png`, `minion_goblin_48x48.png`, `minion_slime_48x48.png`

---

## 5. 震荡技能按钮 (SkillButtonView)

### 5.1 主按钮

- **尺寸**: 132×132 px
- **状态**: normal (ready glowing) / pressed (punched-in) / disabled (desaturated) 三态
- **风格**: 大型圆形动作技能按钮，华丽金环 + 骨钉 + 深红盘面 + 发光金震荡符文（冲击环/爪拳）
- **Prompt**:
  ```
  [STYLE] a large round action skill button for "震荡" (shockwave), an ornate gold ring with bone studs around a deep crimson disc, a glowing gold slamming-shock glyph (concentric impact rings / a clawed fist) in the center, strong rim light, three states (ready glowing / pressed punched-in / disabled desaturated), grimdark mobile UI, bottom-right thumb button, isolated, blood #d5223a crimson #b51d2a gold #c99437→#ffd76a
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha
- **文件名**: `skill_btn_shockwave_ready_132x132.png`, `skill_btn_shockwave_pressed_132x132.png`, `skill_btn_shockwave_disabled_132x132.png`

### 5.2 冷却扫描遮罩

- **尺寸**: 120×120 px
- **风格**: 径向冷却扫描覆盖层，半透明暗色楔形/扇形，顺时针扫过，微薄前缘高光
- **Prompt**:
  ```
  [STYLE] a radial cooldown sweep overlay, a semi-transparent dark wedge/pie mask that sweeps clockwise over a round button, faint thin leading edge highlight, game UI cooldown indicator, isolated on transparent, near-black #070409 alpha
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha (半透明)
- **文件名**: `cooldown_mask_120x120.png`

---

## 6. 背景与氛围装饰 (可选)

### 6.1 地牢地面 tile

- **尺寸**: 256×256 px
- **可平铺**: 无缝拼接
- **风格**: 暗黑地牢石地板，裂纹石板 + 血迹 + 微弱奥术紫符文，俯视 2.5D，低调光照
- **Prompt**:
  ```
  [STYLE] a seamless tileable dark dungeon stone floor, cracked flagstones with bloodstains and faint arcane purple runes, top-down 2.5D, low-key lighting, pixel art, void #070409 frame #3a1840 crimson #7e1b36
  ```
- **Negative**: [通用负向词]
- **格式**: PNG, 无缝平铺
- **文件名**: `bg_dungeon_floor_256x256_tile.png`

### 6.2 边角灵魂火 / 飘血装饰

- **尺寸**: 96×128 px
- **数量**: 左右各一（镜像）
- **风格**: 装饰性边角点缀，升腾毒绿魂火柱 + 滴落血液
- **Prompt**:
  ```
  [STYLE] decorative corner embellishments: a column of rising toxic-green soul flames and a trickle of dripping blood, grimdark pixel art, isolated, for screen corners, flame #7ad13a blood #d5223a
  ```
- **Negative**: [通用负向词]
- **格式**: PNG with alpha
- **文件名**: `deco_corner_left_96x128.png`, `deco_corner_right_96x128.png` (镜像)

---

## 7. 生产工作流建议

### 优先级排序

1. **P0 - 核心交互** (先做"能点的")
   - 按钮：暂停按钮、确定领取按钮、震荡技能按钮
   - 框架：HUD 面板底框、状态条、Boss 血条框

2. **P1 - 视觉识别**
   - 图标：状态图标 (HP/腐血/胚胎)、技能图标 (4 个)
   - 符号：老虎机符号 (6 个)、小怪头像 (4 个)

3. **P2 - 结构装饰**
   - 轮盘：技能轮盘底环、节点底座
   - 机身：老虎机外框、转轮格、拉杆组件

4. **P3 - 氛围增强**
   - 背景：地牢地面 tile、边角装饰

### 批量生成策略

**同组资源必须在同一次生成中完成**，确保风格一致性：

- **状态图标组** (3 个) → 同一 prompt，统一描边
- **技能图标组** (4 个) → 同一 prompt，统一轮廓
- **老虎机符号组** (6 个) → 同一 prompt，统一尺寸
- **小怪头像组** (4 个) → 同一 prompt，统一构图

### 工具推荐

- **Stable Diffusion** + pixel-art LoRA / ControlNet
- **Retro Diffusion** (专门像素艺术模型)
- **Aseprite** (手工修正细节)
- **MCP 工具** (如项目中可用):
  - `minimax-multimodal-toolkit` (图像生成)
  - `gif-sticker-maker` (带描边贴纸/GIF)

### 导出规范

- **格式**: PNG with alpha channel
- **抗锯齿**: 关闭 (pixelArt mode)
- **尺寸**: 严格按文档标注 (幂等尺寸优先，便于打包图集)
- **9-Slice 标注**: 在文件名中记录 inset 值
  - 示例: `hud_panel_596x140_inset14.png`
- **多状态命名**: 状态后缀清晰
  - 示例: `btn_pause_normal_64x64.png`, `btn_pause_pressed_64x64.png`

### 落地集成步骤

1. **资源存放**: 成品放入 `public/assets/ui/`
2. **预加载**: 在 `BootScene.preload()` 中用 `this.load.image(...)` 加载
3. **工厂改造**: 修改 `uiTheme.ts` 中的占位工厂函数
   - `makePanel` → 返回 `scene.add.nineslice(...)`
   - `makeMedallion` → 返回 `scene.add.image(...)`
   - `makeStatBar` → 返回 `scene.add.nineslice(...)` + 填充条
4. **零改动调用**: 所有 view 调用处无需修改

---

## 8. 资源清单总览

| 类别 | 资源数量 | 总文件数 |
|------|---------|---------|
| 顶部状态栏 | 6 项 | ~15 文件 |
| 技能轮盘 | 3 项 | ~7 文件 |
| 恶魔老虎机 | 6 项 | ~20 文件 |
| 小怪军团 | 2 项 | ~8 文件 |
| 震荡按钮 | 2 项 | ~4 文件 |
| 背景装饰 | 2 项 | ~3 文件 |
| **总计** | **21 项** | **~57 文件** |

---

## 附录：快速查找索引

### 按尺寸查找

- **720×1280**: 全屏背景
- **596×140**: HUD 面板底框
- **580×760**: 老虎机机身框
- **520×24**: Boss 血条框
- **360×80**: 标题横幅
- **320×72**: 确定领取按钮
- **300×96**: 小怪军团面板
- **260×260**: 技能轮盘底环
- **260×160**: 老虎机头冠
- **256×256**: 地牢地面 tile
- **250×18**: 状态条
- **150×120**: 转轮格
- **132×132**: 震荡技能按钮
- **96×96**: 老虎机符号
- **84×84**: 技能节点底座
- **72×72**: 轮盘中心枢纽
- **64×64**: 暂停按钮、精英金环
- **56×56**: 技能图标、肖像格、拉杆把手
- **48×48**: 小怪头像
- **28×28**: 状态图标
- **26×26**: 进度宝珠
- **24×24**: 数量徽章

### 按技术要求查找

**需要 9-Slice**:
- HUD 面板底框 (inset 14px)
- 状态条轨道 (inset 6px)
- Boss 血条框 (inset 12px)
- 老虎机机身框 (inset 40px)
- 转轮格 (inset 10px)
- 确定领取按钮 (inset 16px)
- 小怪肖像格 (inset 8px)

**需要多状态**:
- 暂停按钮 (normal/pressed)
- 确定领取按钮 (normal/hover/pressed/disabled)
- 震荡技能按钮 (ready/pressed/disabled)
- 技能节点底座 (default/selected)
- 老虎机进度槽 (empty/filled)

**需要成组生成**:
- 状态图标 (3 个)
- 技能图标 (4 个)
- 老虎机符号 (6 个)
- 小怪头像 (4 个)

---

**文档版本**: v1.0  
**生成日期**: 2026-05-30  
**对应代码**: `src/ui-mockup/` (待替换为最终美术资源)

