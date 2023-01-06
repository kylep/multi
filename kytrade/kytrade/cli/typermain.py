import typer
from rich import print


debug = False
app = typer.Typer()


@app.callback()
def app_callback(debug: bool = typer.Option(False, "--debug", "-d", envvar="KT_DEBUG")):
    """Kytrade CLI"""
    if debug:
        print("-DEBUG MODE ON-")
        debug = True




@app.command()
def another():
    ...


@app.command()
def main(name: str, lastname: str = "",  formal: bool = False):
    """Example command

    --lastname is an optional string

    --formal is a boolean flag with --no-formal being the inverse
    """
    print(f"Hello [green]{name} {lastname}[/green] :tada:")


if __name__ == "__main__":
    app()

