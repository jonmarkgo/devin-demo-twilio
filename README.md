<a href="https://www.twilio.com">
  <img src="https://static0.twilio.com/marketing/bundles/marketing/img/logos/wordmark-red.svg" alt="Twilio" width="250" />
</a>

# CVS Customer Service Communications - Powered by Twilio

Enhance customer service communications for CVS retail customers using voice calls and SMS text messages. This application provides automated customer service interactions for prescription status inquiries, store information requests, ExtraCare rewards balance checks, and general customer service inquiries.

## Features

- **Multi-Channel Support**: Interact with customers via both voice calls and SMS
- **Service Selection Menu**: Easy-to-use menu for different customer service needs
  - Prescription Status Updates
  - Store Information
  - ExtraCare Rewards Balance
  - General Inquiries
- **Notification Preferences**: Customers can opt-in to receive future updates
- **Voice Recognition**: Support for voice message recording and transcription
- **Admin Dashboard**: View and track customer interactions

## Local Development

First you need to install [Node.js](http://nodejs.org/) as well as [MongoDB](https://www.mongodb.org/)

To run the app locally:

1. Clone this repository and `cd` into it

   ```bash
   $ git clone git@github.com:TwilioDevEd/survey-node.git

   $ cd survey-node
   ```

1. Install dependencies

    ```bash
    $ npm install
    ```

1. Copy the sample configuration file and edit it to match your configuration

   ```bash
   $ cp .env.example .env
   ```
   Be sure to set `MONGO_URL`to your local mongo instance uri for example:
   `mongodb://localhost:27017/surveys` where `surveys` is the db name.

1. Run the application

    ```bash
    $ npm start
    ```
    Alternatively you might also consider using [nodemon](https://github.com/remy/nodemon) for this. It works just like
    the node command but automatically restarts your application when you change any source code files.

    ```bash
    $ npm install -g nodemon
    $ nodemon index
    ```
1. Expose your application to the wider internet using [ngrok](http://ngrok.com). This step
   is important because the application won't work as expected if you run it through
   localhost.

   ```bash
   $ npm i -g ngrok
   $ ngrok http 3000
   ```

   Once ngrok is running, open up your browser and go to your ngrok URL. It will
   look something like this: `http://9a159ccf.ngrok.io`

   You can read [this blog post](https://www.twilio.com/blog/2015/09/6-awesome-reasons-to-use-ngrok-when-testing-webhooks.html)
   for more details on how to use ngrok.

### Configuring Customer Service Flow

The application uses a structured interaction flow defined in `survey_data.js`. The flow includes:
1. Service type selection
2. Notification preferences
3. Additional feedback/questions

### Webhook Configuration

Configure your Twilio number's webhook URLs:
- Voice: `http://your-url/voice`
- SMS: `http://your-url/message`

## Meta

* No warranty expressed or implied. Software is as is. Diggity.
* [MIT License](http://www.opensource.org/licenses/mit-license.html)
* Lovingly crafted by Twilio Developer Education.
