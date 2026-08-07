# Department Routes Map

How department slugs become routes and get gated at the edge. SSOT:
`packages/acl/src/index.ts`.

```mermaid
graph TD
    classDef acl fill:#1e293b,stroke:#0ea5e9,stroke-width:2px,color:#fff;
    classDef app fill:#1e293b,stroke:#a855f7,stroke-width:2px,color:#fff;

    ACL["@repo/acl: DEPARTMENT_ROUTE_SLUGS + RESTRICTED_DEPT_ROLES"]:::acl
    Employees["employees.accessible_departments"]
    Proxy["proxy.ts (edge)"]:::app
    Routes["app/(departments)/[department]/"]:::app
    Features["src/features/<domain>/ (hub, monitoring, departments, …)"]:::app

    Slug["/drilling · /production · /access-control · /engineering · /control-room · /safety · /training · /satellite-monitoring · /environment · /logistics-fleet · /geology"]:::acl

    ACL --> Slug
    Slug --> Proxy
    Employees --> Proxy
    Proxy -->|segment in accessible_departments| Routes
    Routes --> Features
```

## Rules

- Slugs and restricted roles live only in `@repo/acl`; both `proxy.ts` (edge)
  and `dept-access.ts` (node) import from there — never redefine the ACL
  inline.
- The logged-in employee's `accessible_departments` must include the
  `[department]` segment or the request is redirected / rejected.
- To add a department: add the slug to `DEPARTMENT_ROUTE_SLUGS` (and role to
  `RESTRICTED_DEPT_ROLES`), then build the route group under
  `app/(departments)/[department]/` with a thin wrapper delegating to a
  feature module.
