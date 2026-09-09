"""Agent worker HostBuster (VM Lion).

Expose l'API REST attendue par l'API HostBuster (HttpWorkerClient) :
  POST   /v1/instances              -> 202 {status:"provisioning"}  (provisionne en tâche de fond)
  GET    /v1/instances/{id}         -> 200 {status, url, ipv6}
  PATCH  /v1/instances/{id}         -> 202 {status}
  POST   /v1/instances/{id}/start   -> 202 {status:"running"}
  POST   /v1/instances/{id}/stop    -> 202 {status:"stopped"}
  DELETE /v1/instances/{id}         -> 204

Auth entrante : Authorization: Bearer $WORKER_API_TOKEN
Callback sortant vers l'API : Authorization: Bearer $WORKER_CALLBACK_TOKEN

Chaque instance vit dans  {CLIENTS_DIR}/inst-{id}/  avec un meta.json.
"""
import json
import os
import re
import secrets
import socket
import string
import subprocess
import time
from pathlib import Path

import httpx
from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel

from templates import TEMPLATES

# --- Configuration (via variables d'environnement) ---
API_TOKEN = os.environ["WORKER_API_TOKEN"]
CALLBACK_TOKEN = os.environ["WORKER_CALLBACK_TOKEN"]
CLIENTS_DIR = Path(os.environ.get("WORKER_CLIENTS_DIR", "/root/clients"))
BASE_DOMAIN = os.environ.get("WORKER_BASE_DOMAIN", "cpi-corporation.filiere.info")
PORT_RANGE_START = int(os.environ.get("WORKER_PORT_START", "20000"))
PORT_RANGE_END = int(os.environ.get("WORKER_PORT_END", "30000"))
# Hôte public de Lion (pour l'URL de secours et l'accès Minecraft)
PUBLIC_HOST = os.environ.get("WORKER_PUBLIC_HOST", "")
# Rétention des sauvegardes (RGPD : limitation de conservation).
# On garde au plus BACKUP_MAX_COUNT sauvegardes, et aucune de plus de
# BACKUP_MAX_AGE_DAYS jours. La purge est appliquée à chaque nouvelle sauvegarde.
BACKUP_MAX_COUNT = int(os.environ.get("WORKER_BACKUP_MAX_COUNT", "7"))
BACKUP_MAX_AGE_DAYS = int(os.environ.get("WORKER_BACKUP_MAX_AGE_DAYS", "30"))

app = FastAPI(title="HostBuster Worker")


# --- Auth ---
def require_token(authorization: str = Header(default="")):
    token = authorization.removeprefix("Bearer ").strip()
    if not token or not secrets.compare_digest(token, API_TOKEN):
        raise HTTPException(status_code=401, detail="Unauthorized")


# --- Modèles ---
class CreateBody(BaseModel):
    instance_id: int
    app_type: str
    hostname: str
    cpu: int
    ram: int
    storage: int
    callback_url: str


class UpdateBody(BaseModel):
    cpu: int | None = None
    ram: int | None = None
    storage: int | None = None


# --- Helpers ---
def inst_dir(instance_id: int) -> Path:
    return CLIENTS_DIR / f"inst-{instance_id}"


def safe_name(instance_id: int, hostname: str) -> str:
    """Nom de conteneur sûr, jamais d'injection : id + slug du hostname."""
    slug = re.sub(r"[^a-z0-9-]", "-", hostname.lower()).strip("-")[:30] or "app"
    return f"inst-{instance_id}-{slug}"


def read_meta(instance_id: int) -> dict | None:
    f = inst_dir(instance_id) / "meta.json"
    return json.loads(f.read_text()) if f.exists() else None


def write_meta(instance_id: int, meta: dict) -> None:
    d = inst_dir(instance_id)
    d.mkdir(parents=True, exist_ok=True)
    (d / "meta.json").write_text(json.dumps(meta, indent=2))


def used_ports() -> set[int]:
    ports = set()
    if CLIENTS_DIR.exists():
        for m in CLIENTS_DIR.glob("inst-*/meta.json"):
            try:
                ports.add(json.loads(m.read_text()).get("port"))
            except Exception:
                pass
    return {p for p in ports if p}


def free_port(start: int | None = None) -> int:
    taken = used_ports()
    begin = start or PORT_RANGE_START
    for port in range(begin, PORT_RANGE_END):
        if port in taken:
            continue
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", port)) != 0:  # personne n'écoute
                return port
    raise RuntimeError("Aucun port libre")


def prepare_dirs(app_type: str, d) -> None:
    """Crée les sous-dossiers de données et applique les droits attendus."""
    if app_type == "odoo":
        for sub in ("odoo_data", "addons", "db_data"):
            (d / sub).mkdir(parents=True, exist_ok=True)
        # Odoo tourne en uid 101
        subprocess.run(["chown", "-R", "101:101", str(d / "odoo_data"), str(d / "addons")])
    elif app_type == "glpi":
        for sub in ("glpi_data", "db_data"):
            (d / sub).mkdir(parents=True, exist_ok=True)
        subprocess.run(["chmod", "-R", "777", str(d)])


# Sous-dossiers de données à sauvegarder par type d'app.
DATA_DIRS = {
    "wordpress": ["db_data", "wp_data"],
    "odoo": ["odoo_data", "addons", "db_data"],
    "glpi": ["glpi_data", "db_data"],
    "minecraft": ["data"],
}

# Nom de sauvegarde autorisé : aucune échappatoire de chemin possible.
BACKUP_RE = re.compile(r"^backup-\d{8}-\d{6}\.tar\.gz$")


def backups_dir(instance_id: int) -> Path:
    d = inst_dir(instance_id) / "backups"
    d.mkdir(parents=True, exist_ok=True)
    return d


def list_backups(instance_id: int) -> list[dict]:
    d = inst_dir(instance_id) / "backups"
    if not d.exists():
        return []
    out = []
    for f in sorted(d.glob("backup-*.tar.gz"), reverse=True):
        st = f.stat()
        out.append({"name": f.name, "size_bytes": st.st_size, "created_at": int(st.st_mtime)})
    return out


def create_backup(instance_id: int, app_type: str) -> dict:
    from datetime import datetime
    dirs = [s for s in DATA_DIRS.get(app_type, []) if (inst_dir(instance_id) / s).exists()]
    if not dirs:
        raise RuntimeError("aucune donnée à sauvegarder")
    name = f"backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.tar.gz"
    dest = backups_dir(instance_id) / name
    res = subprocess.run(
        ["tar", "-czf", str(dest), "-C", str(inst_dir(instance_id)), *dirs],
        capture_output=True, text=True,
    )
    if res.returncode != 0:
        dest.unlink(missing_ok=True)
        raise RuntimeError(res.stderr.strip()[:300])
    prune_backups(instance_id)
    st = dest.stat()
    return {"name": name, "size_bytes": st.st_size, "created_at": int(st.st_mtime)}


def prune_backups(instance_id: int) -> int:
    """Applique la politique de rétention : supprime les sauvegardes trop
    vieilles (> BACKUP_MAX_AGE_DAYS) puis, s'il en reste trop, ne garde que les
    BACKUP_MAX_COUNT plus récentes. Renvoie le nombre de fichiers purgés."""
    d = inst_dir(instance_id) / "backups"
    if not d.exists():
        return 0
    files = sorted(d.glob("backup-*.tar.gz"), key=lambda f: f.stat().st_mtime, reverse=True)
    cutoff = time.time() - BACKUP_MAX_AGE_DAYS * 86400
    purged = 0
    kept = []
    for f in files:
        if f.stat().st_mtime < cutoff:
            f.unlink(missing_ok=True)
            purged += 1
        else:
            kept.append(f)
    for f in kept[BACKUP_MAX_COUNT:]:
        f.unlink(missing_ok=True)
        purged += 1
    return purged


def restore_backup(instance_id: int, app_type: str, name: str) -> None:
    if not BACKUP_RE.match(name):
        raise RuntimeError("nom de sauvegarde invalide")
    src = inst_dir(instance_id) / "backups" / name
    if not src.exists():
        raise RuntimeError("sauvegarde introuvable")
    # Arrêt, purge des données, restauration, redémarrage.
    compose(instance_id, "stop")
    for sub in DATA_DIRS.get(app_type, []):
        subprocess.run(["rm", "-rf", str(inst_dir(instance_id) / sub)])
    res = subprocess.run(
        ["tar", "-xzf", str(src), "-C", str(inst_dir(instance_id))],
        capture_output=True, text=True,
    )
    if res.returncode != 0:
        raise RuntimeError(res.stderr.strip()[:300])
    compose(instance_id, "start")


def delete_backup(instance_id: int, name: str) -> None:
    if not BACKUP_RE.match(name):
        raise RuntimeError("nom de sauvegarde invalide")
    (inst_dir(instance_id) / "backups" / name).unlink(missing_ok=True)


def random_subdomain() -> str:
    sub = "".join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(12))
    return f"{sub}.{BASE_DOMAIN}"


def compose(instance_id: int, *args) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["docker", "compose", *args],
        cwd=str(inst_dir(instance_id)),
        capture_output=True, text=True,
    )


def server_ipv6() -> str | None:
    try:
        out = subprocess.run(
            ["bash", "-lc", "ip -6 addr show scope global | awk '/inet6/{print $2}' | cut -d/ -f1 | head -1"],
            capture_output=True, text=True,
        )
        return out.stdout.strip() or None
    except Exception:
        return None


def wait_until_ready(name: str, port: int, is_http: bool, timeout: int = 180) -> bool:
    """Attend que l'application réponde réellement avant de la déclarer 'running'.

    - HTTP : on sonde le port publié en local jusqu'à une réponse < 500.
    - Minecraft : on attend le healthcheck Docker (ou à défaut une connexion TCP).
    """
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if is_http:
            try:
                r = httpx.get(f"http://127.0.0.1:{port}/", timeout=5, follow_redirects=False)
                if r.status_code < 500:
                    print(f"[ready] {name} http={r.status_code} sur :{port}", flush=True)
                    return True
            except Exception:
                pass
        else:
            insp = subprocess.run(
                ["docker", "inspect", "--format", "{{.State.Health.Status}}", name],
                capture_output=True, text=True,
            )
            health = insp.stdout.strip()
            if health == "healthy":
                print(f"[ready] {name} healthy", flush=True)
                return True
            if health in ("", "<no value>", "none"):  # pas de healthcheck -> TCP
                with socket.socket() as s:
                    s.settimeout(3)
                    if s.connect_ex(("127.0.0.1", port)) == 0:
                        print(f"[ready] {name} tcp :{port}", flush=True)
                        return True
        time.sleep(3)
    print(f"[ready] {name} TIMEOUT après {timeout}s", flush=True)
    return False


def send_callback(callback_url: str, payload: dict) -> None:
    try:
        r = httpx.post(
            callback_url,
            json=payload,
            headers={"Authorization": f"Bearer {CALLBACK_TOKEN}"},
            timeout=10,
        )
        print(f"[callback] -> {callback_url} status={payload.get('status')} http={r.status_code} body={r.text[:200]}", flush=True)
    except Exception as e:  # le callback ne doit jamais planter le worker
        print(f"[callback] ÉCHEC vers {callback_url}: {e}", flush=True)


# --- Provisioning (tâche de fond) ---
def provision(body: CreateBody) -> None:
    print(f"[provision] start instance={body.instance_id} app={body.app_type} callback={body.callback_url}", flush=True)
    meta = read_meta(body.instance_id) or {}
    try:
        gen, is_http, base_port = TEMPLATES[body.app_type]
        name = safe_name(body.instance_id, body.hostname)
        port = meta.get("port") or free_port(base_port)
        domain = meta.get("domain") or random_subdomain()
        db_pw = meta.get("db_pw") or secrets.token_urlsafe(16)

        d = inst_dir(body.instance_id)
        d.mkdir(parents=True, exist_ok=True)
        prepare_dirs(body.app_type, d)
        (d / "compose.yaml").write_text(
            gen(name, port, domain, body.cpu, body.ram, db_pw)
        )

        if is_http:
            url = f"https://{domain}"
        else:  # minecraft : accès TCP direct (IPv6 entre crochets)
            host = PUBLIC_HOST or domain
            host = f"[{host}]" if ":" in host else host
            url = f"{host}:{port}"

        meta.update({
            "instance_id": body.instance_id, "app_type": body.app_type,
            "name": name, "port": port, "domain": domain, "db_pw": db_pw,
            "url": url, "is_http": is_http, "status": "provisioning",
            "callback_url": body.callback_url,
        })
        write_meta(body.instance_id, meta)

        print(f"[provision] docker compose up (port={port}, domain={domain})", flush=True)
        res = compose(body.instance_id, "up", "-d")
        print(f"[provision] compose rc={res.returncode} err={res.stderr.strip()[:300]}", flush=True)
        if res.returncode != 0:
            raise RuntimeError(res.stderr.strip()[:500])

        # On n'annonce 'running' que lorsque l'app répond vraiment (sinon le
        # client quitte l'écran de chargement et tombe sur "site inaccessible").
        print(f"[provision] attente readiness ({body.app_type})...", flush=True)
        wait_until_ready(name, port, is_http)

        meta["status"] = "running"
        write_meta(body.instance_id, meta)
        send_callback(body.callback_url, {
            "instance_id": body.instance_id, "status": "running",
            "url": url, "ipv6": server_ipv6(),
        })
    except Exception as e:
        # Nettoyage du déploiement partiel (conteneurs + réseau créés avant l'échec).
        print(f"[provision] échec, nettoyage: {e}", flush=True)
        compose(body.instance_id, "down", "-v")
        meta["status"] = "error"
        write_meta(body.instance_id, meta)
        send_callback(body.callback_url, {
            "instance_id": body.instance_id, "status": "error", "error": str(e)[:500],
        })


# --- Endpoints ---
@app.post("/v1/instances", status_code=202, dependencies=[Depends(require_token)])
def create(body: CreateBody, bg: BackgroundTasks):
    if body.app_type not in TEMPLATES:
        raise HTTPException(status_code=422, detail=f"app_type inconnu: {body.app_type}")
    write_meta(body.instance_id, {
        "instance_id": body.instance_id, "app_type": body.app_type,
        "status": "provisioning", "callback_url": body.callback_url,
    })
    bg.add_task(provision, body)
    return {"status": "provisioning"}


@app.get("/v1/instances/{instance_id}", dependencies=[Depends(require_token)])
def get(instance_id: int):
    meta = read_meta(instance_id)
    if not meta:
        raise HTTPException(status_code=404, detail="introuvable")
    return {"status": meta.get("status"), "url": meta.get("url"), "ipv6": server_ipv6()}


@app.patch("/v1/instances/{instance_id}", status_code=202, dependencies=[Depends(require_token)])
def update(instance_id: int, body: UpdateBody, bg: BackgroundTasks):
    meta = read_meta(instance_id)
    if not meta:
        raise HTTPException(status_code=404, detail="introuvable")
    # Re-génère le compose avec les nouvelles ressources puis redéploie.
    create_body = CreateBody(
        instance_id=instance_id, app_type=meta["app_type"], hostname=meta["name"],
        cpu=body.cpu or 1, ram=body.ram or 1024, storage=body.storage or 10,
        callback_url=meta["callback_url"],
    )
    bg.add_task(provision, create_body)
    return {"status": "provisioning"}


def _async_compose(instance_id: int, action: str, final_status: str) -> None:
    res = compose(instance_id, action)
    print(f"[{action}] instance={instance_id} rc={res.returncode} err={res.stderr.strip()[:200]}", flush=True)
    _set_status(instance_id, final_status)


@app.post("/v1/instances/{instance_id}/start", status_code=202, dependencies=[Depends(require_token)])
def start(instance_id: int, bg: BackgroundTasks):
    if not read_meta(instance_id):
        raise HTTPException(status_code=404, detail="introuvable")
    bg.add_task(_async_compose, instance_id, "start", "running")
    return {"status": "running"}


@app.post("/v1/instances/{instance_id}/stop", status_code=202, dependencies=[Depends(require_token)])
def stop(instance_id: int, bg: BackgroundTasks):
    if not read_meta(instance_id):
        raise HTTPException(status_code=404, detail="introuvable")
    bg.add_task(_async_compose, instance_id, "stop", "stopped")
    return {"status": "stopped"}


@app.delete("/v1/instances/{instance_id}", status_code=204, dependencies=[Depends(require_token)])
def delete(instance_id: int):
    meta = read_meta(instance_id)
    if meta:
        compose(instance_id, "down", "-v")
        subprocess.run(["rm", "-rf", str(inst_dir(instance_id))])
    return None


def _set_status(instance_id: int, status: str) -> None:
    meta = read_meta(instance_id)
    if meta:
        meta["status"] = status
        write_meta(instance_id, meta)


def _parse_pct(s: str) -> float | None:
    """'12.34%' -> 12.34"""
    try:
        return float(s.strip().rstrip("%"))
    except Exception:
        return None


def _parse_mem(s: str) -> tuple[float, float] | None:
    """'123.4MiB / 1GiB' -> (mb_used, mb_limit)"""
    try:
        used, limit = [p.strip() for p in s.split("/")]
        return _to_mb(used), _to_mb(limit)
    except Exception:
        return None


def _to_mb(s: str) -> float:
    units = {"B": 1 / 1_048_576, "KiB": 1 / 1024, "KB": 1 / 1024,
             "MiB": 1, "MB": 1, "GiB": 1024, "GB": 1024, "TiB": 1_048_576}
    for unit, factor in sorted(units.items(), key=lambda x: -len(x[0])):
        if s.endswith(unit):
            return float(s[:-len(unit)].strip()) * factor
    return float(s)


@app.get("/v1/instances/{instance_id}/metrics", dependencies=[Depends(require_token)])
def metrics(instance_id: int):
    meta = read_meta(instance_id)
    if not meta:
        raise HTTPException(status_code=404, detail="introuvable")
    base = meta.get("name")
    if not base:
        raise HTTPException(status_code=409, detail="conteneur inconnu")

    # Le conteneur applicatif a un suffixe selon le template (-app pour WP/Odoo/GLPI, -mc pour Minecraft).
    suffix = "-mc" if meta.get("app_type") == "minecraft" else "-app"
    name = f"{base}{suffix}"

    stats = subprocess.run(
        ["docker", "stats", "--no-stream", "--format",
         "{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}", name],
        capture_output=True, text=True,
    )
    inspect = subprocess.run(
        ["docker", "inspect", "--format",
         "{{.State.Running}}|{{.State.StartedAt}}", name],
        capture_output=True, text=True,
    )

    if inspect.returncode != 0:
        return {"available": False, "reason": "container_not_found"}

    running_str, started_at = (inspect.stdout.strip().split("|", 1) + [""])[:2]
    running = running_str.strip().lower() == "true"

    cpu_pct = mem_used = mem_limit = mem_pct = None
    if stats.returncode == 0 and stats.stdout.strip():
        parts = stats.stdout.strip().split("|")
        if len(parts) >= 3:
            cpu_pct = _parse_pct(parts[0])
            mem = _parse_mem(parts[1])
            if mem:
                mem_used, mem_limit = mem
            mem_pct = _parse_pct(parts[2])

    # Disque : taille agrégée des données de l'instance (bind-mounts dans inst_dir).
    disk_used_mb = None
    try:
        du = subprocess.run(
            ["du", "-sb", str(inst_dir(instance_id))],
            capture_output=True, text=True, timeout=5,
        )
        if du.returncode == 0:
            disk_used_mb = int(du.stdout.split()[0]) / 1_048_576
    except Exception:
        pass

    uptime = None
    if running and started_at:
        try:
            from datetime import datetime, timezone
            t = datetime.fromisoformat(started_at.replace("Z", "+00:00"))
            uptime = int((datetime.now(timezone.utc) - t).total_seconds())
        except Exception:
            pass

    return {
        "available": True,
        "running": running,
        "cpu_pct": cpu_pct,
        "mem_used_mb": mem_used,
        "mem_limit_mb": mem_limit,
        "mem_pct": mem_pct,
        "disk_used_mb": disk_used_mb,
        "started_at": started_at or None,
        "uptime_seconds": uptime,
    }


@app.get("/v1/instances/{instance_id}/backups", dependencies=[Depends(require_token)])
def backups_index(instance_id: int):
    if not read_meta(instance_id):
        raise HTTPException(status_code=404, detail="introuvable")
    return {"backups": list_backups(instance_id)}


@app.post("/v1/instances/{instance_id}/backups", dependencies=[Depends(require_token)])
def backups_create(instance_id: int):
    meta = read_meta(instance_id)
    if not meta:
        raise HTTPException(status_code=404, detail="introuvable")
    try:
        return create_backup(instance_id, meta.get("app_type", ""))
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e)[:300])


@app.post("/v1/instances/{instance_id}/backups/{name}/restore", dependencies=[Depends(require_token)])
def backups_restore(instance_id: int, name: str):
    meta = read_meta(instance_id)
    if not meta:
        raise HTTPException(status_code=404, detail="introuvable")
    try:
        restore_backup(instance_id, meta.get("app_type", ""), name)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e)[:300])
    _set_status(instance_id, "running")
    return {"status": "running"}


@app.delete("/v1/instances/{instance_id}/backups/{name}", status_code=204, dependencies=[Depends(require_token)])
def backups_delete(instance_id: int, name: str):
    if not read_meta(instance_id):
        raise HTTPException(status_code=404, detail="introuvable")
    try:
        delete_backup(instance_id, name)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e)[:300])
    return None


@app.get("/health")
def health():
    return {"ok": True}
