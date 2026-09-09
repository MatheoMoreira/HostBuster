# HostBuster Worker (VM Lion)

Agent qui reçoit les ordres de l'API HostBuster (Abeille) et déploie les
instances clients via `docker compose`, puis renvoie un callback.

## Prérequis sur Lion
- Docker + Docker Compose v2
- Le réseau Docker externe `proxy-network` et le reverse proxy (nginx-proxy
  + acme-companion) déjà en place — c'est ce que tes scripts utilisent déjà :
  ```bash
  docker network create proxy-network   # si pas déjà fait
  ```
- Python 3.11+

## Installation
```bash
sudo mkdir -p /root/hostbuster-worker
sudo cp app.py templates.py requirements.txt /root/hostbuster-worker/
cd /root/hostbuster-worker
sudo python3 -m venv venv
sudo ./venv/bin/pip install -r requirements.txt

# Configuration
sudo cp .env.example .env
sudo nano .env      # colle les jetons fournis + WORKER_PUBLIC_HOST

# Service
sudo cp hostbuster-worker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now hostbuster-worker
sudo systemctl status hostbuster-worker
curl -s localhost:8088/health      # -> {"ok":true}
```

## Exposer l'agent à l'API (Abeille)
L'agent écoute sur `127.0.0.1:8088`. Abeille doit pouvoir l'atteindre en HTTPS
sur l'URL configurée côté API (`WORKER_BASE_URL=https://worker.cpi-corporation.filiere.info`).
Choisis UNE option :

1. **Sous-domaine via ton reverse proxy** (recommandé) : crée un vhost
   `worker.cpi-corporation.filiere.info` qui proxie vers `127.0.0.1:8088`
   (Let's Encrypt). L'auth est déjà assurée par le jeton Bearer.
2. **Réseau privé / WireGuard** entre Abeille et Lion, puis
   `WORKER_BASE_URL=http://<ip-privée-lion>:8088` côté Abeille.

> ⚠️ Ne jamais exposer `8088` en clair sur Internet sans le proxy/TLS.

## Callback (Lion → Abeille)
L'agent appelle `callback_url` (fourni à chaque requête) =
`https://hostbuster.cpi-corporation.filiere.info/api/worker/callback`
avec le `WORKER_CALLBACK_TOKEN`. Rien à configurer, juste un accès sortant HTTPS.

## Notes
- **Minecraft** n'est pas du HTTP : accès via `<WORKER_PUBLIC_HOST>:<port>`,
  pas de sous-domaine ni de TLS.
- Chaque instance vit dans `/root/clients/inst-<id>/` (compose + meta.json).
- Sécurité : le hostname client n'est jamais injecté tel quel (slug + id).
