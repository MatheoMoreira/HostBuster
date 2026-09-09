"""Générateurs de compose.yaml par application.

Reproduisent fidèlement les scripts deploy-*.sh de l'équipe (images,
variables, volumes, réseaux, ports de base), avec deux ajouts assumés :
- limites de ressources `cpus`/`mem_limit` (les plans HostBuster vendent
  du CPU/RAM, sinon les paliers n'auraient aucun effet) ;
- pour Odoo, `VIRTUAL_PORT` = 8069 (port INTERNE du conteneur) au lieu du
  port hôte : nécessaire pour que le proxy route correctement au-delà de
  la 1re instance.

Chaque générateur reçoit (name, port, domain, cpu, ram_mb, db_pw) et
renvoie le YAML + le port de base recommandé pour ce type d'app.
"""

PROXY_NETWORK = "proxy-network"


def _limits(cpu: int, ram_mb: int) -> str:
    return f'    cpus: "{cpu}"\n    mem_limit: {ram_mb}m'


def wordpress(name: str, port: int, domain: str, cpu: int, ram: int, db_pw: str) -> str:
    return f"""services:
  db:
    image: mariadb:10.11
    container_name: {name}-db
    command: '--default-authentication-plugin=mysql_native_password'
    volumes:
      - ./db_data:/var/lib/mysql
    restart: unless-stopped
    environment:
      - MYSQL_ROOT_PASSWORD=somewordpress
      - MYSQL_DATABASE=wordpress
      - MYSQL_USER=wordpress
      - MYSQL_PASSWORD=wordpress
    networks:
      - wp-network

  wordpress:
    image: wordpress:latest
    container_name: {name}-app
    ports:
      - "{port}:80"
    restart: unless-stopped
    environment:
      - WORDPRESS_DB_HOST=db
      - WORDPRESS_DB_USER=wordpress
      - WORDPRESS_DB_PASSWORD=wordpress
      - WORDPRESS_DB_NAME=wordpress
      - VIRTUAL_HOST={domain}
      - LETSENCRYPT_HOST={domain}
    volumes:
      - ./wp_data:/var/www/html
{_limits(cpu, ram)}
    networks:
      - wp-network
      - {PROXY_NETWORK}

networks:
  wp-network:
  {PROXY_NETWORK}:
    external: true
"""


def odoo(name: str, port: int, domain: str, cpu: int, ram: int, db_pw: str) -> str:
    return f"""services:
  db:
    image: postgres:15
    container_name: {name}-db
    environment:
      - POSTGRES_DB=postgres
      - POSTGRES_PASSWORD=odoo
      - POSTGRES_USER=odoo
    volumes:
      - ./db_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - odoo-network

  odoo:
    image: odoo:17
    container_name: {name}-app
    depends_on:
      - db
    ports:
      - "{port}:8069"
    tty: true
    environment:
      - HOST=db
      - USER=odoo
      - PASSWORD=odoo
      - VIRTUAL_HOST={domain}
      - VIRTUAL_PORT=8069
      - LETSENCRYPT_HOST={domain}
    volumes:
      - ./odoo_data:/var/lib/odoo
      - ./addons:/mnt/extra-addons
{_limits(cpu, ram)}
    restart: unless-stopped
    networks:
      - odoo-network
      - {PROXY_NETWORK}

networks:
  odoo-network:
  {PROXY_NETWORK}:
    external: true
"""


def glpi(name: str, port: int, domain: str, cpu: int, ram: int, db_pw: str) -> str:
    return f"""services:
  db:
    image: mariadb:10.11
    container_name: {name}-db
    environment:
      - MYSQL_ROOT_PASSWORD=glpiroot
      - MYSQL_DATABASE=glpidb
      - MYSQL_USER=glpiuser
      - MYSQL_PASSWORD=glpipass
    volumes:
      - ./db_data:/var/lib/mysql
    restart: unless-stopped
    networks:
      - glpi-network

  glpi:
    image: elestio/glpi:latest
    container_name: {name}-app
    depends_on:
      - db
    ports:
      - "{port}:80"
    environment:
      - GLPI_DB_HOST=db
      - GLPI_DB_NAME=glpidb
      - GLPI_DB_USER=glpiuser
      - GLPI_DB_PASSWORD=glpipass
      - VIRTUAL_HOST={domain}
      - LETSENCRYPT_HOST={domain}
    volumes:
      - ./glpi_data:/var/www/html
{_limits(cpu, ram)}
    restart: unless-stopped
    networks:
      - glpi-network
      - {PROXY_NETWORK}

networks:
  glpi-network:
  {PROXY_NETWORK}:
    external: true
"""


def minecraft(name: str, port: int, domain: str, cpu: int, ram: int, db_pw: str) -> str:
    # Minecraft : réseau hôte (TCP brut), pas de proxy ni TLS. RCON = port+1000.
    rcon = port + 1000
    return f"""services:
  mc:
    image: itzg/minecraft-server:latest
    container_name: {name}-mc
    network_mode: "host"
    tty: true
    stdin_open: true
    environment:
      EULA: "TRUE"
      ONLINE_MODE: "FALSE"
      VERSION: "1.20.4"
      MEMORY: "{ram}M"
      SERVER_PORT: "{port}"
      RCON_PORT: "{rcon}"
    volumes:
      - ./data:/data
{_limits(cpu, ram)}
    restart: unless-stopped
"""


# app_type -> (générateur, est_http, port_de_base)
TEMPLATES = {
    "wordpress": (wordpress, True, 8080),
    "odoo": (odoo, True, 8069),
    "glpi": (glpi, True, 8085),
    "minecraft": (minecraft, False, 25565),
}
