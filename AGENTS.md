<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ClashLingo Agent Handoff Rules

Before making code changes:
- Read `PROJECT_STATUS.md` first.
- Read `TASK_QUEUE.md` next.
- Read the latest `ClashLingo-Session-Summary.md` if it exists.
- Preserve the existing stack: Next.js App Router, React 19, Tailwind CSS 4, Supabase, Anthropic API.
- Preserve the current visual direction: playful minimalism, rounded shapes, primary `#953f4d`, secondary `#0c693d`.
- Prefer updating existing components in `components/` instead of rewriting routes from scratch.

When finishing work:
- Update `PROJECT_STATUS.md` if architecture, health, or known issues changed.
- Update `TASK_QUEUE.md` if priorities changed or a task moved.
- Refresh `ClashLingo-Session-Summary.md` with what was done, what is blocked, and what should happen next.
- Run at least one verification command (`npm run lint` or `npm run build`) and record the real result.

Current source of truth:
- Product status and architecture: `PROJECT_STATUS.md`
- Prioritized backlog: `TASK_QUEUE.md`
- Session-to-session baton pass: `ClashLingo-Session-Summary.md`
