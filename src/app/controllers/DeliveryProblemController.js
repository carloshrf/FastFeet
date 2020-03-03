import DeliveryProblem from '../models/DeliveryProblem';
import Order from '../models/Order';

class DeliveryProblemControll {
  async index(req, res) {
    const order_id = req.params.id;

    const delivery = await DeliveryProblem.findByPk(order_id);

    return res.json(delivery);
  }

  async store(req, res) {
    const { description } = req.body;
    const order_id = req.params.id;

    const a = await DeliveryProblem.create({
      order_id,
      description,
    });
    return res.json(a);
  }

  async delete(req, res) {
    const deliveryProb_id = req.params.id;

    const deliveryProb = await DeliveryProblem.findByPk(deliveryProb_id);

    const delivery = await Order.findByPk(deliveryProb.order_id);

    delivery.canceled_at = new Date();

    const nowDelivery = await delivery.save();

    return res.json(nowDelivery);
  }
}

export default new DeliveryProblemControll();
