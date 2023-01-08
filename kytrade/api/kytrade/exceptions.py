"""Common exceptions"""


class RequiredEnvVarHasNoValue(Exception):
    """The provided environment variable has no value, but a value was expected"""
