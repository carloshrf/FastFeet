import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class DeliveryMaill {
  get key() {
    return 'DeliveryMaill';
  }

  async handle({ data }) {
    const { orderInfo } = data;

    await Mail.sendMail({
      to: `${orderInfo.deliveryman.name} <${orderInfo.deliveryman.email}>`,
      subject: `Nova Encomenda - ID de registro: ${orderInfo.id}`,
      template: 'newShipping',
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
        date: format(parseISO(orderInfo.createdAt), "dd'/'MM'/'y", {
          locale: pt,
        }),
      },
    });
  }
}

export default new DeliveryMaill();
