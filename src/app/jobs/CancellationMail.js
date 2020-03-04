import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class CancellationMail {
  get key() {
    return 'CancellationMail';
  }

  async handle({ data }) {
    const { orderInfo, problem } = data;

    await Mail.sendMail({
      to: `${orderInfo.deliveryman.name} <${orderInfo.deliveryman.email}>`,
      subject: `A entrega de ID ${orderInfo.id} foi CANCELADA: `,
      template: 'newCancellation',
      context: {
        orderId: orderInfo.id,
        deliveryman: orderInfo.deliveryman.name,
        product: orderInfo.product,
        number: orderInfo.recipient.number,
        complement: orderInfo.recipient.complement,
        street: orderInfo.recipient.street,
        city: orderInfo.recipient.city,
        state: orderInfo.recipient.state,
        zipcode: orderInfo.recipient.zipcode,
        name: orderInfo.recipient.name,
        description: problem.description,
        cancelled_at: format(parseISO(orderInfo.canceled_at), "dd'/'MM'/'y", {
          locale: pt,
        }),
      },
    });
    console.log('teste2');
  }
}

export default new CancellationMail();
