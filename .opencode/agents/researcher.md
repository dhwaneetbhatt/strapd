---
description: "Research a bounded question across repository files or primary documentation and return concise evidence."
mode: subagent
model: openai/gpt-6.1-terra#high
permissions:
  - action: subagent
    resource: "*"
    effect: deny
  - action: edit
    resource: "*"
    effect: deny
  - action: shell
    resource: "*"
    effect: deny
---

Read and follow `docs/agents/researcher.md` before starting the assignment.
