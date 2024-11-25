var mongoose = require('mongoose');
// Define customer interaction model schema
var CustomerInteractionSchema = new mongoose.Schema({
    // phone number of customer
    phone: String,

    // status of the customer interaction
    complete: {
        type: Boolean,
        default: false
    },

    // service type (1=prescription, 2=store info, 3=rewards, 4=other)
    serviceType: Number,

    // notification preferences
    notificationsEnabled: {
        type: Boolean,
        default: false
    },

    // record of responses
    responses: [mongoose.Schema.Types.Mixed]
});

// For the given phone number and interaction, advance the customer interaction flow
CustomerInteractionSchema.statics.advanceInteraction = function(args, cb) {
    var interactionData = args.survey;  // keeping survey name for compatibility
    var phone = args.phone;
    var input = args.input;
    var customerInteraction;

    // Find current incomplete interaction
    CustomerInteraction.findOne({
        phone: phone,
        complete: false
    }, function(err, doc) {
        customerInteraction = doc || new CustomerInteraction({
            phone: phone
        });
        processInput();
    });

    function processInput() {
        var responseLength = customerInteraction.responses.length;
        var currentQuestion = interactionData[responseLength];

        function reask() {
            cb.call(customerInteraction, null, customerInteraction, responseLength);
        }

        if (input === undefined) return reask();

        var questionResponse = {};
        if (currentQuestion.type === 'boolean') {
            var isTrue = input === '1' || input.toLowerCase() === 'yes';
            questionResponse.answer = isTrue;
            // Set notification preferences if this is the notifications question
            if (responseLength === 1) {
                customerInteraction.notificationsEnabled = isTrue;
            }
        } else if (currentQuestion.type === 'number') {
            var num = Number(input);
            if (isNaN(num)) {
                return reask();
            } else {
                questionResponse.answer = num;
                // Set service type if this is the first question
                if (responseLength === 0) {
                    customerInteraction.serviceType = num;
                }
            }
        } else if (input.indexOf('http') === 0) {
            questionResponse.recordingUrl = input;
        } else {
            questionResponse.answer = input;
        }

        questionResponse.type = currentQuestion.type;
        customerInteraction.responses.push(questionResponse);

        if (customerInteraction.responses.length === interactionData.length) {
            customerInteraction.complete = true;
        }

        customerInteraction.save(function(err) {
            if (err) {
                reask();
            } else {
                cb.call(customerInteraction, err, customerInteraction, responseLength+1);
            }
        });
    }
};

// Export model
delete mongoose.models.SurveyResponse
delete mongoose.modelSchemas.SurveyResponse
var SurveyResponse = mongoose.model('SurveyResponse', SurveyResponseSchema);
module.exports = SurveyResponse;
