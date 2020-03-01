import { isBefore } from 'sequelize';
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
          attributes: [],
        },
      ],
    });

    if (!order) {
      return res.status(400).json({ error: 'ID error' });
    }

    return res.json(order);
  }

  async update(req, res) {
    const { id } = req.params;
    const { signature_id, start_date, end_date } = req.body;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(400).json({ error: 'Order does not exists' });
    }

    if (req.body.canceled_at) {
      if (order.end_date == null) {
        order.canceled_at = req.body.canceled_at;
      } else
        return res
          .status(401)
          .json({ error: 'You cannot cancell an ended order' });
    }

    if ((order.start_date || start_date) && end_date) {
      if (isBefore(end_date, start_date)) {
        return res.status(401).json({
          error: 'Is not possible finalize an order even before start it',
        });
      }

      if (end_date) {
        if (!signature_id) {
          return res.status(401).json({
            error: "You must to provide the recipient's signature picture",
          });
        }
      }
    }

    if (end_date && !(start_date || order.start_date)) {
      return res.status(401).json({
        error: 'You cannot end an order without start it',
      });
    }

    const newOrder = await order.update(req.body);

    return res.json(newOrder);
  }
}

export default new OrderlistController();
