# Architecture Diagrams

## Next.js App Router Structure

```mermaid
graph TD
  A[Root Layout] --> B[App Router]
  B --> C[Page Components]
  B --> D[Route Handlers]
  B --> E[Server Actions]
  C --> F[UI Components]
  D --> G[API Routes]
  E --> H[Auth & Rate Limiting]
  subgraph Departments
    D1[Safety]
    D2[Engineering]
    D3[Production]
    D4[Training]
  end
  G --> D1
  G --> D2
  G --> D3
  G --> D4
  style A fill:#f9f,stroke:#333
  style Departments fill:#bbf,stroke:#333
```

## Supabase Integration Patterns

```mermaid
graph TD
  I[Client Components] --> J[createClient()]
  I --> K[Supabase Client]
  J --> L[Browser Access]
  K --> L
  M[Server Components] --> N[createServerSupabaseClient()]
  N --> O[Cookie Sessions]
  O --> P[Server Actions]
  Q[Admin Operations] --> R[createAdminClient()]
  R --> S[Service Role]
  T[Redis Cache] --> U[Rate Limiting]
  T --> V[Telemetry Deduplication]
  T --> W[Health Checks]
  style I fill:#e6f7ff,stroke:#0056b3
  style M fill:#e6f7ff,stroke:#0056b3
  style Q fill:#e6f7ff,stroke:#0056b3
  style T fill:#f0f0f0,stroke:#666
```
