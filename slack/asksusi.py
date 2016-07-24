import os
import config
import time
import requests
import urllib
from slackclient import SlackClient

botname = 'susi'
client_slack = SlackClient(config.slack_token['SLACK_TOKEN'])
#Token is kept in config.py. Please ask me for the token if you want it.

def bot_id():
	api_call = client_slack.api_call("users.list")
	if api_call.get('ok'):
		members = api_call.get('members')
		for user in members:
			if 'name' in user and user.get('name') == botname:
				return user.get('id')

def parse_data(slack_data):
	inputdata = slack_data
	if inputdata and len(inputdata) > 0:
		for data in inputdata:
			if data and 'text' in data and data['user']!=bot_id():
				return data['text'], data['channel']
	return None, None

def chat(inputcmd, channel):
	botid = "<@" + str(bot_id()) + ">:"
	if botid not in inputcmd:
		output = 'Please post messages mentioning susi in the beginning, like - \'@susi: Hello!\''
		client_slack.api_call("chat.postMessage", channel = channel, text = output, as_user = True)
		return
	r = requests.get('http://loklak.org/api/susi.json?q=' + urllib.quote_plus(inputcmd.encode('utf8')))
	try:
		output = r.json()['answers'][0]['actions'][0]['expression']
		client_slack.api_call("chat.postMessage", channel = channel, text = output, as_user = True)
	except:
		print("could not parse json")
		raise

def asksusi():
	if client_slack.rtm_connect():
		print("Connected")
		while True:
			inputcmd, channel = parse_data(client_slack.rtm_read())
			if inputcmd and channel:
				chat(inputcmd, channel)
			time.sleep(1)
	else:
		print("Connection failed")

if __name__ == '__main__':
	asksusi()
