import { Op } from 'sequelize';
import Order from '../models/Order';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';

class OrderlistController {
  async index(req, res) {
    const order = await Order.findAll({
      where: {
        end_date: {
          [Op.ne]: null,
        },
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
}

export default new OrderlistController();
