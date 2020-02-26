import * as Yup from 'yup';
import Order from '../models/Order';

class OrderController {
  async index(req, res) {
    const order = await Order.findAll({
      attributes: [
        'id',
        'recipient_id',
        'deliveryman_id',
        'product',
        'signature_id',
        'start_date',
        'end_date',
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

    return res.json(order);
  }

  async update(req, res) {
    return res.json();
  }

  async delete(req, res) {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      res.json(400).json({ error: 'Order ID does not exists' });
    }

    order.destroy();

    return res.json();
  }
}

export default new OrderController();
