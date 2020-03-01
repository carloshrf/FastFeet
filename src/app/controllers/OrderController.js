import * as Yup from 'yup';
import { parseISO, format, isBefore } from 'date-fns';
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
      template: 'newShipping',
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
    const schema = Yup.object().shape({
      product: Yup.string(),
      start_date: Yup.date(),
      end_date: Yup.date(),
      canceled_at: Yup.date(),
      deliveryman_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Data validation error' });
    }

    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(400).json({ error: 'Order does not exists' });
    }

    if (req.body.start_date) {
      const start_date = parseISO(req.body.start_date);
      if (start_date.getHours() >= '8' && start_date.getHours() <= '17') {
        order.start_date = start_date;
      } else
        return res
          .status(400)
          .json({ error: 'Orders only be started between 7 at 18 hours' });
    }

    if (req.body.signature_id) {
      order.signature_id = req.body.signature_id;
    }

    if (req.body.end_date && req.body.canceled_at) {
      return res.status(401).json({
        error:
          'It is not possible send an end date together with cancellation date',
      });
    }
    // Algumas verificações de Date
    if (req.body.canceled_at) {
      if (order.end_date == null) {
        order.canceled_at = req.body.canceled_at;
      } else
        return res
          .status(401)
          .json({ error: 'You cannot cancell an ended order' });
    }

    if ((order.start_date || req.body.start_date) && req.body.end_date) {
      const { start_date } = req.body;
      const { end_date } = req.body;

      if (isBefore(end_date, start_date)) {
        return res.status(401).json({
          error: 'Is not possible finalize an order even before start it',
        });
      }

      if (end_date) {
        if (order.canceled_at != null) {
          return res
            .status(401)
            .json({ error: 'You cannot end a cancelled order' });
        }
        if (!req.body.signature_id) {
          return res
            .status(401)
            .json(
              "To end an order is required the recipient's signature picture"
            );
        }
        order.end_date = end_date;
      }
    }

    if (req.body.end_date && !(req.body.start_date || order.start_date)) {
      return res.status(401).json({
        error: 'You cannot end an order without start it',
      });
    }

    const newOrder = await order.save();
    return res.json(newOrder);
  }

  async delete(req, res) {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['name', 'email'],
        },
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'name',
            'zipcode',
            'street',
            'city',
            'number',
            'complement',
          ],
        },
      ],
    });

    if (!order) {
      res.json(400).json({ error: 'Order ID does not exists' });
    }

    await order.destroy();

    return res.json(order);
  }
}

export default new OrderController();
