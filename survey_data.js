// Hard coded survey questions
module.exports = [
    {
        text: 'Welcome to CVS Customer Service! Please select a service: Press 1 for prescription status, 2 for store information, 3 for ExtraCare rewards balance, or 4 for other inquiries.',
        type: 'number'
    },
    {
        text: 'Would you like to receive text message notifications for future updates about your selected service?',
        type: 'boolean'
    },
    {
        text: 'Please share any additional feedback or questions you have, and a customer service representative will follow up if needed.',
        type: 'text'
    }
];
