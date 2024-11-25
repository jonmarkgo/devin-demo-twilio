var MessagingResponse = require('twilio').twiml.MessagingResponse;
var CustomerInteraction = require('../models/SurveyResponse');
var interactionFlow = require('../survey_data');
var logger = require('tracer').colorConsole();

// Handle SMS customer service interactions
module.exports = function(request, response) {
    var phone = request.body.From;
    var input = request.body.Body;

    // respond with message TwiML content
    function respond(message) {
        var twiml = new MessagingResponse();
        twiml.message(message);
        logger.debug(twiml.toString());
        response.type('text/xml');
        response.send(twiml.toString());
    }

    // Check for existing incomplete customer interaction
    CustomerInteraction.findOne({
        phone: phone,
        complete: false
    }, function(err, doc) {
        if (!doc) {
            var newInteraction = new CustomerInteraction({
                phone: phone
            });
            newInteraction.save(function(err, doc) {
                handleNextInteraction(err, doc, 0);
            });
        } else {
            CustomerInteraction.advanceInteraction({
                phone: phone,
                input: input,
                survey: interactionFlow
            }, handleNextInteraction);
        }
    });

    // Handle the next step in customer interaction
    function handleNextInteraction(err, interaction, questionIndex) {
        var question = interactionFlow[questionIndex];
        var responseMessage = '';

        if (err || !interaction) {
            return respond('We apologize, but an error has occurred. '
                + 'Please try contacting CVS customer service again.');
        }

        // If interaction is complete
        if (!question) {
            var serviceType = interaction.serviceType;
            var endMessage = 'Thank you for contacting CVS customer service. ';

            switch(serviceType) {
                case 1:
                    endMessage += 'We will update you on your prescription status shortly.';
                    break;
                case 2:
                    endMessage += 'For store hours and locations, visit CVS.com/stores.';
                    break;
                case 3:
                    endMessage += 'Your ExtraCare rewards information will be sent shortly.';
                    break;
                default:
                    endMessage += 'A customer service representative will follow up with you soon.';
            }

            return respond(endMessage);
        }

        // Add greeting for first interaction
        if (questionIndex === 0) {
            responseMessage += 'Welcome to CVS Customer Service! ';
        }

        // Add question text
        responseMessage += question.text;

        // Add instructions for boolean questions
        if (question.type === 'boolean') {
            responseMessage += ' Reply with YES or NO.';
        }

        respond(responseMessage);
    }
};
