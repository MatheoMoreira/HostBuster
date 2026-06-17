# Worker API — Contrat Abeille ↔ Lion

Spec de l'API HTTP que la **VM Lion** (worker Docker) doit exposer pour être pilotée par la **VM Abeille** (portail Laravel). Tout est en JSON. L'authentification se fait via un header `Authorization: Bearer <token>` partagé entre les deux VMs (variable `WORKER_API_TOKEN`).

## Conventions

- Toutes les routes sont préfixées par `/v1`.
- `instance_id` = ID interne (entier) renvoyé par l'API Abeille à la création.
- Les déploiements sont **asynchrones** : `POST /instances` retourne `202 Accepted` immédiatement, Lion notifie ensuite via un webhook quand l'état change.
- Les unités : CPU = nombre de vCPUs, RAM = Mo, storage = Go.

## Endpoints exposés par Lion

### `POST /v1/instances` — créer une instance

Requête :
```json
{
  "instance_id": 42,
  "app_type": "wordpress",        // wordpress | minecraft | odoo | glpi
  "hostname": "blog-marie",        // utilisé pour le sous-domaine: blog-marie.pt.filiere.info
  "cpu": 2,
  "ram": 2048,
  "storage": 10,
  "callback_url": "https://abeille.pt.filiere.info/api/worker/callback"
}
```
Réponse `202 Accepted` :
```json
{ "instance_id": 42, "status": "provisioning" }
```

### `GET /v1/instances/{id}` — état courant

Réponse `200` :
```json
{
  "instance_id": 42,
  "status": "running",              // provisioning | running | stopped | error | deleted
  "url": "https://blog-marie.pt.filiere.info",
  "ipv6": "2001:db8::1",
  "metrics": { "cpu_pct": 12.4, "ram_mb": 380 }
}
```

### `POST /v1/instances/{id}/start` — démarrer

Réponse `202` : `{ "status": "running" }` (ou `provisioning` si démarrage à chaud).

### `POST /v1/instances/{id}/stop` — arrêter

Réponse `202` : `{ "status": "stopped" }`.

### `PATCH /v1/instances/{id}` — modifier les ressources

Requête (champs optionnels) : `{ "cpu": 4, "ram": 4096, "storage": 20 }`
Réponse `202` : `{ "status": "updating" }`

### `DELETE /v1/instances/{id}` — supprimer

Réponse `202` : `{ "status": "deleting" }`

## Webhook appelé par Lion vers Abeille

`POST {callback_url}` (route Laravel `/api/worker/callback`) à chaque changement d'état :
```json
{
  "instance_id": 42,
  "status": "running",
  "url": "https://blog-marie.pt.filiere.info",
  "ipv6": "2001:db8::1",
  "error": null,                // rempli si status = "error"
  "occurred_at": "2026-06-17T14:32:01Z"
}
```
Header obligatoire : `Authorization: Bearer <token>` (même token, sens inverse).

## Codes d'erreur

- `400` payload invalide
- `401` token absent/incorrect
- `404` instance inconnue
- `409` hostname déjà pris
- `503` worker saturé (Abeille peut retry)

## Côté Abeille — mock pendant que Lion n'est pas prêt

Une implémentation `FakeWorkerClient` simule le cycle complet (provisioning → running après ~3s) pour permettre le développement bout en bout. Bascule via `WORKER_DRIVER=fake|http` dans `.env`.
