var VoiceResponse = require('twilio').twiml.VoiceResponse;
var CustomerInteraction = require('../models/SurveyResponse');
var interactionFlow = require('../survey_data');

// Main customer service interaction loop
exports.interview = function(request, response) {
    var phone = request.body.From;
    var input = request.body.RecordingUrl || request.body.Digits;
    var twiml = new VoiceResponse();

    // helper to append a new "Say" verb with Polly.Amy voice
    function say(text) {
        twiml.say({ voice: 'Polly.Amy'}, text);
    }

    // respond with the current TwiML content
    function respond() {
        response.type('text/xml');
        response.send(twiml.toString());
    }

    // Find an in-progress interaction or create one
    CustomerInteraction.advanceInteraction({
        phone: phone,
        input: input,
        survey: interactionFlow
    }, function(err, interaction, questionIndex) {
        var question = interactionFlow[questionIndex];

        if (err || !interaction) {
            say('We apologize, but an error has occurred. Please try calling CVS customer service again.');
            return respond();
        }

        // If interaction is complete, provide service-specific closing message
        if (!question) {
            var serviceType = interaction.serviceType;
            var endMessage = 'Thank you for contacting CVS customer service. ';

            switch(serviceType) {
                case 1:
                    endMessage += 'We will update you on your prescription status shortly.';
                    break;
                case 2:
                    endMessage += 'For immediate store information, visit CVS.com/stores.';
                    break;
                case 3:
                    endMessage += 'Your ExtraCare rewards information will be sent shortly.';
                    break;
                default:
                    endMessage += 'A customer service representative will follow up with you soon.';
            }

            say(endMessage);
            return respond();
        }

        // Add greeting for first interaction
        if (questionIndex === 0) {
            say('Welcome to CVS Customer Service. Please listen carefully to the following options.');
        }

        // Ask the current question
        say(question.text);

        // Handle different input types
        if (question.type === 'text') {
            say('Please leave your message after the beep. Press any key when finished.');
            twiml.record({
                transcribe: true,
                transcribeCallback: '/voice/' + interaction._id
                    + '/transcribe/' + questionIndex,
                maxLength: 120
            });
        } else if (question.type === 'boolean') {
            say('Press 1 for yes, or any other key for no.');
            twiml.gather({
                timeout: 10,
                numDigits: 1
            });
        } else {
            say('Please enter your selection using the number keys on your phone.');
            twiml.gather({
                timeout: 10,
                numDigits: 1
            });
        }

        respond();
    });
};

// Transcription callback for voice messages
exports.transcription = function(request, response) {
    var responseId = request.params.responseId;
    var questionIndex = request.params.questionIndex;
    var transcript = request.body.TranscriptionText;

    CustomerInteraction.findById(responseId, function(err, interaction) {
        if (err || !interaction || !interaction.responses[questionIndex])
            return response.status(500).end();

        interaction.responses[questionIndex].answer = transcript;
        interaction.markModified('responses');
        interaction.save(function(err, doc) {
            return response.status(err ? 500 : 200).end();
        });
    });
};
