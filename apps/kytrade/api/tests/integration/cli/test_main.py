"""Tests for the CLI entrypoint"""
from click.testing import CliRunner

import kytrade
from kytrade.cli.main import entrypoint

def test_version():
    """It should return the version from the module"""
    runner = CliRunner()
    result = runner.invoke(entrypoint, ["version"])
    assert result.exit_code == 0
    assert result.output.strip() == kytrade.__version__

def test_get_stocks():
    runner = CliRunner()
    result = runner.invoke(entrypoint, ["get-stocks", "spy"])
    assert result.exit_code == 0
    assert "1993-01-29" in result.output  # start date of SPY
