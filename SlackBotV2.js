
function fetchUserPresence(slackToken, userId) {
  const presenceResponse = UrlFetchApp.fetch(`https://slack.com/api/users.getPresence?user=${userId}`, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + slackToken,
    },
  });

  const presenceData = JSON.parse(presenceResponse.getContentText());

  if (!presenceData.ok) {
    Logger.log(`Error fetching presence for user ${userId}: ` + presenceData.error);
    return;
  }
   return presenceData.presence; 
}


function checkUnreadMessagesAndSendWhenActive() {
   const slackToken = 'User Token Scopes'; // need change
  const gmailUser = 'send Gmail'; // need change
  const userId = 'Slack Chart User ID'; // need change
  var isActive = fetchUserPresence(slackToken, userId);
  var now = new Date();
  var hours = now.getHours();
  var minutes = now.getMinutes();
  Logger.log('state is ' + isActive + ', now time is ' + hours + ':' + minutes);
  if (isActive == 'active' || (hours < 9 || hours >= 20) || (hours == 12 && minutes <= 30 ) || (hours == 13) || (hours == 19 && minutes <= 30)) {
    Logger.log('Slack status is active or time is true. No message will be sent.');
    PropertiesService.getScriptProperties().setProperty('lastTimestamp',  Math.floor(now.getTime() / 1000).toString());
    
    Logger.log('lastTimestamp changed: ' + PropertiesService.getScriptProperties().getProperty('lastTimestamp'));
    return; 
  } else {
    Logger.log('Last Seen time is ' + PropertiesService.getScriptProperties().getProperty(`lastTimestamp`) || '0');
    fetchUnreadDirectMessages(slackToken, gmailUser, userId);
    fetchUnreadChannelMessages(slackToken, gmailUser, userId);
  }

}

function fetchUnreadDirectMessages(slackToken, gmailUser, mention) {
 
  var dms = ['dmChannelID']; // need change

    var lastTimestamp = Number(PropertiesService.getScriptProperties().getProperty('lastTimestamp')) || 0;
  dms.forEach(function(dm) {
    var dmHistoryUrl = `https://slack.com/api/conversations.history?channel=${dm}&unread=true&limit=20`;

    var dmResponse = UrlFetchApp.fetch(dmHistoryUrl, {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + slackToken
      }
    });

    var messageData = JSON.parse(dmResponse.getContentText());

    if (!messageData.ok) {
      Logger.log('Error fetching unread messages for DM channel ' + dm + ': ' + messageData.error);
      return;
    }

    var messages = messageData.messages;
     if (messages[0] != null) {
        if (messages[0].ts > lastTimestamp && messages[0].user != mention  && messages[0].user == 'U078BNMP0PK') {
            sendEmail(gmailUser);
        }
    } else {
        Logger.log('no message');
      }
  });
}

function fetchUnreadChannelMessages(slackToken, gmailUser, mention) {
  

  var channels = ['Private or Public Channel ID']; // need change
    var lastTimestamp = PropertiesService.getScriptProperties().getProperty(`lastTimestamp`) || '0';

  channels.forEach(function(channel) {
    var channelHistoryUrl = `https://slack.com/api/conversations.history?channel=${channel}&unread=true&limit=20`;

    var channelResponse = UrlFetchApp.fetch(channelHistoryUrl, {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + slackToken
      }
    });

    var messageData = JSON.parse(channelResponse.getContentText());

    if (!messageData.ok) {
      Logger.log('Error fetching unread messages for  channel ' + channel.id + ': ' + messageData.error);
      return;
    }
    var messages = messageData.messages.filter(message => message.text.includes(`@${mention}`));
    
     if (messages[0] != null) {
          if (messages[0].ts > lastTimestamp &&  messages[0].user != mention && messages[0].user == 'U078BNMP0PK') {            
                sendEmail(gmailUser);
      } else {
        Logger.log('no message ');
      }
  });
}

function sendEmail(gmailUser) {
  MailApp.sendEmail({
    to: gmailUser,
    subject: "Title", //need change
    body: "Content" // need change
  });
  Logger.log('message sent ');
}

function createTrigger() {
 PropertiesService.getScriptProperties().setProperty('lastTimestamp',  '1729554974.627479');
  ScriptApp.newTrigger('checkUnreadMessagesAndSendWhenActive')
    .timeBased()
    .everyMinutes(15) // need change this is every 15 min
    .create();

}
function endTrigger() {
   const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'checkUnreadMessagesAndSendWhenActive') {
        ScriptApp.deleteTrigger(trigger);
      }
    });

}
