---
name: human_readable_code
description: "Use when: writing, reviewing, or refactoring code to improve human readability. Covers naming, function size, consistency, abstractions, comments, and code clarity."
---

# Human Readable Code Skill

## Purpose
Use this skill when reviewing, writing, or refactoring code to improve human readability.

The goal is to produce code that another developer can understand quickly without reverse-engineering the intent.

## Core Principle
Optimize for the human reader, not the computer.

A reader should be able to answer:
- What does this do?
- Why does it exist?
- How is it supposed to work?

## Guidelines

### 1. Use clear names
Prefer names that describe intent, not mechanics.

Good:
- `get_user_profile(user_id)`
- `calculate_total_price()`
- `send_password_reset_email()`

Avoid vague names like:
- `x`
- `data`
- `temp`
- `handleStuff()`

### 2. Keep functions small and focused
Each function should do one clear job.

Prefer:
1. validate input
2. transform data
3. perform action
4. return result

Split functions that combine validation, persistence, notifications, and logging unless there is a strong reason not to.

### 3. Favor consistency
Use predictable structure across the codebase.

Be consistent with:
- indentation
- import ordering
- naming conventions
- file layout
- return patterns
- error handling

Consistency lowers cognitive load.

### 4. Avoid clever code
Do not compress logic just because the language allows it.

Prefer obvious code over dense code.

If a one-liner is harder to understand than a few explicit lines, use the explicit version.

### 5. Preserve logical flow
Code should read like a sequence of understandable steps.

A good structure often looks like:
1. validate
2. prepare
3. execute
4. return

Avoid jumping between unrelated concerns.

### 6. Use meaningful abstraction
Hide complexity behind interfaces that match domain intent.

Prefer:
- `create_user(user)`
- `fetch_invoice(invoice_id)`
- `archive_project(project_id)`

Over exposing low-level implementation unless necessary.

### 7. Comment why, not what
Use comments to explain intent, constraints, tradeoffs, or non-obvious decisions.

Good comments explain:
- why this exists
- why this approach was chosen
- what edge case is being handled
- what external constraint matters

Avoid comments that merely restate the code.

### 8. Make behavior predictable
Function names, module layout, and control flow should help the reader guess what happens before reading every line.

Readable code is unsurprising.

## Review Checklist
Before finalizing code, check:
- Are names explicit and meaningful?
- Does each function have a single clear responsibility?
- Is the structure consistent with nearby code?
- Is any part unnecessarily clever?
- Does the control flow read naturally?
- Are abstractions named around intent?
- Do comments explain why instead of what?
- Could another developer understand this in 30 seconds?

## Refactoring Heuristics
When improving readability:
- rename unclear variables and functions
- split large functions into focused helpers
- replace nested logic with guard clauses where appropriate
- separate domain logic from I/O or framework code
- extract repeated logic into well-named functions
- remove dead code and noisy comments
- prefer explicit intermediate variables when they improve clarity

## Output Standard
When writing or revising code with this skill:
- prioritize clarity over terseness
- preserve correctness and behavior
- improve names first
- simplify flow second
- add brief explanatory comments only where needed
- avoid unnecessary abstraction

## One-Line Test
A competent developer should be able to understand the code in about 30 seconds.
