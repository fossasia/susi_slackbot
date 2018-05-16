var Slack = require('@slack/client');
var request = require('request');
const {CLIENT_EVENTS,WebClient } = require('slack/client');
var express = require('express');
var http = require('http');
var app = express();

var RtmClient = Slack.RtmClient;
var RTM_EVENTS = Slack.RTM_EVENTS;

var token = process.env.slackToken||config.slackToken;
var appData={};
var rtm = new RtmClient(token, { logLevel: 'info' });
rtm.start();
rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (connectData) => {
  // Cache the data necessary for this app in memory
  appData.selfId = connectData.self.id;
});
rtm.on(RTM_EVENTS.MESSAGE, function(message) {
  var channel = message.channel;
  var text=message.text;
  //send reply only when mentioned or in direct message
  if(text && message.user!==appData.selfId && (text.indexOf(appData.selfId)!==-1 || channel.startsWith('D'))){
  var options = {
        method: 'GET',
        url: 'https://api.susi.ai/susi/chat.json',
        qs: {
            timezoneOffset: '-330',
            q: text,
            language:"en"
        }
    };
//sending request to SUSI API for response
request(options, function(error, response, body) {
    if (error){
        msg = "Oops, looks like SUSI is taking a break, She will be back soon";
        rtm.sendMessage(msg, channel);
    } else {
      var msg;
      var actions=(JSON.parse(body)).answers[0].actions;
      actions.forEach(function(action) {
        var type=action.type;
         if (type==='table') {
            var tableData = (JSON.parse(body)).answers[0].data;
            var columnsObj=action.columns;
            var maxRows=100;
            let columns = Object.keys(columnsObj);
            var columnsData = Object.values(columnsObj);
            var msgs="";
            tableData.forEach(function(row,index) {
                if(row[columns[0]] && index<maxRows){
                    let msg = "*"+row[columns[0]]+"*" + ", " + row[columns[1]] + "\n" + row[columns[2]]+ "\n ";
                    msgs=msgs+msg;
                }
            });
            rtm.sendMessage(msgs, channel);
        } else if (type === 'rss'){
            var data = JSON.parse(body).answers[0].data;
            var columns = type[1];
            var key = Object.keys(columns);
            for (var i = 0; i < 4; i++) {
                if(i==0){
                    msg = (JSON.parse(body)).answers[0].actions[0].expression;
                    rtm.sendMessage(msg, channel);
                    console.log("check");
                } else{
                    msg = "";
                    msg =key[1].toUpperCase() + ": " + data[i][key[1]] + "\n" + key[2].toUpperCase() + ": " + data[i][key[2]] + "\n" + key[3].toUpperCase() + ": " + data[i][key[3]];
                    rtm.sendMessage(msg, channel);
                    console.log("check");
                }
            }
        }
        else{// for type answer
            msg = action.expression;
            rtm.sendMessage(msg, channel);
        }
    });
}
});
}
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`listening on ${port}`);
});