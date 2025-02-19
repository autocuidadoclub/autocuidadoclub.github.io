// twilio-action.js

function sendTwilioMessage(phone) {
    // Use Twilio API to send a message
    fetch('/send-twilio-message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: phone })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Twilio message sent:', data);
    })
    .catch(error => {
        console.error('Error sending Twilio message:', error);
    });
}
