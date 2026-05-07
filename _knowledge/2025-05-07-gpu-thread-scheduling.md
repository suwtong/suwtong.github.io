---
title: "GPU 线程调度基础概念"
date: 2025-05-07
tags: [GPU, 线程调度, SIMT]
---

## 概述

在 GPGPU 架构中，线程调度是实现大规模并行计算的核心机制之一。本文简要介绍 GPU 线程调度的基础概念。

## Warp 与线程束

GPU 以 Warp（NVIDIA）或 Wavefront（AMD）为最小调度单位，通常为 32 或 64 个线程。同一 Warp 内的线程执行相同的指令（SIMT 模型）。

### 关键概念

- **Warp Scheduler**：负责选择就绪的 Warp 发射到执行单元
- **Occupancy**：SM 上活跃 Warp 数与最大可驻留 Warp 数的比值
- **Latency Hiding**：通过在多个 Warp 之间切换来隐藏内存访问延迟

## 调度策略

常见的 Warp 调度策略包括：

1. **Round-Robin**：轮询调度，公平但不一定高效
2. **Greedy-Then-Oldest (GTO)**：优先调度最近活跃的 Warp
3. **Two-Level Scheduling**：将 Warp 分为活跃组和待命组

## 对 AI 工作负载的影响

AI 推理和训练中的矩阵运算通常具有规则的访存模式，这使得线程调度相对高效。但在 attention 机制等不规则计算中，调度策略的选择对性能影响显著。

---

*后续会深入讨论具体调度算法的微架构实现。*
