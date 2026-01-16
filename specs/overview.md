# SysPrompt Overview

## The Problem

Users know good output when they see it but cannot specify requirements upfront.

Current prompt engineering tools ask users to define requirements first, then write a prompt, then test it. But users do not have requirements. They have taste. They discover what they want through rejection.

So they iterate: edit prompt, see output, hate it, edit again. Hours pass. They fix one thing, break another. No progress bar. No convergence.

## The Solution

SysPrompt flips the model. Instead of specifying requirements, users express preferences by reacting to outputs.

Good. Bad. Shorter. Longer. Never say that phrase. Yes, this one.

Each reaction is a signal. The system collects signals, infers rules, and builds the prompt automatically. The user never writes the prompt directly.

## Two Experiences

### Flow Mode (Development)

Minimal interface. One question, one response, four controls. User reacts. Signal captured. Response regenerates or moves to next question.

The user stays in flow state. No cognitive overhead. They just vibe until it works.

### Production Mode (Deployment)

Deploy through our proxy. Collect real user feedback. Detect patterns in unhappy responses. Suggest fixes. Prompt improves from real usage.

## Core Principles

1. **Users express taste, not requirements** - React to outputs instead of specifying upfront
2. **Invisible complexity** - All machinery hidden during flow mode
3. **Signals become rules** - Every interaction teaches the system
4. **Test cases are free** - Approved responses become tests automatically
5. **Continuous improvement** - Production feedback makes prompts better forever