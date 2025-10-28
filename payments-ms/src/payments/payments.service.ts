import { Inject, Injectable } from '@nestjs/common';
import { envs, NATS_SERVICE } from 'src/config';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {

    private readonly stripe = new Stripe(envs.stripeSecret);

    constructor(
        @Inject(NATS_SERVICE) private readonly client: ClientProxy,
    ) {}

    async createPaymentSession(paymentSessionDto: PaymentSessionDto) {

        const { currency, items } = paymentSessionDto;

        const lineItems = items.map( item => {
            return {
                price_data: {
                    currency: currency,
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: Math.round( item.price * 100 ), // 20 dollars = 20.00
                },
                quantity: item.quantity,
            }
        })

        const session = await this.stripe.checkout.sessions.create({
            payment_intent_data: {
                metadata: {},
            },
            line_items: lineItems,
            mode: 'payment',
            success_url: envs.stripeSuccessUrl,
            cancel_url: envs.stripeCancelledUrl,
        });

        return {
            cancelUrl: session.cancel_url,
            success: session.success_url,
            url: session.url,
        }
    }

}
