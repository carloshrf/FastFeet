import { isBefore, startOfDay, endOfDay, parseISO } from 'date-fns';
import { Op } from 'sequelize';
import Order from '../models/Order';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';

class OrderlistController {
  async index(req, res) {
    const order = await Order.findAll({
      where: {
        end_date: null,
        canceled_at: null,
        deliveryman_id: req.params.id,
      },
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'name',
            'street',
            'number',
            'complement',
            'city',
            'state',
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

    if (!order) {
      return res.status(400).json({ error: 'ID error' });
    }

    return res.json(order);
  }

  async update(req, res) {
    const { deliverymanid, orderid } = req.params;
    const { signature_id, start_date, end_date } = req.body;

    const order = await Order.findByPk(orderid);

    if (order.deliveryman_id !== Number(deliverymanid)) {
      return res
        .status(401)
        .json({ error: 'You cannot update a order of another deliveryman' });
    }

    if (!order) {
      return res.status(400).json({ error: 'Order does not exists' });
    }

    if (req.body.canceled_at) {
      return res.status(401).json({ error: 'You can not cancell an order.' });
    }

    if ((order.start_date || start_date) && end_date) {
      const thisStartDate = order.start_date;

      if (isBefore(end_date, start_date || thisStartDate)) {
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
        if (!req.body.signature_id && !order.signature_id) {
          return res.status(401).json({
            error:
              "To end an order is required the recipient's signature picture",
          });
        }
        order.end_date = parseISO(end_date);
      }
    }

    if (end_date && !(start_date || order.start_date)) {
      return res.status(401).json({
        error: 'You cannot end an order without start it',
      });
    }

    const orders = await Order.findAll({
      where: {
        deliveryman_id: deliverymanid,
        canceled_at: null,
        start_date: {
          [Op.between]: [startOfDay(new Date()), endOfDay(new Date())],
        },
      },
    });

    if (orders.length >= 5) {
      return res
        .status(401)
        .json({ error: 'You already reached the limit of 5 daily orders' });
    }

    const newOrder = await order.update(signature_id, start_date, end_date);

    return res.json(newOrder);
  }
}

export default new OrderlistController();
