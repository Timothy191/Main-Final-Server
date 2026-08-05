# Arch System — Department Routes Index (`apps/portal/src/app/(departments)`)

Token-efficient map of all 12 department routes, access restrictions, and specification files.

## Department Routes Catalog

| Department Slug        | Route Segment Path                               | Restricted Roles (@repo/acl)                      | Specification                               | Primary Modules & Features                                    |
| :--------------------- | :----------------------------------------------- | :------------------------------------------------ | :------------------------------------------ | :------------------------------------------------------------ |
| `drilling`             | [`drilling`](./drilling)                         | Open                                              | [`SPEC.md`](./drilling/SPEC.md)             | Rig shift logs, blast design, bit depth telemetry             |
| `production`           | [`production`](./production)                     | Open                                              | [`SPEC.md`](./production/SPEC.md)           | Coal/waste tonnage, strip ratio, grade control samples        |
| `access-control`       | [`access-control`](./access-control)             | `access_control`, `admin` **(Restricted)**        | [`SPEC.md`](./access-control/SPEC.md)       | Gate security logs, visitor check-in, personnel counter       |
| `access-card-actions`  | [`access-card-actions`](./access-card-actions)   | `access-card-actions`, `access_control`, `admin`  | [`SPEC.md`](./access-card-actions/SPEC.md)  | Badge issuing, CUPS hardware printing, QR code generation     |
| `engineering`          | [`engineering`](./engineering)                   | Open                                              | [`SPEC.md`](./engineering/SPEC.md)          | Heavy equipment breakdown tracking, MTBF/MTTR, tire telemetry |
| `control-room`         | [`control-room`](./control-room)                 | `control_room_operator`, `admin` **(Restricted)** | [`SPEC.md`](./control-room/SPEC.md)         | SCADA live telemetry, hourly loads, excavator dig telemetry   |
| `safety`               | [`safety`](./safety)                             | Open                                              | [`SPEC.md`](./safety/SPEC.md)               | Incident management, Job Safety Analysis (JSA), LTI tracker   |
| `training`             | [`training`](./training)                         | Open                                              | [`SPEC.md`](./training/SPEC.md)             | LMS courses, certification alerts, instructor scheduling      |
| `satellite-monitoring` | [`satellite-monitoring`](./satellite-monitoring) | Open                                              | [`SPEC.md`](./satellite-monitoring/SPEC.md) | InSAR ground subsidence, SAR slope deformation maps           |
| `environment`          | [`environment`](./environment)                   | Open                                              | [`SPEC.md`](./environment/SPEC.md)          | Dust PM10/PM2.5, water turbidity, gas emissions               |
| `logistics-fleet`      | [`logistics-fleet`](./logistics-fleet)           | Open                                              | [`SPEC.md`](./logistics-fleet/SPEC.md)      | Haul truck GPS telemetry, fuel bay dispensing, fleet service  |
| `geology`              | [`geology`](./geology)                           | Open                                              | [`SPEC.md`](./geology/SPEC.md)              | Pit topography survey imports, seam block modeling            |
