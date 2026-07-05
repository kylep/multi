"""Constants and environment variable checks"""
import os
import sys

import kytrade.exceptions as exceptions


def env_var(env_var_name:str, default:str, required: bool = False):
    """Return an environment variable if it exists else a default"""
    if required and env_var_name not in os.environ:
        raise(exceptions.RequiredEnvVarHasNoValue(env_var_name))
    val = os.environ[env_var_name] if env_var_name in os.environ else default
    if str(val).upper() == "TRUE":
        val = True
    if str(val).upper() == "FALSE":
        val = False
    return val


# General
VERSION = "2.0.0"
DEBUG = env_var("KT_DEBUG", 'true')

# Database
SQLA_DRIVER = env_var("SQLA_DRIVER", "postgresql")
SQLA_ECHO = env_var("SQLA_ECHO", False)
SQL_HOST = env_var("POSTGRES_HOST", "127.0.0.1")
SQL_PORT = env_var("POSTGRES_PORT", 5432)
SQL_USER = env_var("POSTGRES_USER", "kytrade")
SQL_PASS = env_var("POSTGRES_PASSWORD", None, required=True)
SQL_DATABASE = env_var("DATABASE_NAME", "kytrade")
SQL_CONN_STRING = (
    f"{SQLA_DRIVER}://"
    f"{SQL_USER}:{SQL_PASS}"
    f"@{SQL_HOST}:{SQL_PORT}"
    f"/{SQL_DATABASE}"
)
