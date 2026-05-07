---
title: "GPU Thread Scheduling Fundamentals"
date: 2025-05-07
tags: [GPU, Thread Scheduling, SIMT]
---

## Overview

Thread scheduling is a core mechanism for massive parallelism in GPGPU architectures. This post covers the basics.

## Warp and Thread Bundles

GPUs schedule threads in groups called Warps (NVIDIA) or Wavefronts (AMD), typically 32 or 64 threads. All threads in a Warp execute the same instruction (SIMT model).

### Key Concepts

- **Warp Scheduler**: Selects ready Warps to issue to execution units
- **Occupancy**: Ratio of active Warps to maximum resident Warps on an SM
- **Latency Hiding**: Switching between Warps to hide memory access latency

## Scheduling Policies

Common Warp scheduling strategies:

1. **Round-Robin**: Fair scheduling, not always efficient
2. **Greedy-Then-Oldest (GTO)**: Prioritizes recently active Warps
3. **Two-Level Scheduling**: Divides Warps into active and pending groups

## Impact on AI Workloads

Matrix operations in AI training/inference typically have regular memory access patterns, making scheduling efficient. However, in irregular computations like attention mechanisms, scheduling policy choice significantly affects performance.

---

*Future posts will dive into specific microarchitectural implementations.*
