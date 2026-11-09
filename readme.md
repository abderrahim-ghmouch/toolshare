## Manager user creation

`POST /api/managers/users` creates a regular user for one site managed by the
authenticated manager.

The authentication layer must populate `req.user._id` and ensure the caller is
authenticated. The API also verifies that this ID belongs to a manager and that
the requested site is assigned to that manager.

Request body:

```json
{
  "name": "Alex User",
  "email": "alex@example.com",
  "password": "secure-password",
  "siteId": "507f1f77bcf86cd799439011"
}
```

The optional `role` field is accepted only when set to `user`; requesting any
other role returns `403`. Managers cannot create admin or manager accounts.
Passwords are stored as bcrypt hashes. Successful requests return `201` with
the created user, excluding the password.

## Viewing assigned sites

`GET /api/managers/sites` returns the authenticated manager's assigned sites.
The authentication layer must populate `req.user._id`. Each site currently
exposes its ID, name, and creation/update timestamps.

## Active site and equipment catalog

`GET /api/sites/active` returns active sites with their active equipment.
Sites and equipment expose their ID, name, creation/update timestamps; each
equipment item also has a description. Sites created before the `active` field
was added are treated as active, while new sites and equipment are active by
default.

`GET /api/sites/:siteId/equipment` lists the active and available equipment at
one active site. It returns `400` for an invalid site ID and `404` when the
site does not exist or is inactive.

## Manager equipment management

All manager equipment routes use the authenticated manager from
`req.user._id` and are restricted to equipment at their assigned sites:

- `GET /api/managers/equipment` lists equipment, including inactive items.
- `POST /api/managers/equipment` creates equipment with a globally unique
  `reference`, `name`, `siteId`, and optional `description`.
- `GET /api/managers/equipment/:equipmentId` retrieves one item.
- `PATCH /api/managers/equipment/:equipmentId` updates `reference`, `name`,
  and/or `description`. Duplicate references return `409`.
- `PATCH /api/managers/equipment/:equipmentId/availability` updates the
  `available` boolean to take active equipment out of service or return it to
  service.
- `DELETE /api/managers/equipment/:equipmentId` deactivates the item without
  deleting its record.

Availability is separate from `active`: unavailable equipment remains in the
manager's equipment list but is excluded from the active public catalog.
Deactivated equipment cannot be returned to service through the availability
route.

## Administrator activity overview

`GET /api/admin/overview` returns every site, equipment item, and reservation,
including inactive sites/equipment. The authentication layer must populate
`req.user`; the route requires `req.user.role === 'admin'`. User passwords are
never included in the response.

Reservations reference a user, equipment item, and site, and include start/end
dates and one of these statuses: `pending`, `approved`, `rejected`,
`cancelled`, `completed`, or `checked_out`. The end date must be later than the
start date. The administrator overview includes handover time and manager.

## Recording equipment handover

`POST /api/managers/reservations/:reservationId/handover` records an approved
reservation's handover to its borrower. The authenticated manager must be
assigned to the reservation's site. A successful handover sets the reservation
status to `checked_out` and records `handedOverAt` and `handedOverBy`. Repeating
the handover or handing over a reservation that is not approved returns `409`.

`POST /api/managers/reservations/:reservationId/return` closes a checked-out
reservation. Send `{ "condition": "good" }` or
`{ "condition": "damaged" }`. The operation records `returnedAt`,
`returnedBy`, and `returnCondition`, and sets the reservation status to
`completed`. If damaged, the equipment is marked unavailable. The reservation
and equipment changes are committed together.

## Manager overdue loans and movement history

- `GET /api/managers/loans/overdue` lists checked-out reservations whose
  `endDate` is earlier than the current time, with borrower, equipment, site,
  due date, and handover details.
- `GET /api/managers/movements` lists handovers and returns for the manager's
  assigned sites, newest first. Return movements include the condition
  reported at return.

Both endpoints use `req.user._id`, require an existing manager account, and
only return records from that manager's assigned sites.

## Updating manager site assignments

`PUT /api/admin/managers/:managerId/sites` replaces a manager's assigned sites.
The authentication layer must populate `req.user`; only users with
`req.user.role === 'admin'` may call this endpoint.

Request body:

```json
{
  "siteIds": ["507f1f77bcf86cd799439011"]
}
```

An empty `siteIds` array removes all site assignments. Every ID must refer to
an existing site. The previous `PUT /api/managers/:managerId/sites` route
remains available as a backward-compatible admin-only alias.

## Personal loans and history

`GET /api/users/me/loans` returns the authenticated user's reservations in
three groups: `inPossession` (`checked_out`), `upcoming` (`pending` or
`approved`), and `history` (`completed`, `rejected`, or `cancelled`). Each
reservation includes its equipment and site, dates, status, handover/return
timestamps and managers, and the reported return condition. Results are
restricted to `req.user._id`.