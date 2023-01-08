"""Flask app entrypoint"""
import kytrade
from flask import Flask

app = Flask(__name__)


def index() -> tuple[dict, int]:
    """index view hosted at /"""
    return {"version": kytrade.__version__}, 200

def version() -> tuple[dict, int]:
    """index view hosted at /"""
    return {"version": kytrade.__version__}, 200


def live() -> tuple[dict, int]:
    """Liveness check or /_live"""
    return {"status": "OK"}, 200


app.add_url_rule("/", view_func=index, methods=["GET"])
app.add_url_rule("/app", view_func=index, methods=["GET"])
app.add_url_rule("/version", view_func=version, methods=["GET"])
app.add_url_rule("/_live", view_func=live, methods=["GET"])
