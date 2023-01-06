"""Slack bot - currently this is an example piece showing how to read from and write
to a channel. Also can use Flask to set up a listener that responds to messages"""
import os

import slack
import slack.errors
from flask import Flask
from slackeventsapi import SlackEventAdapter


SLACK_TOKEN = os.environ["SLACK_TOKEN"]
SIGNING_SECRET = os.environ["SIGNING_SECRET"]
_CLIENT = None
_APP = None
_USER_ID_TO_USER_DATA_MAP = {}


def client():
    """Get the Slack api client"""
    global _CLIENT
    if not _CLIENT:
        _CLIENT = slack.WebClient(token=SLACK_TOKEN)
    return _CLIENT


def app():
    """Get the flask app for Slack"""
    global _APP
    if not _APP:
        _APP = Flask(__name__)
    return _APP


def send_text_message_to_channel(channel_name: str, text: str) -> None:
    """Send a message to a slack channel"""
    client().chat_postMessage(channel=channel_name, text=text)


# ----------------------------------------------------------------------------------- #
# below here are just experiments, not really meant to be used
# ----------------------------------------------------------------------------------- #

"""
slack_event_adapter = SlackEventAdapter(SIGNING_SECRET, '/slack/events', _APP)
@slack_event_adapter.on('message')
def message(payload):
    # Handle sent messages on slack
    event = payload.get('event', {})
    channel_id = event.get('channel')
    user_id = event.get('user')
    text = event.get('text')
    if text == "hi":
        client().chat_postMessage(channel=channel_id,text="oh, hello there!")
"""


def start_listener_dev_server():
    """ "Start the flask app in dev mode for the msg responding service"""
    client().chat_postMessage(channel="#kytrade", text="Starting app!")
    app().run(debug=True)


def get_channel_histories():
    """Return the full history of each channel the bot is added to"""
    result = client().conversations_list()
    channels = result["channels"]
    history = {}
    for channel in channels:
        # print(channel["name"])
        try:
            response = client().conversations_history(channel=channel["id"])
            history[channel["name"]] = response["messages"]
        except slack.errors.SlackApiError as err:
            continue
    return history


def get_username(user_id):
    """Get the name of a user from its id"""
    global _USER_ID_TO_USER_DATA_MAP
    if user_id not in _USER_ID_TO_USER_DATA_MAP:
        resp = client().users_profile_get(user_id=user_id)
        user = resp.data["profile"]
        _USER_ID_TO_USER_DATA_MAP[user_id] = user
    return _USER_ID_TO_USER_DATA_MAP[user_id]["real_name"]


def print_channel_histories():
    """Not really meant to be used - and example for the CLI code"""
    history = get_channel_histories()
    for channel_name in history:
        print(channel_name)
        messages = history[channel_name]
        for message in messages:
            sender = get_username(user_id=message["user"])
            text = message["text"]
            print(f"{sender}: {text}")
        print("---")
