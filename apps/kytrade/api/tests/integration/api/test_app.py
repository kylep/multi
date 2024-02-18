"""Test the base api routes"""
import kytrade
import kytrade.api.app as app


def test_index():
    """Test the index route"""
    test_app = app.app.test_client()
    response = test_app.get('/')
    resp_json = response.json
    assert resp_json["version"] == kytrade.__version__
