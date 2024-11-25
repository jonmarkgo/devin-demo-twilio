const { pool } = require('../db');

class CustomerInteraction {
    constructor(data) {
        this.id = data.id;
        this.phone = data.phone;
        this.complete = data.complete || false;
        this.serviceType = data.service_type;
        this.notificationsEnabled = data.notifications_enabled || false;
        this.responses = data.responses || [];
    }

    static async findOne(query) {
        const result = await pool.query(
            'SELECT * FROM customer_interactions WHERE phone = $1 AND complete = $2 LIMIT 1',
            [query.phone, query.complete]
        );
        return result.rows[0] ? new CustomerInteraction(result.rows[0]) : null;
    }

    static async create(data) {
        const result = await pool.query(
            'INSERT INTO customer_interactions (phone, complete, service_type, notifications_enabled, responses) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [data.phone, false, null, false, '[]']
        );
        return new CustomerInteraction(result.rows[0]);
    }

    async save() {
        const result = await pool.query(
            'UPDATE customer_interactions SET complete = $1, service_type = $2, notifications_enabled = $3, responses = $4 WHERE phone = $5 RETURNING *',
            [this.complete, this.serviceType, this.notificationsEnabled, JSON.stringify(this.responses), this.phone]
        );
        return result.rows[0] ? new CustomerInteraction(result.rows[0]) : null;
    }

    static async advanceInteraction(args, cb) {
        try {
            const { phone, input, survey: interactionData } = args;

            // Find or create interaction
            let customerInteraction = await CustomerInteraction.findOne({ phone, complete: false });
            if (!customerInteraction) {
                customerInteraction = await CustomerInteraction.create({ phone });
            }

            const responseLength = customerInteraction.responses.length;
            const currentQuestion = interactionData[responseLength];

            if (input === undefined) {
                cb.call(customerInteraction, null, customerInteraction, responseLength);
                return;
            }

            const questionResponse = {};

            if (currentQuestion.type === 'boolean') {
                const isTrue = input === '1' || input.toLowerCase() === 'yes';
                questionResponse.answer = isTrue;
                if (responseLength === 1) {
                    customerInteraction.notificationsEnabled = isTrue;
                }
            } else if (currentQuestion.type === 'number') {
                const num = Number(input);
                if (isNaN(num)) {
                    cb.call(customerInteraction, null, customerInteraction, responseLength);
                    return;
                }
                questionResponse.answer = num;
                if (responseLength === 0) {
                    customerInteraction.serviceType = num;
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

            await customerInteraction.save();
            cb.call(customerInteraction, null, customerInteraction, responseLength + 1);
        } catch (err) {
            cb.call(null, err);
        }
    }
}

module.exports = CustomerInteraction;
