var CustomerInteraction = require('../models/SurveyResponse');
var interactionFlow = require('../survey_data');

// Grab all the latest survey data for display in a quick and dirty UI
module.exports = function(request, response) {
    CustomerInteraction.find({
        complete: true
    }).limit(100).exec(function(err, docs) {
        if (err) {
            response.status(500).send(err);
        } else {
            // Transform data for UI display
            const results = docs.map(doc => ({
                phone: doc.phone,
                serviceType: getServiceTypeName(doc.serviceType),
                notificationsEnabled: doc.notificationsEnabled,
                responses: doc.responses,
                timestamp: doc._id.getTimestamp()
            }));

            response.send({
                interactionFlow: interactionFlow,
                results: results
            });
        }
    });
};

// Helper function to get service type name
function getServiceTypeName(type) {
    switch(type) {
        case 1: return 'Prescription Status';
        case 2: return 'Store Information';
        case 3: return 'ExtraCare Rewards';
        case 4: return 'Other Inquiry';
        default: return 'Unknown';
    }
}
