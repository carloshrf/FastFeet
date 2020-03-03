import DeliveryProblem from '../models/DeliveryProblem';
import Order from '../models/Order';

class DeliveryProblemControll {
  async index(req, res) {
    const delivery_id = req.params.id;

    const delivery = await DeliveryProblem.findByPk(delivery_id);

    return res.json(delivery);
  }

  async store(req, res) {
    const { description } = req.body;
    const delivery_id = req.params.id;

    const a = await DeliveryProblem.create({
      delivery_id,
      description,
    });
    return res.json(a);
  }

  async delete(req, res) {
    const delivery_id = req.params.id;

    const order = await Order.findByPk(delivery_id);

    order.canceled_at = new Date();

    const nowOrder = await order.save();

    return res.json(nowOrder);
  }
}

export default new DeliveryProblemControll();
