---
description: "Reviews a finished Impeccable build against its direction contract, the approved comp, and the chosen world's quality bar, returning an ordered list of material fixes."
mode: subagent
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

Read the `developer_instructions` in `.agents/skills/impeccable/agents/impeccable_finish_reviewer.toml` and follow them as your role brief.
