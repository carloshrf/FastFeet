import * as Yup from 'yup';
import { parseISO, format } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';
import Deliveryman from '../models/Deliveryman';
import Recipient from '../models/Recipient';
import File from '../models/File';
import Order from '../models/Order';

class OrderController {
  async index(req, res) {
    const order = await Order.findAll({
      where: { canceled_at: null },
      attributes: [
        'id',
        'recipient_id',
        'deliveryman_id',
        'product',
        'signature_id',
        'start_date',
        'end_date',
        'canceled_at',
      ],
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: ['name'],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['name', 'email'],
        },
        {
          model: File,
          as: 'signature',
          attributes: ['name', 'path', 'url'],
        },
      ],
    });

    return res.json(order);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
      product: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json('Data validation fails');
    }

    const order = await Order.create(req.body);

    const orderInfo = await Order.findByPk(order.id, {
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'name',
            'street',
            'number',
            'complement',
            'state',
            'city',
            'zipcode',
          ],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['name', 'email'],
        },
      ],
    });

    await Mail.sendMail({
      to: `${orderInfo.deliveryman.name} <${orderInfo.deliveryman.email}>`,
      subject: 'Nova Encomenda',
      template: 'delivery',
      context: {
        deliveryman: orderInfo.deliveryman.name,
        product: orderInfo.product,
        number: orderInfo.recipient.number,
        complement: orderInfo.recipient.complement,
        street: orderInfo.recipient.street,
        city: orderInfo.recipient.city,
        state: orderInfo.recipient.state,
        zipcode: orderInfo.recipient.zipcode,
        name: orderInfo.recipient.name,
        date: format(orderInfo.createdAt, "dd'/'MM'/'y", { locale: pt }),
      },
    });

    return res.json(orderInfo);
  }

  async update(req, res) {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(400).json({ error: 'Order does not exists' });
    }

    order.start_date = parseISO(req.body.start_date);
    order.end_date = parseISO(req.body.end_date);

    const newOrder = await order.update();
    return res.json(newOrder);
  }

  async delete(req, res) {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      res.json(400).json({ error: 'Order ID does not exists' });
    }

    order.canceled_at = new Date();

    order.save();

    return res.json(order);
  }
}

export default new OrderController();
