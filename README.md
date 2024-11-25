<a href="https://www.twilio.com">
  <img src="https://static0.twilio.com/marketing/bundles/marketing/img/logos/wordmark-red.svg" alt="Twilio" width="250" />
</a>

# CVS Pharmacy Customer Communications Demo - Powered by Twilio

A frontend demonstration of how CVS Pharmacy can improve communications with retail customers using Twilio's messaging capabilities. This application showcases automated prescription notifications to enhance customer service and engagement.

[Live Demo](https://mellifluous-mochi-95851f.netlify.app)

## Features

- **Prescription Ready Notifications**: Send automated notifications when prescriptions are ready for pickup
- **Customer Response Handling**: Simulated customer response tracking for prescription notifications
- **Real-time Message Logging**: View message history and notification status
- **Mobile-Friendly Interface**: Responsive design for both desktop and mobile use

## Use Case

This demo addresses CVS Pharmacy's need to improve communications with retail customers by:
- Automating prescription status notifications
- Reducing customer wait times
- Improving pickup efficiency
- Enhancing overall customer experience

## Local Development

1. Clone this repository and `cd` into it
   ```bash
   git clone https://github.com/jonmarkgo/devin-demo-twilio.git
   cd devin-demo-twilio
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   ```
   Add your Twilio credentials:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_number
   ```

4. Run the application
   ```bash
   npm start
   ```
   The application will be available at `http://localhost:3000`

## Deployment

This demo is deployed using Netlify for the frontend interface. The live demo can be accessed at:
[https://mellifluous-mochi-95851f.netlify.app](https://mellifluous-mochi-95851f.netlify.app)

## Implementation Details

The application demonstrates:
- Frontend interface for sending prescription notifications
- Simulated customer response handling
- Message history tracking
- CVS-branded user interface

In a production environment, this would be connected to:
- Twilio's SMS API for real message delivery
- CVS's prescription management system
- Customer database for phone number verification

## Meta

* No warranty expressed or implied. Software is as is.
* [MIT License](http://www.opensource.org/licenses/mit-license.html)
* Demo created for CVS Pharmacy using Twilio's messaging capabilities
