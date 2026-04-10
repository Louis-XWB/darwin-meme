# Darwin.meme Design Spec

> AI Agent 在 meme 经济中通过自主实验和自然选择进化出人类想不到的策略。

## 1. 项目定位

**名称**：Darwin.meme

**一句话定义**：一个实时进化竞技平台，AI Agent 通过自主实验和自然选择，在模拟的 meme token 市场中进化出人类想不到的交易和创作策略。

**核心叙事**：达尔文证明了自然选择能产生智能。我们把同样的原理放进 meme 经济 — 让 AI agent 自主实验、竞争、进化。几百代之后，它们涌现出的策略超越了任何人为设计。Darwin.meme 不是一个工具，它是一个活的 AI 生态系统。

**与 Four.meme 的关系**：
- 模拟引擎完整复刻 Four.meme 的 bonding curve 和 graduation 机制
- 进化产生的最优策略可通过 Agentic Mode 部署到真实 Four.meme
- 定位：Four.meme 生态的"AI 策略发现引擎"

**目标黑客松**：Four.meme AI Sprint（$50,000 奖池，2026-04-22 提交截止）

**评分维度**：
- 创新性 30%（进化计算 + 自主实验 + meme 经济 = 三领域交叉创新）
- 技术实现 30%（多 Agent 系统 + 遗传算法 + LLM 决策 + 实时可视化）
- 实用价值 20%（策略发现引擎，可部署到真实 Four.meme）
- 展示效果 20%（实时进化对战，AI 解说，视觉冲击力强）
- 社区投票 30%（娱乐性高，像 AI 版"饥饿游戏"）

## 2. 核心架构

```
┌─────────────────────────────────────────────────┐
│                 Darwin.meme                      │
│                                                  │
│  ┌───────────┐  ┌───────────┐  ┌─────────────┐ │
│  │  Agent    │  │  Market   │  │  Evolution  │ │
│  │  Engine   │◄─┤ Simulator │──┤  Engine     │ │
│  └─────┬─────┘  └─────┬─────┘  └──────┬──────┘ │
│        │              │               │         │
│  ┌─────▼──────────────▼───────────────▼──────┐  │
│  │           Real-time Dashboard              │  │
│  └───────────────────┬───────────────────────┘  │
│                      │                          │
│  ┌───────────────────▼───────────────────────┐  │
│  │        Four.meme Integration               │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 模块职责

**Agent Engine（智能体引擎）**：每个 Agent 是一个自主实体，包含策略基因组、LLM 决策模块、AutoResearch 自主实验循环。

**Market Simulator（市场模拟器）**：完整复刻 Four.meme 的 bonding curve 定价、token 创建、交易撮合、graduation 机制、社交热度模拟。

**Evolution Engine（进化引擎）**：每个 epoch 结束后执行适应度评估、锦标赛选择、交叉、变异，产生下一代。

**Real-time Dashboard（实时仪表盘）**：4 个区域 — 市场视图、Agent 排行榜、进化可视化、AI 解说员。

**Four.meme Integration**：Bitquery API 获取真实数据，Agentic Mode 部署最优策略。

## 3. Agent 策略基因组

每个 Agent 的基因组是一个可序列化的参数向量，分为 4 个染色体：

### Trading Chromosome（交易基因）

| 参数 | 范围 | 含义 |
|------|------|------|
| risk_appetite | 0.0 ~ 1.0 | 风险偏好 |
| entry_threshold | 0.0 ~ 1.0 | 买入信号阈值 |
| exit_threshold | 0.0 ~ 1.0 | 卖出信号阈值 |
| position_size | 0.1 ~ 0.5 | 单次仓位比例 |
| max_holdings | 1 ~ 10 | 最大同时持仓数 |
| graduation_bias | 0.0 ~ 1.0 | 偏好即将毕业的 token |

### Creation Chromosome（创作基因）

| 参数 | 范围 | 含义 |
|------|------|------|
| creation_frequency | 0.0 ~ 1.0 | 创建 token 的倾向 |
| theme_vector | [float x 8] | 主题偏好向量：动物、政治、科技、搞笑、食物、加密原生、流行文化、荒诞 |
| naming_style | enum(0-4) | 命名风格：0=谐音梗, 1=缩写, 2=emoji组合, 3=拼接词, 4=纯随机 |
| hype_intensity | 0.0 ~ 1.0 | 营销炒作强度 |

### Social Chromosome（社交基因）

| 参数 | 范围 | 含义 |
|------|------|------|
| follow_leader | 0.0 ~ 1.0 | 跟风倾向 |
| contrarian | 0.0 ~ 1.0 | 反向操作倾向 |
| herd_sensitivity | 0.0 ~ 1.0 | 对群体行为的敏感度 |
| cooperation | 0.0 ~ 1.0 | 协作倾向 |

### Meta Chromosome（元策略基因）

| 参数 | 范围 | 含义 |
|------|------|------|
| experiment_rate | 0.0 ~ 1.0 | AutoResearch 实验频率 |
| adaptation_speed | 0.0 ~ 1.0 | 策略调整速度 |
| memory_weight | 0.0 ~ 1.0 | 历史经验权重 |
| exploration_vs_exploit | 0.0 ~ 1.0 | 探索 vs 利用 |

### LLM 决策流程

基因组参数作为 system prompt 注入 LLM。基因组不直接决定行为，而是塑造 LLM 的"性格"。同样的市场状况，不同基因组的 Agent 会做出截然不同的决策。进化改变的是"性格"，不是硬编码的规则。

Agent 可选行动：CREATE（创建 token）、BUY、SELL、HOLD、EXPERIMENT（尝试新策略假设）。

### AutoResearch 与 Evolution 的关系

这是两层不同粒度的学习机制：

- **AutoResearch（Agent 级别，epoch 内）**：单个 Agent 在一个 epoch 的 50 轮中，通过 EXPERIMENT 行动微调自己的行为偏好（不改变基因组，只影响 LLM prompt 中的临时策略注记）。这是"个体学习"。
- **Evolution（种群级别，epoch 间）**：每个 epoch 结束后，基于适应度对整个种群执行选择/交叉/变异，改变基因组本身。这是"种群进化"。

个体学习的结果不会直接遗传（拉马克 vs 达尔文），但擅长学习的 Agent（高 experiment_rate + 高 adaptation_speed）会因为表现更好而被自然选择保留。

## 4. Market Simulator 市场模拟器

### Bonding Curve 定价

```
price = K * (supply_sold / total_supply) ^ N

K = 0.000000001 (基础价格，对齐 Four.meme 初始极低价)
N = 2 (二次曲线，越买越贵)
```

- 初始 token 供应量：1,000,000,000
- 毕业阈值：累计交易额达到 24 单位（对齐 Four.meme 的 24 BNB）
- 每个 Agent 初始资金：100 单位

### Token 生命周期

创建 → Bonding Curve 交易 → 达到阈值 → Graduation（毕业）/ 无交易量 → 死亡

### 模拟时间

一个 Epoch = 50 轮（Tick）。每轮：更新市场状态 → Agent 观察+决策+执行 → 结算 → 记录事件。

### 社交热度模拟

```
token_buzz = base_buzz
           + volume_factor * 近期交易量
           + holder_factor * 持有人数
           + creator_hype * 创建者炒作值
           + viral_random * 随机病毒事件
```

### 市场事件系统

| 事件 | 概率 | 效果 |
|------|------|------|
| 鲸鱼入场 | 3%/轮 | 某 token 突然大量买入 |
| FUD 恐慌 | 2%/轮 | 全市场价格短暂下跌 |
| 病毒传播 | 5%/轮 | 随机 token 热度暴涨 |
| 流动性危机 | 1%/轮 | 某 token 卖盘深度骤降 |
| 新叙事浪潮 | 3%/轮 | 某主题类 token 集体上涨 |

## 5. Evolution Engine 进化引擎

### 进化流程

```
第1代: 随机初始化 20 个 Agent
  ↓ 运行 1 个 Epoch（50轮交易）
  ↓ 适应度评估
  ↓ 选择 Top 8 存活
  ↓ 交叉产生 8 个后代
  ↓ 变异 4 个新随机个体
第2代: 20 个 Agent → 继续...
```

### 适应度函数

```
fitness = 0.4 * 收益率
        + 0.3 * token存活率（创建的token是否毕业）
        + 0.2 * 策略独特性（与其他Agent的基因距离）
        + 0.1 * 风险调整收益（Sharpe-like ratio）
```

策略独特性权重防止收敛到单一策略，鼓励多样性和涌现。

### 遗传算子

- **选择**：锦标赛选择（随机抽 3 个，取最优）
- **交叉**：单点交叉（随机选染色体切割点，交换片段）
- **变异**：高斯变异（每个基因 10% 概率被扰动，标准差 0.1）
- **新血**：每代引入 4 个全随机个体，防止早熟收敛

## 6. Real-time Dashboard 实时仪表盘

### 布局

```
┌─────────────────────┬──────────────────────────┐
│   Market View       │   Agent Leaderboard      │
│   • Token卡片       │   • 排名/收益/代数        │
│   • 价格曲线        │   • 基因组雷达图          │
│   • 交易流          │   • 持仓和决策日志        │
│   • 热力图          │                          │
├─────────────────────┼──────────────────────────┤
│   Evolution View    │   AI Commentator         │
│   • 进化树          │   • 实时解说             │
│   • 适应度曲线      │   • 代际总结             │
│   • 策略散点图      │   • 涌现策略高亮          │
│   • 基因漂变        │                          │
└─────────────────────┴──────────────────────────┘
```

### 交互功能

- 速度控制：1x / 5x / Max
- 时间旅行：拖动时间轴回看历史
- Agent 对比：选 2 个 Agent 并排对比
- 导出策略：下载基因组 JSON

## 7. 技术栈

| 层 | 选择 | 理由 |
|---|---|---|
| 前端 | Next.js 14 + React + TypeScript | SSR + 生态成熟 |
| 样式 | TailwindCSS + shadcn/ui | 快速出高质量 UI |
| 实时通信 | WebSocket (Socket.IO) | 低延迟推送 |
| 可视化 | D3.js + Recharts | 复杂图表 + 常规图表 |
| 后端 | Python + FastAPI | Agent 逻辑 + 进化算法 |
| AI | Claude API (claude-sonnet-4-6) | Agent 决策 + AI 解说 |
| 数据库 | Redis + SQLite | 实时状态 + 历史记录 |
| 部署 | Vercel + Railway/Fly.io | 免费额度够 Demo |

## 8. 项目结构

```
darwin-meme/
├── frontend/                  # Next.js 前端
│   ├── app/
│   │   ├── page.tsx          # Dashboard 主页
│   │   └── layout.tsx
│   ├── components/
│   │   ├── market/           # Market View
│   │   ├── leaderboard/      # Agent Leaderboard
│   │   ├── evolution/        # Evolution View
│   │   ├── commentator/      # AI Commentator
│   │   └── shared/           # 公共组件
│   ├── hooks/                # WebSocket hooks
│   ├── lib/                  # 工具函数
│   └── types/                # TypeScript 类型
│
├── backend/                   # Python 后端
│   ├── main.py               # FastAPI + WebSocket
│   ├── agent/
│   │   ├── genome.py         # 基因组定义
│   │   ├── agent.py          # Agent 实体
│   │   ├── decision.py       # LLM 决策模块
│   │   └── experiment.py     # AutoResearch 循环
│   ├── market/
│   │   ├── simulator.py      # 市场模拟器
│   │   ├── bonding_curve.py  # Bonding Curve
│   │   ├── token.py          # Token 实体
│   │   └── events.py         # 市场事件系统
│   ├── evolution/
│   │   ├── engine.py         # 进化引擎
│   │   ├── fitness.py        # 适应度评估
│   │   ├── crossover.py      # 交叉算子
│   │   └── mutation.py       # 变异算子
│   ├── commentator/
│   │   └── narrator.py       # AI 解说员
│   └── data/
│       └── store.py          # Redis + SQLite
│
└── docs/
    └── superpowers/specs/    # 设计文档
```

## 9. API 成本估算

- 20 Agents × 50 轮/epoch × ~500 tokens/次 ≈ 500K tokens/epoch
- 解说：10 次/epoch × ~300 tokens ≈ 3K tokens/epoch
- 一次完整进化（20代）≈ 10M tokens ≈ ~$30
- Demo 跑 5-10 代，成本可控

## 10. 开发计划（12天）

| 天数 | 任务 | 产出 |
|------|------|------|
| Day 1-2 | 后端核心：基因组、Agent、Bonding Curve、市场模拟器 | 跑通一轮模拟 |
| Day 3-4 | 进化引擎 + AutoResearch + 市场事件 | 完整进化流程 |
| Day 5 | Claude API 集成：Agent 决策 + AI 解说 | LLM 驱动决策 |
| Day 6-7 | 前端 Dashboard：Market View + Leaderboard | 可视化市场和排名 |
| Day 8-9 | 前端：Evolution View + Commentator + WebSocket | 完整 Dashboard |
| Day 10 | Four.meme 集成：Bitquery + Agentic Mode | 真实生态连接 |
| Day 11 | 联调 + UI 打磨 + 边界处理 | 稳定 Demo |
| Day 12 | Demo 视频 + README + 提交 | 完成提交 |

## 11. Demo 视频脚本（3-5分钟）

- **0:00-0:30 Hook**："如果让 AI 在 meme 市场中进化 100 代，会发生什么？"
- **0:30-1:30 问题与概念**：介绍 Darwin.meme 核心理念
- **1:30-3:30 Live Demo**：展示进化过程（第1代→第5代→第15代），AI 解说，进化树，策略散点图
- **3:30-4:30 技术深度**：架构图 + Four.meme 集成
- **4:30-5:00 结尾**："Darwin.meme — 让进化为你发现策略"

## 12. 社区投票策略

- Demo 视频要有视觉冲击力（进化树动画、AI 对战画面）
- 项目名 "Darwin.meme" 自带传播性
- Twitter/X 发布进化过程的 GIF/短视频片段
