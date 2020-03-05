import DeliveryProblem from '../models/DeliveryProblem';
import Deliveryman from '../models/Deliveryman';
import Order from '../models/Order';
import Recipient from '../models/Recipient';
import Queue from '../../lib/Queue';
import CancellationMail from '../jobs/CancellationMail';

class DeliveryProblemControll {
  async index(req, res) {
    const order_id = req.params.id;

    const delivery = await DeliveryProblem.findByPk(order_id, {
      include: {
        model: Order,
        as: 'order',
        attributes: ['canceled_at'],
      },
    });

    return res.json(delivery);
  }

  async store(req, res) {
    const { description } = req.body;
    const order_id = req.params.id;

    const problemExists = await DeliveryProblem.findOne({
      where: { order_id },
    });

    if (problemExists) {
      return res
        .status(401)
        .json({ error: 'The order already have a registred problem' });
    }

    const problem = await DeliveryProblem.create({
      order_id,
      description,
    });

    return res.json(problem);
  }

  async delete(req, res) {
    const problemId = req.params.id;

    const problem = await DeliveryProblem.findByPk(problemId);

    const delivery = await Order.findByPk(problem.order_id);

    if (delivery.canceled_at) {
      return res
        .status(401)
        .json({ error: 'This order has already been canceled' });
    }

    delivery.canceled_at = new Date();

    const nowDelivery = await delivery.save();

    const orderInfo = await Order.findByPk(problem.order_id, {
      attributes: ['id', 'product', 'canceled_at'],
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

    await Queue.add(CancellationMail.key, {
      orderInfo,
      problem,
    });

    return res.json(nowDelivery);
  }
}

export default new DeliveryProblemControll();
