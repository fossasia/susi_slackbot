var Slack = require('@slack/client');
var request = require('request');
var express = require('express');
var http = require('http');
var app = express();

var RtmClient = Slack.RtmClient;
var RTM_EVENTS = Slack.RTM_EVENTS;

var token = process.env.token;

var rtm = new RtmClient(token, { logLevel: 'info' });
rtm.start();

rtm.on(RTM_EVENTS.MESSAGE, function(message) {
  var channel = message.channel;

  var options = {
        method: 'GET',
        url: 'http://api.asksusi.com/susi/chat.json',
        qs: {
            timezoneOffset: '-330',
            q: message.text
        }
    };
//sending request to SUSI API for response
    request(options, function(error, response, body) {
        if (error){
            msg = "Oops, looks like SUSI is taking a break, She will be back soon";
            rtm.sendMessage(msg, channel);
        } else {
        
            var type = (JSON.parse(body)).answers[0].actions;
		    var msg;
            if (type.length == 1 && type[0].type == "answer") {
                msg = (JSON.parse(body)).answers[0].actions[0].expression;
                rtm.sendMessage(msg, channel);
            } else if (type.length == 1 && type[0].type == "table") {
                var data = (JSON.parse(body)).answers[0].data;
                var columns = type[0].columns;
                var key = Object.keys(columns);
                var count = (JSON.parse(body)).answers[0].metadata.count;

                for (var i = 0; i < count ; i++) {
                    msg = key[0].toUpperCase() + ": " + data[i][key[0]] + "\n" + key[1].toUpperCase() + ": " + data[i][key[1]] + "\n" + key[2].toUpperCase() + ": " + data[i][key[2]];
                    rtm.sendMessage(msg, channel);
                }
            } else if (type.length == 2 && type[1].type == "rss"){
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
        }
    })
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening on ${port}`);
});
